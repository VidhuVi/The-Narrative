from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
import os
import asyncio
import json
import re
from dotenv import load_dotenv

from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.upstash import UpstashVectorStore

load_dotenv()

# LLM Configuration: Dual-Key Multiplexing for Rate Limit Optimization
# llm_primary: Used for Analyst and Executive nodes
# llm_secondary: Used for EQ Specialist and Chat Inquiry (uses secondary account quota)
PRIMARY_KEY = os.getenv("GEMINI_API_KEY")
SECONDARY_KEY = os.getenv("GEMINI_API_KEY2") or PRIMARY_KEY

llm_primary = ChatGoogleGenerativeAI(
    model="models/gemini-3-flash-preview", 
    google_api_key=PRIMARY_KEY,
    temperature=0, 
    max_retries=5, 
    timeout=120
)

llm_secondary = ChatGoogleGenerativeAI(
    model="models/gemini-3-flash-preview", 
    google_api_key=SECONDARY_KEY,
    temperature=0, 
    max_retries=5, 
    timeout=120
)

# --- State ---
class AgentState(TypedDict):
    transcript: str
    decisions: List[dict]
    action_items: List[dict]
    sentiment_summary: dict
    executive_summary: str

# --- Pydantic Schemas for Structured Output ---
class DecisionExtraction(BaseModel):
    text: str = Field(description="The actual decision made")
    category: str = Field(description="Category (e.g., Strategic, Technical, Operational, Financial)")

class ActionItemExtraction(BaseModel):
    task: str = Field(description="What needs to be done")
    responsible: str = Field(description="Who is doing it (infer if possible)")
    dueDate: str = Field(description="When it is due, if mentioned")

class AnalystOutput(BaseModel):
    decisions: List[DecisionExtraction]
    action_items: List[ActionItemExtraction]

class SentimentSegment(BaseModel):
    time: str = Field(description="Approximate timestamp or 'General'")
    text: str = Field(description="The quote or dialogue snippet")
    sentiment: str = Field(description="Must be exactly 'Agreement', 'Conflict', or 'Neutral'")
    speaker: str = Field(description="The person who spoke")

class SentimentOutput(BaseModel):
    overall: int = Field(description="Overall sentiment score of the meeting from 0-100")
    segments: List[SentimentSegment] = Field(description="Detailed timeline of emotional shifts in the meeting. Pick the most important 5-10 statements.")

# --- Helper for Robust JSON Extraction ---
async def safe_invoke(node_name: str, model_schema, prompt: str, target_llm: ChatGoogleGenerativeAI):
    """
    Tries to invoke the specific model instance. If it fails due to formatting, 
    it manually extracts the JSON from the text.
    """
    key_val = target_llm.google_api_key.get_secret_value() if hasattr(target_llm.google_api_key, "get_secret_value") else str(target_llm.google_api_key)
    print(f"[+] {node_name} using API Key ending in: ...{key_val[-4:] if key_val else 'NONE'}")
    try:
        structured_llm = target_llm.with_structured_output(model_schema)
        # Try regular structured invocation
        return await structured_llm.ainvoke(prompt)
    except Exception as e:
        print(f"[!] {node_name} structured parse failed, attempting manual regex fallback: {e}")
        # Fallback: Invoke raw and cut the JSON out of the chat transcript
        raw_res = await target_llm.ainvoke(prompt)
        text = raw_res.content
        if isinstance(text, list):
            text = str(text)
            
        # Regex to find everything between the first { and last }
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(0))
                return model_schema(**data)
            except Exception as json_err:
                print(f"[!!] Manual JSON parsing failed: {json_err}")
        
        raise ValueError(f"Model failed to produce valid JSON for {node_name}. Response received: {text[:200]}...")

# --- Nodes ---
async def analyst_node(state: AgentState):
    """Extracts facts, decisions, and action items."""
    print("Agent: Analyst is processing...")
    prompt = (
        f"You are a structured data extractor. Extract all decisions and action items from the transcript.\n"
        f"MANDATORY: Return ONLY a raw JSON object matching the requested schema. No conversational text.\n\n"
        f"<transcript>\n{state['transcript']}\n</transcript>"
    )
    res = await safe_invoke("Analyst", AnalystOutput, prompt, llm_primary)
    return {
        "decisions": [d.model_dump() for d in res.decisions],
        "action_items": [a.model_dump() for a in res.action_items]
    }

async def eq_node(state: AgentState):
    """Analyzes the tone and sentiment of the conversation."""
    print("Agent: EQ Specialist is processing...")
    prompt = (
        f"Analyze the emotional intelligence and sentiment of this meeting (0-100). Identify 5-10 key statements.\n"
        f"MANDATORY: Return ONLY a raw JSON object matching the requested schema. No conversational text.\n\n"
        f"<transcript>\n{state['transcript']}\n</transcript>"
    )
    res = await safe_invoke("EQ", SentimentOutput, prompt, llm_secondary)
    return {
        "sentiment_summary": res.model_dump()
    }

async def executive_node(state: AgentState):
    """Generates the executive summary given the raw facts and sentiment."""
    print("Agent: Executive is processing...")
    # The executive node runs AFTER analyst and eq.
    # We pass the extracted metadata plus transcript to craft a brief.
    system_prompt = (
        f"You are the Executive Summarizer. Synthesize the findings below into a 3 sentence professional executive brief.\n"
        f"Decisions Made: {state.get('decisions')}\n"
        f"Action Items: {state.get('action_items')}\n"
        f"Sentiment Overview: {state.get('sentiment_summary')}\n"
    )
    res = await llm_primary.ainvoke(system_prompt)
    
    # Gemini 3 content might return a list of rich content objects instead of a pure string
    content = res.content
    if isinstance(content, list):
        content = "\n".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
    elif not isinstance(content, str):
        content = str(content)
        
    return {
        "executive_summary": content
    }

# --- Build Graph ---
builder = StateGraph(AgentState)
builder.add_node("analyst", analyst_node)
builder.add_node("eq", eq_node)
builder.add_node("executive", executive_node)

# Sequential execution to prevent Gemini API 429 Rate Limit (Infinite Retry) hangs
builder.add_edge(START, "analyst")
builder.add_edge("analyst", "eq")
builder.add_edge("eq", "executive")
builder.add_edge("executive", END)

graph = builder.compile()

async def process_transcript_swarm(transcript_text: str) -> dict:
    """Entrypoint function called by FastAPI"""
    initial_state = {
        "transcript": transcript_text,
        "decisions": [],
        "action_items": [],
        "sentiment_summary": {},
        "executive_summary": ""
    }
    # Invoke the graph asynchronously
    final_state = await graph.ainvoke(initial_state)
    return final_state

async def index_transcript_to_vector_db(meeting_id: str, transcript: str, author_id: str):
    """Chunks the transcript and stores it in Upstash with metadata."""
    print("Agent: Vectorizing transcript into Upstash Vector DB...")
    if not os.getenv("UPSTASH_VECTOR_REST_URL") or not os.getenv("UPSTASH_VECTOR_REST_TOKEN"):
        print("WARNING: Upstash credentials not set. Skipping vector indexing.")
        return
    
    # Use HuggingFace Serverless API (384 dimensions) - Free compute on Hub!
    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
    )
    
    # We reduce chunk size back to 1000 because all-MiniLM max token length is 256 (~1000 chars)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(transcript)
    
    metadatas = [{"meetingId": meeting_id, "authorId": author_id, "text": chunk} for chunk in chunks]
    
    vectorstore = UpstashVectorStore(
        embedding=embeddings
    )
    
    # Safe batching: 5 chunks at a time with a 2 second sleep to bypass the Google TPM Limit
    batch_size = 5
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i : i + batch_size]
        batch_metadatas = metadatas[i : i + batch_size]
        
        print(f"Agent: Indexing batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1} to Upstash...")
        vectorstore.add_texts(texts=batch_chunks, metadatas=batch_metadatas)
        
        if i + batch_size < len(chunks):
            await asyncio.sleep(2)

    print("Agent: Finished indexing all vector chunks into Upstash.")

async def chat_global(query: str, meeting_ids: list[str], author_id: str) -> str:
    """
    Retrieves the most relevant chunks from Upstash and answers the question.
    """
    if not os.getenv("UPSTASH_VECTOR_REST_URL") or not os.getenv("UPSTASH_VECTOR_REST_TOKEN"):
        return "Error: Upstash Vector Database is not configured."

    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=os.getenv("HF_TOKEN")
    )
    vectorstore = UpstashVectorStore(embedding=embeddings)
    
    # Retrieve top K matches with metadata filter
    if not meeting_ids:
        return "Please select at least one meeting to query against."

    # Using string-based metadata filters supported by Upstash
    meeting_ids_str = "('" + "', '".join(meeting_ids) + "')"
    filter_str = f"authorId = '{author_id}' AND meetingId IN {meeting_ids_str}"

    results = vectorstore.similarity_search(
        query,
        k=8,
        filter=filter_str
    )
    
    context_chunks = "\n\n---\n\n".join([doc.page_content for doc in results])

    prompt = f"""You are an AI assistant for 'The Narrative', an editorial intelligence hub. 
Answer the user's question explicitly based on the following retrieved meeting transcript segments. 

CRITICAL INSTRUCTION: You must ALWAYS cite your sources using exact verbatim quotes from the part of the transcript your answer came from.
Format citations cleanly, for example:
> 'insert exact transcript quote here'

Context from relevant meeting segments:
{context_chunks}

Question: {query}"""

    response = await llm_secondary.ainvoke(prompt)
    
    # Gemini 3 content might return a list of rich content objects instead of a pure string
    content = response.content
    if isinstance(content, list):
        content = "\n".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
    elif not isinstance(content, str):
        content = str(content)
        
    return content

