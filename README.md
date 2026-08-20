<div align="center">

# 🛡️ CyberGuard AI — AI Cyber Crime Assistance Platform

**An intelligent, enterprise-grade full-stack platform for cyber crime incident analysis, real-time threat detection, and citizen cybersecurity assistance.**

[![CI Pipeline](https://github.com/Prit99644/AI-Cyber-Crime-Assistant-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Prit99644/AI-Cyber-Crime-Assistant-Platform/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![Next.js Version](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
  - [Option B: Local Development](#option-b-local-development)
- [Environment Configuration](#-environment-configuration)
- [API Endpoints Reference](#-api-endpoints-reference)
- [CI/CD & Deployment](#-cicd--deployment)
- [Security & Best Practices](#-security--best-practices)
- [License](#-license)

---

## 🔍 Overview

**CyberGuard AI** empowers citizens, IT professionals, and cybersecurity researchers with instant threat analysis, scam verification, cyber crime reporting guidance, and recovery playbooks. Built with a modern, high-performance architecture featuring **Next.js 16**, **Express + TypeScript**, and **MongoDB Atlas**, it offers high resilience, security, and responsive UX.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Multi-Engine Threat Analyzer** | Scans URLs, domains, emails, and phone numbers for phishing, scams, and malware with real-time heuristic & API scoring. |
| 🤖 **AI Cyber Assistant & Playbooks** | Step-by-step guidance for financial fraud, identity theft, unauthorized access, and cyber harassment. |
| 📊 **Incident & Analytics Dashboard** | Real-time security scores, threat heatmaps, metrics, and incident activity monitoring. |
| 📝 **Report Generator** | Structured evidence collection and cyber crime report formatting for law enforcement filing. |
| 🔐 **Secure Authentication** | Stateless JWT authentication with salted bcrypt password hashing and role-based access control. |
| 🌗 **Modern Reactive UI** | Responsive glassmorphic layout, dark/light theme support, micro-animations, and clean typography. |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Modern CSS design system
- **Components & Icons:** Accessible component library + [Lucide React](https://lucide.dev/)
- **Charts & Motion:** [Recharts](https://recharts.org/) + [Framer Motion](https://www.framer.com/motion/)
- **State & HTTP:** [Axios](https://axios-http.com/) API client with token interceptors

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (v20 LTS)
- **Framework:** [Express.js](https://expressjs.com/) (TypeScript)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose ODM](https://mongoosejs.com/)
- **Auth & Cryptography:** [JSON Web Tokens (JWT)](https://jwt.io/) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Threat Intelligence:** Google Safe Browsing API, VirusTotal API integration layer

### DevOps & Infrastructure
- **Containerization:** Docker multi-stage production builds + Docker Compose
- **Continuous Integration:** GitHub Actions CI Pipeline (Linting, TypeScript Typecheck, Production Build)
- **Deployment Targets:** Vercel (Frontend), Render / Railway / AWS ECS (Backend), MongoDB Atlas (DB)

---

## 📁 Project Directory Structure

```text
AI-Cyber-Crime-Assistant-Platform/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI Workflow
├── assets/
│   └── diagrams/                # Architectural & UML Diagrams
├── backend/
│   ├── src/
│   │   ├── models/              # Mongoose DB Models (User, Scan, Report)
│   │   ├── routes/              # Express API Routes (Auth, Users, Analyzer)
│   │   ├── services/            # Threat Intelligence & Business Logic
│   │   ├── utils/               # Helper Utilities
│   │   ├── db.ts                # MongoDB Connection & Health
│   │   ├── middleware.ts        # JWT Auth, Validation, Global Error Handlers
│   │   └── server.ts            # Server Entry Point & Lifecycle
│   ├── tests/                   # Verification & Integration Test Suites
│   ├── Dockerfile               # Production Multi-Stage Backend Container
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router Pages
│   │   ├── components/          # Reusable UI & Layout Components
│   │   ├── lib/                 # API Client & Utilities
│   │   ├── services/            # Frontend API Services
│   │   ├── types/               # TypeScript Type Definitions
│   │   └── styles/              # Global Styles
│   ├── public/                  # Static Assets
│   ├── Dockerfile               # Production Standalone Next.js Container
│   ├── .dockerignore
│   ├── .env.example
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml           # Full-Stack Multi-Container Orchestration
├── .env.example                 # Root Environment Template
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Quick Start Guide

### Option A: Docker Compose (Recommended)

Run the entire full-stack platform with a single command:

```bash
# 1. Clone repository
git clone https://github.com/Prit99644/AI-Cyber-Crime-Assistant-Platform.git
cd AI-Cyber-Crime-Assistant-Platform

# 2. Configure environment
cp .env.example .env

# 3. Start containers
docker compose up --build -d
```

- **Frontend Web UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **API Health Status:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option B: Local Development

#### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Start development server with hot reload
npm run dev
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

---

## 🔐 Environment Configuration

### Backend Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cyberguard
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Threat Intelligence (Optional)
GOOGLE_SAFE_BROWSING_API_KEY=your_google_safe_browsing_key
VIRUSTOTAL_API_KEY=your_virustotal_key
```

### Frontend Environment Variables (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📡 API Endpoints Reference

### System & Health Checks
- `GET /` — API Gateway Status
- `GET /health` or `GET /api/health` — Service Uptime & Status
- `GET /health/db` or `GET /api/health/db` — MongoDB Connection Health

### Authentication (`/api/auth`)
- `POST /api/auth/register` — User registration with hashed credentials
- `POST /api/auth/login` — User authentication & JWT issuance
- `GET /api/auth/me` — Current authenticated user profile

### Threat Analyzer (`/api/analyzer`)
- `POST /api/analyzer/scan` — Comprehensive threat analysis (URLs, domains, emails, phone numbers)
- `GET /api/analyzer/history` — Authenticated scan history
- `GET /api/analyzer/stats` — Overall scan analytics and risk metrics

### User Management (`/api/users`)
- `GET /api/users/profile` — Fetch user account details
- `PUT /api/users/profile` — Update user profile information
- `PUT /api/users/change-password` — Secure password update

---

## 🧪 CI/CD & Verification

All commits and pull requests trigger automated checks via GitHub Actions:
- **Linting:** ESLint 9 validation
- **Type Checking:** TypeScript compiler verification (`tsc --noEmit`)
- **Production Build:** Next.js standalone build & Express TypeScript compilation

```bash
# Run local verification in backend:
cd backend && npm run typecheck && npm run build

# Run local verification in frontend:
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.