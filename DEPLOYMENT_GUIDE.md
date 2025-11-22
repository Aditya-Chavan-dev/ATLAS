# ATLAS Hybrid Deployment Guide

This guide will help you deploy:
1.  **Backend** to **Render** (Free Tier).
2.  **Frontend** to **Firebase Hosting** (Fast & Free).

---

## Phase 1: Push Code to GitHub
1.  Initialize Git (if not done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a new repository on GitHub (e.g., `atlas-app`).
3.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/atlas-app.git
    git branch -M main
    git push -u origin main
    ```

---

## Phase 2: Deploy Backend (Render)
1.  Go to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Settings**:
    *   **Name**: `atlas-backend`
    *   **Root Directory**: `backend`
    *   **Environment**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Plan**: Free
5.  **Environment Variables** (Advanced -> Add Environment Variable):
    *   `FIREBASE_DATABASE_URL`: `https://atlas-011-default-rtdb.firebaseio.com/` (Check your .env)
    *   **Secret File**:
        *   Render allows uploading a "Secret File".
        *   Upload your `backend/serviceAccountKey.json` as `/etc/secrets/serviceAccountKey.json`.
        *   Add Env Var: `GOOGLE_APPLICATION_CREDENTIALS` = `/etc/secrets/serviceAccountKey.json`.
6.  Click **Create Web Service**.
7.  **Wait** for deployment. Copy the URL (e.g., `https://atlas-backend.onrender.com`).

---

## Phase 3: Deploy Frontend (Firebase)
1.  **Update API URL**:
    *   Open `frontend/.env`.
    *   Change `VITE_API_URL` to your new Render URL:
        ```
        VITE_API_URL=https://atlas-backend.onrender.com/api
        ```
2.  **Rebuild Frontend**:
    ```bash
    cd frontend
    npm run build
    cd ..
    ```
3.  **Deploy**:
    ```bash
    firebase login  # If not logged in
    firebase deploy --only hosting
    ```
4.  **Done!** Firebase will give you a URL (e.g., `https://atlas-011.web.app`).

---

## Troubleshooting
*   **CORS Errors**: If the frontend can't talk to the backend, check the Backend logs on Render. You might need to update `cors` settings in `server.js` if strict mode is on (currently it allows all `cors()`).
*   **Database**: Ensure the Render backend has the correct `FIREBASE_DATABASE_URL`.
