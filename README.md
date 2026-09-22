# 💳 Credit Assistant

## AI-Powered Credit & Financial Wellness Platform

Credit Assistant is a full-stack web application designed to help users understand, monitor, and manage their credit health and financial information.

The platform combines credit score tracking, credit account management, financial data visualization, credit simulation, personalized recommendations, and AI-powered credit guidance into a single application.

---

## 📌 Project Overview

Managing credit and understanding credit scores can be difficult for many users.

Credit Assistant provides a centralized platform where users can:

- Monitor their credit health
- Track credit score history
- Manage credit cards and loan accounts
- Monitor credit utilization
- View financial information through charts
- Explore simulated credit scenarios
- Receive personalized recommendations
- Ask questions to an AI Credit Advisor
- Manage their financial profile

---

## ✨ Key Features

### 🔐 Authentication
- User registration
- Secure login
- Password hashing
- JWT-based authentication
- Protected API endpoints
- User-specific data access

### 📊 Credit Health Dashboard
- Credit Score
- Card Utilization
- Debt-to-Income Ratio
- Payment History
- Oldest Tradeline
- Active Credit Accounts
- Credit Health Indicators
- Financial Charts
- Account Summary

### 📈 Credit Score History
Users can monitor changes in their credit score over time through historical data and graphical representations.

### 💳 Credit Accounts
Users can add and manage credit cards and loan accounts, including:
- Account Name
- Bank / Lender
- Account Type
- Credit Limit
- Current Balance
- Monthly EMI
- Account Opening Date
- Account Age

### 🏦 Indian Bank Selector
The application includes a comprehensive Indian bank and lender selector to make financial account entry easier.

### 🎯 Credit Goals
Users can work with credit-related goals and monitor their financial progress.

### 🧮 CIBIL Score Simulator
The What-If Engine allows users to explore simulated credit scenarios.

> Simulator results are educational projections and should not be treated as official CIBIL bureau predictions.

### 🤖 AI Credit Advisor
Users can ask questions related to:
- Credit scores
- Credit utilization
- Credit cards
- Debt management
- Payment habits
- EMI management
- Financial planning
- Credit improvement

### 💡 Personalized Recommendations
The application can provide recommendations based on the user's credit and financial information.

### 👤 Financial Profile
Users can manage their personal and financial profile information.

### 🌐 Multi-Language Support
Language preferences are provided to improve accessibility.

### 🆘 Help & Support
The application includes support information and social media links.

---

# 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │       USER        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ React + Vite      │
                    │    Frontend       │
                    └─────────┬─────────┘
                              │
                         REST APIs
                              │
                              ▼
                    ┌───────────────────┐
                    │ Python + FastAPI  │
                    │     Backend       │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       Authentication      Database        AI Service
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                       Application Data
```

---

# 🛠️ Technology Stack

## Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- Recharts

## Backend
- Python
- FastAPI
- SQLAlchemy
- REST APIs
- JWT Authentication

## Database
- SQLite for local development
- PostgreSQL / Supabase for production

## AI
- AI API Integration
- AI-powered Credit Advisor

## Development Tools
- Visual Studio Code
- Git
- GitHub
- npm
- Python Virtual Environment

---

# 📂 Project Structure

```text
credit-assistant/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── data/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── README.md
└── ...
```

---

# 🎨 Frontend

The frontend is developed using React and Vite.

It is responsible for:
- User interface
- Navigation
- Login and registration
- Dashboard
- Credit accounts
- Credit score history
- Charts and visualizations
- AI Advisor interface
- Profile management
- Language preferences
- Help and Support
- API communication

---

# ⚙️ Backend

The backend is developed using Python and FastAPI.

It handles:
- Authentication
- User management
- Credit accounts
- Credit score data
- Financial profile data
- Recommendations
- AI requests
- Database operations
- API responses

---

# 🔌 API Layer

The React frontend communicates with the FastAPI backend using REST APIs.

```text
React Frontend
      │
      ▼
API Request
      │
      ▼
FastAPI Endpoint
      │
      ▼
Business Logic
      │
      ▼
Database / AI Service
      │
      ▼
API Response
      │
      ▼
React Frontend
```

FastAPI provides interactive API documentation through Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

# 🤖 AI Integration

```text
User Question
      │
      ▼
React Frontend
      │
      ▼
FastAPI Backend
      │
      ▼
AI API
      │
      ▼
Generated Response
      │
      ▼
FastAPI Backend
      │
      ▼
React Frontend
      │
      ▼
User
```

The AI API key is stored using environment variables and should not be exposed in frontend code.

---

# 🗄️ Database

The application uses SQLAlchemy for database interaction.

The database stores information related to:
- Users
- Credit Accounts
- Credit Score History
- Recommendations
- Financial Profile Data
- Other application data

User-specific information is associated with the authenticated user.

---

# 🔐 Security

Security-related features include:
- User authentication
- Password hashing
- JWT-based authentication
- Protected API endpoints
- User-specific data access
- Environment variables
- Secure API key handling
- Backend-controlled AI API communication

Sensitive information such as API keys, passwords, and secret keys should never be committed to GitHub.

---

# 🔄 Frontend–Backend Integration

```text
User enters account information
            │
            ▼
React Form
            │
            ▼
API Request
            │
            ▼
FastAPI Backend
            │
            ▼
Validation & Processing
            │
            ▼
Database
            │
            ▼
API Response
            │
            ▼
React Frontend
            │
            ▼
Updated Dashboard
```

---

# 📊 Data Visualization

Credit Assistant uses charts and visual components to make financial information easier to understand.

Visualizations can represent:
- Credit score history
- Credit utilization
- Account information
- Financial trends
- Credit health indicators

---

# 🧪 Testing & Validation

The application can be tested across:

- User Registration Testing
- Authentication Validation
- Financial Data Entry Testing
- Credit Score Tracking Verification
- AI Recommendation Testing
- Dashboard Functionality Testing
- Data Visualization Validation
- Database Integrity Testing
- API Endpoint Verification
- Frontend–Backend Integration Testing
- End-to-End Workflow Testing
- Performance & Reliability Evaluation

### End-to-End Workflow

```text
Registration
     ↓
Login
     ↓
Dashboard
     ↓
Add Credit Account
     ↓
Database
     ↓
Dashboard Update
     ↓
AI Advisor
     ↓
Recommendations
```

---

# 🚀 Local Setup

## Prerequisites

Install:
- Python
- Node.js
- npm
- Git

## 1. Clone Repository

```bash
git clone https://github.com/rushikeshtoge3898-dev/credit-assistant.git
cd credit-assistant
```

## 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display the frontend URL in the terminal.

---

# 🔑 Environment Variables

Example:

```env
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
AI_API_KEY=your_ai_api_key
```

Never upload real API keys, passwords, or secret credentials to GitHub.

---

# 🌐 Deployment

The application can use separate hosting for the frontend and backend.

The frontend can be deployed as a production React/Vite application.

The FastAPI backend can be deployed separately with production environment variables.

PostgreSQL / Supabase can be used for production data storage.

---

# 📱 Application Modules

| Module | Purpose |
|---|---|
| Authentication | Registration and secure login |
| Dashboard | Overall credit health |
| Score History | Credit score tracking |
| Credit Accounts | Manage cards and loans |
| Bank Selector | Indian banks and lenders |
| Goals | Credit-related goals |
| Simulator | Credit scenario simulation |
| AI Advisor | AI-powered credit guidance |
| Recommendations | Personalized suggestions |
| Profile | Personal and financial profile |
| Help & Support | Support and social links |

---

# 💡 Project Highlights

- Full-stack React + FastAPI architecture
- REST API communication
- Secure authentication
- User-specific financial data
- Credit account management
- Indian bank selector
- Credit score tracking
- Credit score simulation
- Data visualization
- AI-powered Credit Advisor
- Personalized recommendations
- Multi-language support
- Responsive user interface

---

# 🔮 Future Scope

Possible future improvements include:
- Real-time authorized credit-data integration
- Advanced financial analytics
- More AI-powered financial insights
- Mobile application
- Advanced notifications
- More financial institutions
- Advanced personalized financial planning
- Additional financial wellness tools

---

# 👨‍💻 Author

## Rushikesh Toge

Computer Engineering Student

### Interests
- Cybersecurity
- Artificial Intelligence
- Full-Stack Development
- Network Security
- Digital Forensics
- Emerging Technologies

---

# 🔗 Connect With Me

### Instagram
https://www.instagram.com/rushikesh_toge

### LinkedIn
https://www.linkedin.com/in/rushikesh-toge-49a958385

### GitHub
https://github.com/rushikeshtoge3898-dev/

### X / Twitter
https://x.com/rushikeshtoge31

---

# 📌 Project Information

| Information | Details |
|---|---|
| Project Name | Credit Assistant |
| Project Type | Full-Stack Web Application |
| Domain | Credit & Financial Wellness |
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| Database | SQLite / PostgreSQL |
| AI | AI-Powered Credit Advisor |
| API | REST API |
| Repository | GitHub |

---

# 📄 Project Purpose

Credit Assistant was developed as a practical full-stack application to explore:

- Credit management
- Financial data visualization
- Backend API development
- Authentication
- Database management
- AI integration
- User-specific data management
- Full-stack application development

---

# ⭐ Conclusion

Credit Assistant brings credit tracking, financial information management, visualization, simulation, personalized recommendations, and AI-powered assistance together in one platform.

The project demonstrates the integration of a modern frontend, backend APIs, database management, authentication, and AI services to create a practical financial wellness application.

---

## 📜 License

This project is intended for educational, academic, and project demonstration purposes.
