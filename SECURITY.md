# Security Policy

## 🔒 Secrets Management

### NEVER commit these to the repository:
- API keys (Firebase, Google, third-party services)
- Service account JSON files
- OAuth tokens or refresh tokens
- Database credentials
- Private keys (`.pem`, `.key` files)
- Environment files (`.env`, `.env.local`)

### How secrets are managed in this project:

1. **Frontend secrets**: Stored in `.env` file (gitignored)
   - Injected at build time via `VITE_*` environment variables
   - Generated into `public/config/firebase-config.json` (gitignored)

2. **Backend secrets**: Stored in Render environment variables
   - Never checked into the repository
   - Service account JSON stored as environment variable

3. **Pre-commit protection**: A pre-commit hook scans for secret patterns
   - Located at `.husky/pre-commit`
   - Blocks commits containing API keys, tokens, etc.

---

## 🔄 Secret Rotation

### When to rotate:
- If a secret was accidentally committed
- Every 90 days (recommended)
- When team members leave
- After a security incident

### How to rotate Firebase API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key → Regenerate
3. Update local `.env` file
4. Run `npm run build && firebase deploy`

See `HOW_TO_ROTATE_API_KEY.md` for detailed instructions.

---

## 🛡️ Security Best Practices

### For Developers:
1. **Never hardcode secrets** - Always use environment variables
2. **Check before committing** - Review `git diff` for sensitive data
3. **Use `.env.example`** - Document required variables without values
4. **Test with fake keys** - Use placeholder values in tests

### For API Keys:
1. **Add restrictions** - Limit by domain and API
2. **Use separate keys** - Different keys for dev/staging/prod
3. **Monitor usage** - Check Firebase Console for anomalies
4. **Rotate regularly** - Every 90 days

---

## 🚨 Incident Response

### If a secret is exposed:

1. **IMMEDIATELY rotate the secret**
   - Generate new key in Firebase/Google Console
   - Update `.env` and redeploy

2. **Revoke the old secret**
   - Delete or disable the exposed key

3. **Audit for misuse**
   - Check Firebase Console for unusual activity
   - Review authentication logs

4. **Clean git history** (if committed)
   ```bash
   # Use BFG Repo-Cleaner
   bfg --delete-files firebase-config.json
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

---

## 📋 Environment Variables Reference

### Frontend (`.env`):
```env
VITE_FIREBASE_API_KEY=           # Firebase Web API Key
VITE_FIREBASE_AUTH_DOMAIN=       # Usually: <project>.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=      # Realtime Database URL
VITE_FIREBASE_PROJECT_ID=        # Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET=    # Storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=  # FCM sender ID
VITE_FIREBASE_APP_ID=            # Firebase app ID
VITE_FIREBASE_VAPID_KEY=         # Push notification VAPID key
VITE_API_URL=                    # Backend API URL
```

### Backend (Render):
```
FIREBASE_SERVICE_ACCOUNT=        # JSON service account (escaped)
PORT=                            # Server port (usually set by Render)
```

---

## 📞 Contact

If you discover a security vulnerability, please contact the project maintainers immediately.

**Last Updated**: 2025-12-13
