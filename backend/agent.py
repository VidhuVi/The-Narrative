from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
import os
import asyncio
from dotenv import load_dotenv

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.upstash import UpstashVectorStore

load_dotenv()

# We need GEMINI_API_KEY in the environment
llm = ChatGoogleGenerativeAI(model="models/gemini-3-flash-preview", temperature=0)

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

# --- Nodes ---
async def analyst_node(state: AgentState):
    """Extracts facts, decisions, and action items."""
    print("Agent: Analyst is processing...")
    prompt = f"Analyze this transcript and extract all decisions and action items. Do not invent any.\n\n{state['transcript']}"
    structured_llm = llm.with_structured_output(AnalystOutput)
    res = await structured_llm.ainvoke(prompt)
    return {
        "decisions": [d.model_dump() for d in res.decisions],
        "action_items": [a.model_dump() for a in res.action_items]
    }

async def eq_node(state: AgentState):
    """Analyzes the tone and sentiment of the conversation."""
    print("Agent: EQ Specialist is processing...")
    prompt = f"Analyze the emotional intelligence, alignment, and sentiment of this meeting (score 0-100). Identify conflict zones.\n\n{state['transcript']}"
    structured_llm = llm.with_structured_output(SentimentOutput)
    res = await structured_llm.ainvoke(prompt)
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
    res = await llm.ainvoke(system_prompt)
    
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

# Parallel execution for Analyst and EQ to save processing time
builder.add_edge(START, "analyst")
builder.add_edge(START, "eq")

# Executive must wait for BOTH to finish before writing the summary
builder.add_edge(["analyst", "eq"], "executive")
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
    
    # Use Google Embeddings (768 dimensions)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    
    # We increase chunk size to reduce the total number of Google API calls per meeting
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=400)
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

    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
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

    response = await llm.ainvoke(prompt)
    
    # Gemini 3 content might return a list of rich content objects instead of a pure string
    content = response.content
    if isinstance(content, list):
        content = "\n".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
    elif not isinstance(content, str):
        content = str(content)
        
    return content

