# SmartLearn.io (Roadmap Generator V2) - Project Context

This document is designed to provide AI models (like ChatGPT, Claude, etc.) with a comprehensive understanding of the project's architecture, technologies, and file structures.

## 1. Project Overview
**Name**: SmartLearn.io (Repo: roadmap-generatorV2)
**Description**: An AI-powered learning platform that generates personalized roadmaps, mock interviews, and quizzes. 
**Key Features**:
- Interactive phase-based roadmaps (visualized as node trees).
- AI Mock Interviews (text-based or voice-enabled using Vapi AI).
- Quiz Generation from subject topics or uploaded files (PDF, DOCX, Excel).
- YouTube Video recommendations ranked by a Custom Machine Learning model (Python-based).
- Token-based usage and subscription plans (Razorpay integration).
- Authentication and User Data Management (Supabase).

## 2. Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, React Router, React Flow (for tree/node diagrams).
- **Backend**: Node.js, Express, CORS, Multer (file uploads).
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security).
- **AI Models**: Google Generative AI (Gemini), Mistral AI, OpenAI, Vapi AI (for Voice).
- **Data Parsers**: `pdf-parse`, `mammoth` (Word), `xlsx` (Excel).
- **Machine Learning**: Python 3, `pandas`, YouTube Data API, `scikit-learn` (Random Forest for video ranking).
- **Payments**: Razorpay.

## 3. High-Level Architecture & Directory Structure
```text
roadmap-generatorV2/
├── database/            # Supabase SQL schema definitions (schema.sql)
├── docs/                # Project documentation
├── ml_model/            # Python Machine Learning scripts
│   ├── collect_data_for_ml.py  # Fetches YouTube videos
│   ├── features.py             # Feature engineering & Sentiment analysis
│   └── train_and_rank.py       # ML Random Forest ranking
├── public/              # Static frontend assets
├── server/              # Node.js backend root
│   ├── index.js         # Main Express API server
│   └── mlService.js     # Child process wrapper to execute Python scripts
├── src/                 # React frontend source
│   ├── components/      # Reusable UI components (auth, dashboard, interview)
│   ├── contexts/        # React context (Auth, Theme, Profile)
│   ├── pages/           # Route views (HomePage, CreateRoadmapPage, etc.)
│   ├── services/        # Frontend API call wrappers
│   ├── types/           # TS Interfaces
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main React router/app definition
│   └── main.tsx         # React DOM insertion point
├── supabase/            # Supabase migrations
├── package.json         # Node.js dependencies
├── vite.config.ts       # Frontend bundler settings
└── .env                 # Environment variables (Supabase, API keys, etc.)
```

## 4. Key Connections & Workflows

### 4.1. Roadmap Generation
1. **Frontend**: User fills out a form in `CreateRoadmapPage.tsx` and selects a category (Project, Travel, Fitness, Custom).
2. **Backend API (`server/index.js`)**: Receives the prompt at `/api/generate-roadmap`.
3. **AI Execution**: Passes the prompt to Google Gemini with a crafted system prompt based on the category.
4. **Parsing**: Backend parses the AI string into standard JSON `phases` and `steps`.
5. **Media Context**: Iterates through steps. For programming/project inputs, calls `mlService.js`. For travel, uses Google Maps embed URIs.
6. **Delivery**: Returns the structured tree to the frontend, which renders it using `React Flow` components (`CustomRoadmapNode.tsx`).

### 4.2. Machine Learning Video Ranking (The `mlService` Pipeline)
Instead of serving arbitrary YouTube videos, this app ranks them:
1. `mlService.js` (Node) parses the roadmap topic and spawns a Python child process.
2. `collect_data_for_ml.py` calls YouTube Data API to fetch 50+ videos.
3. `features.py` analyzes the metadata and comments (extracting engagement ratios, performing sentiment analysis).
4. `train_and_rank.py` evaluates the videos using a trained Random Forest model predicting "learning value" and returns the Top 5.
5. The top 5 videos are injected into the respective Phase/Step node's metadata for the UI to display in the `VideoSidebar.tsx`.

### 4.3. Quiz & Mock Interview Generation
1. **Upload**: User uploads a Resume or Study Material.
2. **Parsing**: Express backend intercepts `multipart/form-data` using `multer`.
   - `.pdf` parsed with `pdf-parse`.
   - `.docx` parsed with `mammoth`.
   - `.xlsx` parsed with `xlsx`.
3. **Generation**: The extracted text is injected into a Gemini Prompt, enforcing strict JSON output for quiz questions or interactive interview questions.
4. **Voice Component**: If voice mode is selected, frontend utilizes `Vapi Web SDK` for an interactive audio interview experience based on the extracted context.

### 4.4. Auth & Monetization
- **Supabase Auth**: JWT verification happens on the frontend via context and protected routes.
- **Token System**: Users start with free tokens. Generating a roadmap deducts 1 token. Interviews deduct 2 tokens. Records are stored in Postgres.
- **Razorpay**: Users can purchase tokens using Indian Rupees. `/api/create-razorpay-order` kicks off the flow.

## 5. Helpful Notes for AI Agents
- **To modify the frontend UI**: Check `src/components/` and `src/pages/`. Tailwind classes are heavily utilized.
- **To add new AI logic**: Open `server/index.js`. Most GenAI initialization and endpoint routing resides there.
- **To tweak video recommendations**: Python logic is in `ml_model/`. Node.js integration is in `server/mlService.js`.
- **API Keys**: Ensure `.env` is properly populated with `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `YOUTUBE_API_KEY`, etc.
