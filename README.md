# Civara

Civara is a full-stack society management platform with:

- a Node.js / Express backend
- a React frontend
- n8n workflow support for automation

## Project Structure

- `backend/` - API server, controllers, models, routes, and upload handling
- `frontend/` - React application for admin, resident, and security portals
- `n8n_data/` - local n8n runtime data and config
- `docker-compose.n8n.yml` - n8n container setup

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB for the backend
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

## Notes

- The repository intentionally excludes generated dependencies and local runtime databases from Git.
- If you add environment files, keep secrets out of version control.
- The frontend and backend each have their own package configuration and scripts.
