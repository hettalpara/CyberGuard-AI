# CyberGuard AI — Backend (Node.js + Express + TypeScript)

Backend API service for the **AI Cyber Crime Assistance Platform (CyberGuard AI)**.

## Tech Stack
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB Atlas (via Mongoose)
- **Validation:** Zod
- **Testing:** Jest + Supertest

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your MongoDB Atlas connection URI:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
MONGODB_DATABASE=cyberguard
FRONTEND_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run start
```

### 5. Run Tests & Type Checks
```bash
npm run typecheck
npm test
```

---

## API Endpoints (Phase 1 Foundation)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Root health status |
| `GET` | `/health/db` | MongoDB connectivity check |
| `GET` | `/api/v1/health` | Versioned v1 health status |
| `GET` | `/api/v1/health/db` | Versioned v1 MongoDB connectivity check |

---

## Directory Structure
```
backend/
├── src/
│   ├── config/          # Environment & Database configurations
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Global error and validation middlewares
│   ├── models/          # Mongoose database models (Phase 2+)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services (Phase 2+)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper utilities (logger, response formats)
│   ├── app.ts           # Express application setup
│   └── server.ts        # Server entry point & DB lifecycle
├── tests/               # Test suites
├── .env.example
├── package.json
└── tsconfig.json
```
