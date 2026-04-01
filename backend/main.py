from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import firebase_admin
from firebase_admin import credentials, firestore
from agent import process_transcript_swarm
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow localhost Vite
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin securely
cred_path = "firebase-admin-key.json"
if os.path.exists(cred_path):
    print("Connecting to Firebase Admin SDK...")
    cred = credentials.Certificate(cred_path)
    admin_app = firebase_admin.initialize_app(cred)
    
    # If the user is using Google AI Studio, their database is not named (default).
    database_id = os.getenv("FIREBASE_DATABASE_ID", "(default)")
    if database_id != "(default)":
        print(f"Connecting to named database: {database_id}")
        
    db = firestore.client(app=admin_app, database_id=database_id)
else:
    print(f"\nCRITICAL WARNING: '{cred_path}' not found in the backend directory.")
    print("You MUST place your Firebase service account JSON key here to connect your app to the database.\n")
    db = None

class MeetingProcessRequest(BaseModel):
    meetingId: str
    authorId: str
    transcript: str

@app.post("/process-meeting")
async def process_meeting(req: MeetingProcessRequest):
    if not db:
        raise HTTPException(status_code=500, detail="Firebase Admin key not found on server.")
        
    print(f"\n[+] Received transcript for Meeting {req.meetingId}. Launching Agent Swarm...")
    
    try:
        # 1. Trigger the LangGraph Multi-Agent Pipeline
        result_state = await process_transcript_swarm(req.transcript)
        print("\n[+] Swarm execution complete. Saving insights to Firebase...")
        
        # 2. Extract agent artifacts
        decisions = result_state.get("decisions", [])
        action_items = result_state.get("action_items", [])
        sentiment = result_state.get("sentiment_summary", {})
        exec_summary = result_state.get("executive_summary", "")
        
        batch = db.batch()
        
        # Update core meeting document with the Executive Agent's summary
        meeting_ref = db.collection("meetings").document(req.meetingId)
        batch.update(meeting_ref, {
            "status": "processed",
            "summary": exec_summary,
            "sentimentData": sentiment
        })
        
        # Write the Analyst Agent's decisions
        decisions_ref = db.collection("decisions")
        for d in decisions:
            d_doc = decisions_ref.document()
            batch.set(d_doc, {
                **d,
                "meetingId": req.meetingId,
                "authorId": req.authorId
            })
            
        # Write the Analyst Agent's action items
        actions_ref = db.collection("actionItems")
        for a in action_items:
            a_doc = actions_ref.document()
            batch.set(a_doc, {
                **a,
                "meetingId": req.meetingId,
                "authorId": req.authorId,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
