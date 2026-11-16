# VoxCRM AI – Intelligent Customer Relationship Management System

**AI-Powered CRM with Gemini AI Voice Agent**

VoxCRM AI is a full-stack Customer Relationship Management (CRM) application designed to simplify lead management, customer tracking, sales activities, call history and follow-up management with the assistance of Google Gemini AI.

The application combines a modern React frontend, a FastAPI backend and a PostgreSQL database with an AI-powered voice interaction interface.

## 📸 Application Screenshots

### Dashboard
<img width="935" height="536" alt="Screenshot 2026-11-17 005611" src="https://github.com/user-attachments/assets/19824c77-089e-4cbb-926b-500b13b9cf02" />


### AI Voice Agent
<img width="960" height="564" alt="Screenshot 2026-11-17 011501" src="https://github.com/user-attachments/assets/faf509ed-ff6f-4825-927f-c4082641fcbe" />


### Lead Management
<img width="960" height="600" alt="Screenshot 2026-11-17 011540" src="https://github.com/user-attachments/assets/40663b7e-9e68-49e1-8169-a1a642090937" />


### Customer Management
<img width="960" height="600" alt="Screenshot 2026-11-17 011555" src="https://github.com/user-attachments/assets/35bf1e13-4175-40f3-8b28-537adfea0c05" />


## 🚀 Key Features

### 1. Interactive Dashboard
- View total leads and qualified leads.
- Monitor total and active customers.
- Track daily calls and pending follow-ups.
- Access important CRM information from one place.

### 2. Lead Management
- Create, view, update and delete leads.
- Manage lead information and qualification status.
- Track leads through the sales process.

### 3. Customer Management
- Convert qualified leads into customers.
- View and manage customer records.
- Prevent duplicate customer conversions.

### 4. Sales Pipeline
- Monitor lead progression.
- Track potential business opportunities.
- Organize sales activities.

### 5. Call History
- Record inbound and outbound calls.
- Track call outcomes and durations.
- Associate calls with leads or customers.

### 6. Follow-up Management
- Create and manage follow-up tasks.
- Set priorities: Low, Medium and High.
- Track task statuses and associated leads or customers.

### 7. AI Voice Agent
- Integrated Google Gemini AI.
- Text-based AI interaction with CRM context.
- Browser-based speech recognition and speech synthesis.
- Ask questions about CRM information using natural language.
- Generate AI responses using available CRM data.

### 8. Settings
- Manage application workspace settings.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI Integration | Google Gemini API |
| Voice Interaction | Web Speech API |
| API Documentation | Swagger UI |
| Version Control | Git and GitHub |

## 📁 Project Structure

```text
VoxCRM-AI/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── .env
│   └── venv/
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── VoiceAgent.tsx
│   │   ├── VoiceAgent.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── requirements.txt
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the application:

- Python
- Node.js and npm
- PostgreSQL
- Git
- Google Gemini API key

### Step 1: Clone the Repository

```bash
git clone https://github.com/ManoharaG11/VoxCRM-AI.git
cd VoxCRM-AI
```

### Step 2: Set Up the Backend

Create a Python virtual environment if one does not already exist:

```powershell
python -m venv backend/venv
```

Activate the virtual environment:

```powershell
.\backend\venv\Scripts\Activate.ps1
```

Install the required Python packages:

```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Configure your PostgreSQL database connection according to the database settings used in `backend/database.py`.

**Security:** Never upload your `.env` file or expose your API keys in frontend code or public repositories.

### Step 4: Configure PostgreSQL

- Start your PostgreSQL service.
- Create the database named `voxcrm_db`, if it does not already exist.
- Ensure the backend database connection settings match your PostgreSQL configuration.

### Step 5: Run the Backend

Open a terminal:

```powershell
cd backend
python -m uvicorn main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

### Step 6: Run the Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL:

http://localhost:5173

## 🤖 AI Integration

VoxCRM AI integrates Google Gemini through the FastAPI backend.

The AI Voice Agent uses CRM information to provide contextual responses to user queries.

The browser's speech recognition and speech synthesis capabilities enable voice-based interaction where supported.

The Gemini API key is stored in the backend environment configuration rather than exposed in the frontend.

## 🔐 Security Considerations

- Environment variables are excluded through `.gitignore`.
- API keys should remain private.
- Backend endpoints validate incoming data.
- Database operations are handled through SQLAlchemy.
- The AI assistant is designed to answer using available CRM context rather than inventing CRM records.

## 🔮 Future Enhancements

- User authentication and role-based access control.
- Advanced analytics and interactive reports.
- Email and notification integration.
- Automated follow-up reminders.
- Enhanced AI-driven sales insights.
- Cloud deployment and production monitoring.

## 👨‍💻 Developer

**G Manohara**

GitHub: https://github.com/ManoharaG11

Project Repository: https://github.com/ManoharaG11/VoxCRM-AI

---

*VoxCRM AI – Smarter Customer Relationships. Powered by AI.*
