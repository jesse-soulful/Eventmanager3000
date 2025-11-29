# Event Management 3000

A comprehensive event management system built with React, TypeScript, and Node.js.

## Features

- **Modular Architecture**: Separate modules for Artists, Vendors, Materials, Food & Beverages, Sponsors & Partners, and Marketing & Communication
- **Event Management**: Each event is managed separately with its own data
- **Finance Board**: Aggregated view of all financial data across modules
- **Workflow Management**: Each module has its own workflow with statuses
- **Line Items**: Track individual items within each module
- **Categories & Tags**: Organize and filter data efficiently

## Project Structure

```
├── frontend/     # React + TypeScript frontend
├── backend/      # Node.js + Express + TypeScript backend
└── shared/       # Shared TypeScript types and utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use SQLite by changing the datasource in `backend/prisma/schema.prisma`)

### Installation

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
# Example for PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/event_management?schema=public"
```

3. Generate Prisma client and run migrations:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

4. (Optional) Seed the database with sample data:
```bash
cd backend
npm run seed
```

5. Start development servers:
```bash
# From the root directory
npm run dev
```

The frontend will be available at http://localhost:5173  
The backend API will be available at http://localhost:3001

## Modules

Each module (Artists, Vendors, Materials, Food & Beverages, Sponsors & Partners, Marketing & Communication) has:
- **Line Items**: Individual items to track
- **Statuses**: Customizable workflow statuses (Draft, Pending, Confirmed, etc.)
- **Categories**: Organize items by category
- **Tags**: Add tags for filtering and organization
- **Financial Tracking**: Quantity, unit price, and total price

## Finance Board

The Finance Board provides:
- **Overview**: Total budget, spent, committed, and remaining
- **By Module**: Breakdown of finances per module
- **By Category**: Financial summary by category
- **By Status**: Financial summary by status
- **Line Items View**: Detailed view of all financial transactions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (configurable)
- **Shared Types**: TypeScript package for type safety across frontend and backend

