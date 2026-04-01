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
- **Meeting Ingestion**: Upload `.txt` or `.vtt` files.
- **Agentic Extractor**: LangGraph swarm parses out verifiable Decisions and Action Items in the background.
- **The Workstream**: A global task manager displaying all assigned Action Items with real-time checkbox syncing to Firebase. Includes CSV export targeting any slice of the data.
- **Contextual Global Chat**: Query multiple transcripts simultaneously. The AI is strictly prompted to cite its sources using verbatim quotes extracted directly from the transcript.
