# ATLAS (Attendance Tracking & Logging Automation System)

ATLAS is a comprehensive attendance management solution designed for Autoteknic. It features a React-based frontend for employees and managers, and a Node.js/Express backend using Firebase for data storage and authentication.

## Project Structure

- **frontend/**: React application (Vite) for the user interface.
- **backend/**: Node.js/Express server handling API requests and Firebase interaction.

## Quick Start

### Prerequisites

- Node.js (v14+ recommended)
- npm
- Firebase Project Credentials

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in `backend/` (see `backend/BACKEND_GUIDE.md` for details).
   - Place your `serviceAccountKey.json` in `backend/config/`.
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Documentation

- **Backend Guide**: [backend/BACKEND_GUIDE.md](backend/BACKEND_GUIDE.md) - Detailed API documentation and setup.
- **Frontend Guide**: [frontend/FRONTEND_GUIDE.md](frontend/FRONTEND_GUIDE.md) - Component structure and styling guide.

## Deployment

- **Backend**: Configured for Render (see `render.yaml`).
- **Frontend**: Configured for Firebase Hosting (see `firebase.json`).
