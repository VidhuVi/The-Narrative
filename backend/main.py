import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from agent import process_transcript_swarm, chat_global, index_transcript_to_vector_db
from dotenv import load_dotenv
import bleach

load_dotenv()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# HTTPS Enforcement in Production
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Restrict CORS to specific frontend domains
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
]
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin securely
import base64
import json

base64_cred = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
cred_path = "firebase-admin-key.json"

if base64_cred:
    print("Connecting to Firebase Admin SDK via Base64 Environment Variable...")
    clean_b64 = base64_cred.strip().strip("'").strip('"')
    cred_json = json.loads(base64.b64decode(clean_b64).decode("utf-8"))
    cred = credentials.Certificate(cred_json)
    admin_app = firebase_admin.initialize_app(cred)
    
    # If the user is using Google AI Studio, their database is not named (default).
    database_id = os.getenv("FIREBASE_DATABASE_ID", "(default)")
    if database_id != "(default)":
        print(f"Connecting to named database: {database_id}")
        
    db = firestore.client(app=admin_app, database_id=database_id)
    
elif os.path.exists(cred_path):
    print("Connecting to Firebase Admin SDK via local JSON file...")
    cred = credentials.Certificate(cred_path)
    admin_app = firebase_admin.initialize_app(cred)
    
    # If the user is using Google AI Studio, their database is not named (default).
    database_id = os.getenv("FIREBASE_DATABASE_ID", "(default)")
    if database_id != "(default)":
        print(f"Connecting to named database: {database_id}")
        
    db = firestore.client(app=admin_app, database_id=database_id)
    
else:
    print(f"\nCRITICAL WARNING: FIREBASE_SERVICE_ACCOUNT_BASE64 env var missing and '{cred_path}' not found.")
    print("You MUST provide your Firebase service account JSON key to connect your app to the database.\n")
    db = None

class MeetingProcessRequest(BaseModel):
    meetingId: str
    transcript: str

# Robust Auth Dependancy
async def verify_token(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized. Missing or invalid Authorization header.")
    
    token = authorization.split("Bearer ")[1]
    try:
        # Cryptographically verify the token Signature using Firebase Admin context, checking revocation
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        # Prevent forever-active tokens by enforcing a 4 hour max lifecycle on auth_time
        if time.time() - decoded_token.get("auth_time", 0) > 4 * 3600:
            raise HTTPException(status_code=401, detail="Unauthorized. Token is older than 4 hours. Please refresh your session.")
        return decoded_token["uid"]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized. Invalid or expired token.")

@app.post("/process-meeting")
@limiter.limit("5/minute")
async def process_meeting(request: Request, req: MeetingProcessRequest, uid: str = Depends(verify_token)):
    if not db:
        raise HTTPException(status_code=500, detail="Firebase Admin key not found on server.")
        
    print(f"\n[+] Received transcript for Meeting {req.meetingId} from user {uid}. Launching Agent Swarm...")
    
    # IDOR Check: Ensure the user actually owns the meetingId they are trying to process
    meeting_ref = db.collection("meetings").document(req.meetingId)
    meeting_doc = meeting_ref.get()
    if not meeting_doc.exists:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    m_data = meeting_doc.to_dict()
    if m_data.get("authorId") != uid:
        raise HTTPException(status_code=403, detail="Forbidden. You do not have ownership of this meeting.")

    # Sanitize incoming payload to strip script tags or HTML execution vectors
    safe_transcript = bleach.clean(req.transcript)
    
    try:
        # 1. Trigger the LangGraph Multi-Agent Pipeline
        result_state = await process_transcript_swarm(safe_transcript)
        print("\n[+] Swarm execution complete. Saving insights to Firebase...")
        
        # Branch out to Pinecone Indexing
        await index_transcript_to_vector_db(req.meetingId, safe_transcript, uid)
        
        # 2. Extract agent artifacts
        decisions = result_state.get("decisions", [])
        action_items = result_state.get("action_items", [])
        sentiment = result_state.get("sentiment_summary", {})
        exec_summary = result_state.get("executive_summary", "")
        
        # Dynamically extract all unique speakers identified by the EQ Agent
        detected_speakers = list(set([seg.get("speaker", "Unknown") for seg in sentiment.get("segments", [])]))
        
        batch = db.batch()
        
        # Update core meeting document with the Executive Agent's summary
        batch.update(meeting_ref, {
            "status": "processed",
            "summary": exec_summary,
            "sentimentData": sentiment,
            "speakers": detected_speakers
        })
        
        # Write the Analyst Agent's decisions
        decisions_ref = db.collection("decisions")
        for d in decisions:
            d_doc = decisions_ref.document()
            batch.set(d_doc, {
                **d,
                "meetingId": req.meetingId,
                "authorId": uid
            })
            
        # Write the Analyst Agent's action items
        actions_ref = db.collection("actionItems")
        for a in action_items:
            a_doc = actions_ref.document()
            batch.set(a_doc, {
                **a,
                "meetingId": req.meetingId,
                "authorId": uid,
                "status": "pending"
            })
            
        # Securely execute all writes transactionally
        batch.commit()
        print(f"[SUCCESS] Meeting {req.meetingId} fully processed and stored.\n")
        return {"status": "success", "message": "Agents successfully processed the data."}

    except Exception as e:
        print(f"[ERROR] Agent pipeline failed: {e}")
        if db:
            db.collection("meetings").document(req.meetingId).update({"status": "error"})
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    query: str
    meetingIds: list[str]

@app.post("/chat-inquiry")
@limiter.limit("20/minute")
async def chat_inquiry(request: Request, req: ChatRequest, uid: str = Depends(verify_token)):
    print(f"\n[+] Received global text chat request from user {uid}.")
    try:
        reply = await chat_global(req.query, req.meetingIds, uid)
        return {"response": reply}
    except Exception as e:
        print(f"[ERROR] Chat failure: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
