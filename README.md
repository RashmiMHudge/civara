# Civara

Civara is a MERN-stack society management platform built with:

- React frontend
- Node.js / Express backend
- MongoDB Atlas for data storage
- n8n for workflow automation
- Twilio for calling and phone-based notifications

## Project Structure

- `backend/` - API server, controllers, models, routes, and upload handling
- `frontend/` - React application for admin, resident, and security portals
- `n8n_data/` - local n8n runtime data and config
- `docker-compose.n8n.yml` - n8n container setup

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB Atlas connection string for the backend
- Docker if you want to run n8n with the provided compose file

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend uses `server.js` as its entry point.

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

To create a production build:

```bash
npm run build
```

## n8n Setup

Start the automation container from the repo root:

```bash
docker compose -f docker-compose.n8n.yml up -d
```

This maps n8n to port `5678` and stores its data in `n8n_data/`.

## Automation And Calling

- Complaint  flows can trigger n8n webhooks.
- n8n can call external services such as Twilio for voice calls or message workflows.
- The backend reads webhook and automation secrets from environment variables.


## System Workflow
- Resident registers a complaint.
- Complaint data is stored in MongoDB Atlas.
- n8n workflow triggers automation.
- Twilio initiates automated calls/notifications.
- Gemini & AssemblyAI process voice/transcription data.
- Admin manages and updates complaint status.
- Resident tracks complaint progress in real time.

## ptoject overview
CIVARA is a smart residential complaint management and tracking system designed to simplify communication between residents, security staff, and apartment management. The platform enables residents to register complaints, track complaint status  and receive automated updates through calls and notifications.

The project integrates modern web technologies with automation tools and AI-powered services to improve complaint handling efficiency in residential communities.