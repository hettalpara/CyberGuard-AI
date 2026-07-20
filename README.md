<div align="center">

# 🛡️ AI Cyber Crime Assistance Platform

**An intelligent, AI-powered platform for cyber crime analysis, threat detection, and digital forensics assistance.**



</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

The **AI Cyber Crime Assistance Platform** is a comprehensive web application designed to assist law enforcement, cybersecurity professionals, and citizens in identifying, analyzing, and reporting cyber crimes. It leverages artificial intelligence (Gemini API) and industry-standard cybersecurity APIs to provide real-time threat analysis, URL scanning, and intelligent crime classification.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI-Powered Analysis | Gemini API integration for intelligent crime classification and assistance |
| 🔗 URL Scanner | Google Safe Browsing & VirusTotal for malicious URL detection |
| 🌐 WHOIS Lookup | Domain registration and ownership analysis |
| 📊 Dashboard | Interactive analytics with Recharts visualization |
| 📝 Report Filing | Structured cyber crime report submission system |
| 🔒 Authentication | JWT-based secure authentication with role management |
| 📱 Responsive Design | Mobile-first, fully responsive UI with ShadCN + Tailwind CSS |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 | React framework with App Router |
| React 19 | UI component library |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| ShadCN UI | Accessible component system |
| Framer Motion | Animations |
| React Hook Form + Zod | Form handling and validation |
| Axios | HTTP client |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | High-performance Python API framework |
| SQLAlchemy | ORM for database operations |
| Pydantic | Data validation and serialization |
| Alembic | Database migrations |
| JWT | Authentication tokens |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database (Supabase) |
| Supabase Storage | File and media storage |
| Vercel | Frontend deployment |
| Render | Backend deployment |

---

## 📁 Project Structure

```
AI-Cyber-Crime-Assistance-Platform/
│
├── frontend/                  # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/               # App Router (pages & layouts)
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Feature-based modules
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities & configurations
│   │   ├── services/          # API service layer
│   │   ├── store/             # State management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Helper functions
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   └── tests/                 # Frontend tests
│
├── backend/                   # FastAPI backend application
│   ├── app/
│   │   ├── api/v1/            # Versioned API endpoints
│   │   ├── core/              # App configuration & settings
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic layer
│   │   ├── repositories/      # Data access layer
│   │   ├── database/          # DB connection & migrations
│   │   ├── middleware/        # Request/response middleware
│   │   ├── auth/              # Authentication & authorization
│   │   └── utils/             # Backend utilities
│   └── tests/                 # Backend tests
│
├── database/                  # Database schemas, seeds & backups
├── docs/                      # Project documentation
├── assets/                    # Design assets
├── scripts/                   # Automation scripts
├── .github/                   # GitHub Actions & templates
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **Python** >= 3.12
- **PostgreSQL** >= 16
- **Git**

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

---

## 🔐 Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cybercrime_db
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SAFE_BROWSING_API_KEY=your_key
VIRUSTOTAL_API_KEY=your_key
WHOIS_API_KEY=your_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for a safer digital world.**

</div>