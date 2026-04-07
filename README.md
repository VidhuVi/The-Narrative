# The Narrative: Editorial Intelligence Hub

## The Problem
Organizations hold dozens of meetings every week, each producing lengthy transcripts where critical information—decisions, assigned tasks, and strategic reasoning—frequently gets buried. This forces team members to manually re-read pages of dialogue, resulting in lost action items, forgotten context, and a painful cycle of re-discussing topics instead of executing them.

## The Solution
The Narrative transforms raw meeting transcripts into structured, actionable intelligence out of the box. By uploading `.txt` or `.vtt` transcripts into our system, an orchestrated LLM Agent Swarm automatically extracts strategic decisions and action items (specifically detailing *Who*, *What*, and *By When*). The project offers a "Master Workstream" dashboard to track all generated tasks with direct CSV export capabilities. Furthermore, a contextual natural-language chatbot empowers users to query across organizational transcripts, delivering accurate, source-cited answers that eliminate manual review.

## Tech Stack
* **Programming Languages:** Python, TypeScript, HTML, CSS
* **Frameworks:** React, Vite, FastAPI, TailwindCSS
* **Databases:** Firebase (Firestore) for real-time document syncing
* **APIs & Third-Party Tools:** Google Gemini Large Language Model APIs, LangGraph, Firebase Authentication

## Setup Instructions

### 1. Prerequisites Configuration
Ensure you have the following installed and pre-configured before starting:
- Node.js (v18+)
- Python (3.11+)
- Firebase Project (with Firestore & Auth enabled)
- Valid Gemini API Key

### 2. Environment Setup
Configure your environment keys for both the frontend and backend.

**Frontend (`/frontend/.env`):**
Create an `.env` file in the frontend directory with the following variables:
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (`/backend/firebase-admin-key.json`):**
Place your Firebase secure Admin Service Account JSON file inside the `backend/` directory and ensure it is named `firebase-admin-key.json`.

### 3. Install Dependencies & Run the Project Locally

#### Step 1: Run the Backend (Python FastAPI)
Open your terminal, navigate to the backend directory, install requirements, and boot up the server:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Developers on Windows should use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Step 2: Run the Frontend (React UI)
Open a **new** terminal window, navigate to the frontend directory, install Node modules, and start the development server:
```bash
cd frontend
npm install
npm run dev
```

Once running, navigate to the localhost URL provided by Vite in the frontend terminal to use the application end-to-end.
