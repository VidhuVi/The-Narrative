# The Narrative: Editorial Intelligence Hub

The Narrative is an AI-powered system that transforms raw meeting transcripts into structured intelligence. It automatically surfaces strategic decisions, action items, and conversational sentiment, eliminating the "double work" cycle of re-reading transcripts.

## 🏗️ Architecture
This project is structured as a **Monorepo**:
- `/frontend`: A React + Vite SPA built with TailwindCSS and Firebase.
- `/backend`: A Python FastAPI server orchestrating a LangGraph Multi-Agent Swarm (Analyst, Executive, EQ Specialist).

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Python (3.11+)
- Firebase Account (Firestore & Auth enabled)
- Gemini API Key

### 2. Environment Variables
You must configure environment variables for both the frontend and backend. 

**Frontend (`/frontend/.env`):**
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (`/backend/firebase-admin-key.json`):**
Place your Firebase Admin Service Account JSON file inside the backend directory.

### 3. Running the Backend (Swarm API)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Running the Frontend (React UI)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

## 🧠 Core Features
- **Meeting Ingestion**: Upload `.txt` or `.vtt` files via a simple drag-and-drop interface.
- **Agentic Extractor**: A LangGraph swarm parses out verifiable **Decisions** (agreements made) and **Action Items**. For every task, it specifically extracts *Who* is responsible, *What* needs to be done, and *By When* (due dates).
- **Master Workstream**: A global task manager presenting all extracted decisions and action items in a clean, readable layout. It natively supports **CSV Export** to slice and download the data.
- **Contextual Global Chat**: Query multiple transcripts simultaneously via natural language. The AI is engineered to reason over speaker-specific history and strictly prompt-instructed to **cite its sources**, showing precisely which meeting and transcript selection the answer originated from.
