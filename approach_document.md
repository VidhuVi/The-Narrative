# Solution Approach & Architecture Document

## 1. Feature Adherence & Implementation
Our solution satisfies all core requirements for the **"Meeting Intelligence Hub"**:
* **File Ingestion:** Natively accepts both `.TXT` and `.VTT` formats.
* **Extraction Engine:** Automatically extracts strategic **Decisions** and assigned **Action Items** (detailing *Who*, *What*, and *By When*).
* **Workstream & Export:** Presents all extractions in a clean, comprehensive dashboard with robust **CSV Export** capabilities.
* **Contextual Chatbot:** Supports natural language semantic search across uploaded transcripts, effectively handles speaker-specific questions, and algorithmically cites verbatim sources (meeting name and context) for every answer.

## 2. Solution Design 
Our solution, *The Narrative*, implements a **decoupled, event-driven Monorepo architecture** designed to safely handle the computational overhead of Large Language Models while preserving a highly responsive UI.

Instead of running long, blocking API calls directly from the user's browser, the system employs an asynchronous event pattern:
1. **Ingestion:** The React UI uploads the raw transcript payload to a Firebase NoSQL document.
2. **Delegation:** The frontend pings the Python FastAPI backend, offloading the processing workload.
3. **Execution:** The backend launches an advanced **LangGraph Multi-Agent Swarm**. We utilize specialized agents—a *Lead Analyst* (for decisions/actions), an *Executive* (for summaries), and an *EQ Specialist* (for mapping conversational sentiment timelines). 
4. **Resolution:** The Python agents map their findings back to the Firestore document. The React UI, listening via real-time WebSocket connections built into Firebase, natively updates the user's dashboard the millisecond the data is ready.

This design prevents browser timeouts on 20+ page transcripts and enables horizontal scaling of the Python AI workers independent of the web frontend.

## 2. Tech Stack Choices
* **Frontend:** React + Vite + TailwindCSS. We chose Vite for its unmatched Hot Module Replacement speed during development. Tailwind was selected to heavily enforce a "premium," design-system driven aesthetic without the bloat of traditional CSS files.
* **Backend:** Python + FastAPI. Python is the definitive ecosystem for AI orchestration. FastAPI provides rapid, asynchronous API endpoints perfect for triggering internal LangGraph workflows.
* **Database & Sync:** Firebase (Firestore). Chosen specifically for its Native Realtime Subscriptions. Instead of polling our database to see if the AI is finished, Firestore actively pushes the final state to the client over WebSockets.
* **AI Engine (Hybrid Local/Cloud Stack):** 
  * **Generative Reasoning:** Google Gemini (1.5 / 3.0 Flash) handles the massive context window logic for the Multi-Agent Swarm.
  * **Vector Embeddings (Local):** Because this branch specifically demonstrates local embedding to save money, we run a local PyTorch `sentence-transformers` neural net directly on the web server's CPU to compute `384` dimensional vector embeddings offline before syncing with the cloud.

## 3. Improvements With More Time
If given an additional extensive dev cycle, I would implement the following major architectural enhancements:

1. **Direct Audio Processing (Whisper API):** Right now, the system relies on pre-transcribed text or `.vtt` files. Integrating a direct audio ingestion pipeline (e.g., OpenAI Whisper or Google STT) would remove friction, allowing users to drop raw `.mp3` files into the platform.
2. **Vector Database Integration (RAG) (IMPLEMENTED):** We implemented a robust RAG pipeline via **Upstash Serverless Vector DB**. Using offline local HuggingFace embeddings extracted via PyTorch, chunk vectors are mapped into Upstash for permanent storage. The contextual chatbot engine natively performs Retrieval-Augmented Generation (RAG) by fetching only the top highly relevant semantic chunks.
3. **Enterprise SSO & RBAC:** Implementing rigid Role-Based Access Control and SAML SSO so that highly sensitive internal strategy meetings are only available for ingestion and querying by authorized personnel.
