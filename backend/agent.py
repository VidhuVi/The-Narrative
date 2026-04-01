from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

load_dotenv()

# We need GEMINI_API_KEY in the environment
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

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
    prompt = (
        f"You are the Executive Summarizer. Synthesize the findings below into a 3 sentence professional executive brief.\n"
        f"Decisions Made: {state.get('decisions')}\n"
        f"Action Items: {state.get('action_items')}\n"
        f"Sentiment Overview: {state.get('sentiment_summary')}\n"
    )
    res = await llm.ainvoke(prompt)
    return {
        "executive_summary": res.content
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

async def chat_global(query: str, transcripts_context: str) -> str:
    """
    Takes the concatenated history of the user's selected meetings and answers a question.
    """
    prompt = f"""You are an AI assistant for 'The Narrative', an editorial intelligence hub. 
Answer the user's question explicitly based on the following meeting transcripts. 

CRITICAL INSTRUCTION: You must ALWAYS cite your sources using exact verbatim quotes from the part of the transcript your answer came from.
Format citations cleanly, for example:
According to the [Meeting Title]: > 'insert exact transcript quote here'

Context:
{transcripts_context}

Question: {query}"""

    # We use a standard generation call (not structured JSON output) to return a markdown string
    response = await llm.ainvoke(prompt)
    return response.content
