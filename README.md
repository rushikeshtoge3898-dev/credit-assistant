# 💳 Credit Assistant – AI-Powered Credit & Financial Wellness Platform

An AI-powered full-stack web application designed to help users manage credit accounts, monitor credit-related information, view analytics, and receive AI-powered financial guidance.

## ✨ Features

- 🔐 User registration and login
- 🔑 Google login and password recovery
- 👤 Profile management
- 💳 Credit card and loan account management
- 🏦 Indian bank selection
- 📈 Credit score history tracking
- 📊 Credit utilization and debt-to-income analytics
- 🤖 AI Credit Advisor powered by Google Gemini API
- 🌐 Multilingual interface: English, Marathi, and Hindi
- 📉 Dashboard charts and visualizations
- 🛡️ JWT-based authentication and protected APIs
- 📱 Responsive user interface
- 🆘 Help and Support section

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend |
| Vite | Frontend development and build tool |
| JavaScript | Application logic |
| Python | Backend |
| FastAPI | REST API |
| SQLAlchemy | Database ORM |
| PostgreSQL | Database |
| Supabase | Hosted PostgreSQL |
| Google Gemini API | AI-powered guidance |
| Recharts | Data visualization |
| JWT | Authentication |
| Firebase Hosting | Frontend deployment |
| Render | Backend deployment |
| Git and GitHub | Version control |

## 🏗️ System Architecture

```text
User
 |
 v
React.js + Vite Frontend
 |
 v
FastAPI Backend
 |                 |
 v                 v
Supabase       Google Gemini
PostgreSQL         API
 |
 v
Backend Response
 |
 v
Frontend
 |
 v
User
```

## 🖥️ Application Pages

1. Login / Authentication
2. Dashboard
3. Credit Accounts
4. Score History
5. AI Credit Advisor
6. Profile
7. Help & Support

## 🚀 Live Demo

- **Frontend:** https://credit-assistant-e9f07.web.app
- **Backend:** https://credit-assistant-backend.onrender.com
- **GitHub:** https://github.com/rushikeshtoge3898-dev/credit-assistant

## ⚙️ Local Setup

### Prerequisites

- Git
- Node.js and npm
- Python
- Supabase PostgreSQL database
- Google Gemini API key

### Clone the Repository

```bash
git clone https://github.com/rushikeshtoge3898-dev/credit-assistant.git
cd credit-assistant
```

### Run the Frontend

Navigate to the frontend directory and run:

```bash
npm install
npm run dev
```

### Run the Backend

Navigate to the backend directory, configure the required environment variables, and install the dependencies specified by the project.

For a typical FastAPI setup:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

*Note: The exact directories and backend entry-point module depend on the repository structure.*

## 🔒 Security

- Keep API keys and database credentials private.
- Store secrets in environment variables.
- Do not commit `.env` files.
- Protect backend routes using authentication.
- Avoid storing real financial information in public repositories.
- Verify AI-generated information before making financial decisions.

## 🛣️ Future Scope

- Integration with authorized credit-data providers
- Personalized credit improvement recommendations
- EMI and payment reminders
- Advanced analytics and reports
- Additional Indian languages
- Mobile application
- Improved AI response evaluation

## 👨‍💻 Developer

**Rushikesh Toge**  
Second Year Computer Engineering Student  
Dr. D. Y. Patil College of Engineering and Innovation, Varale, Pune, Maharashtra, India

- **GitHub:** https://github.com/rushikeshtoge3898-dev/
- **LinkedIn:** https://www.linkedin.com/in/rushikesh-toge-49a958385
- **Instagram:** https://www.instagram.com/rushikesh_toge
- **X:** https://x.com/rushikeshtoge31

## ⚠️ Disclaimer

Credit Assistant is an educational project providing credit-information organization and general financial wellness guidance. It is not a bank, credit bureau, or financial adviser and does not provide guaranteed credit-score outcomes. It does not claim direct access to official CIBIL reports.

---

⭐ If you find this project useful, consider starring the repository.


## Project Documentation

📄 [View Credit Assistant Project Report (PDF)](./CREDIT_ASSISTANT_Project_Report(1).pdf)
