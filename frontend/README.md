# Frontend — AI Cyber Crime Assistance Platform

> Next.js 15 + React 19 + TypeScript + Tailwind CSS + ShadCN UI

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Directory Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Authentication route group
│   ├── (dashboard)/         # Protected dashboard route group
│   ├── api/                 # Next.js API routes (BFF proxy)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
│
├── components/              # Reusable UI components
│   ├── ui/                  # ShadCN UI primitives
│   ├── shared/              # Cross-feature shared components
│   ├── layout/              # Layout components (Navbar, Sidebar, Footer)
│   ├── forms/               # Reusable form components
│   └── charts/              # Recharts wrapper components
│
├── features/                # Feature-based modules
│   ├── auth/                # Authentication feature
│   ├── dashboard/           # Dashboard feature
│   ├── reports/             # Crime reports feature
│   ├── url-scanner/         # URL scanning feature
│   └── threat-analysis/     # AI threat analysis feature
│
├── hooks/                   # Global custom React hooks
├── lib/                     # Core utilities and configs
│   └── validators/          # Zod validation schemas
├── services/                # API service layer (Axios)
├── store/                   # State management
│   └── slices/              # State slices
├── types/                   # Global TypeScript types
├── utils/                   # Pure utility functions
└── styles/                  # Global CSS & Tailwind config

public/                      # Static assets served at /
tests/                       # Test suites
├── e2e/                     # Playwright end-to-end tests
└── unit/                    # Unit tests
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
