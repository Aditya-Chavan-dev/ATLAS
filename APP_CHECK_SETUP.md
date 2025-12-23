# Firebase App Check Setup Instructions

## Prerequisites
You'll need a reCAPTCHA v3 site key. Here's how to get it:

### Step 1: Enable App Check in Firebase Console

1. Go to: https://console.firebase.google.com
2. Select project: `atlas-011`
3. Click **App Check** in the left sidebar
4. Click **Get Started**
5. Select your web app from the list
6. Choose provider: **reCAPTCHA v3**
7. Click **Register**
8. Copy the **reCAPTCHA site key** (starts with `6L...`)

### Step 2: Save the Site Key

Add to your `.env` file:
```bash
VITE_RECAPTCHA_SITE_KEY=6L...your-site-key...
```

### Step 3: I'll Update the Code

Once you have the site key, I'll:
1. Install the App Check package
2. Update `src/firebase/config.js`
3. Test the integration
4. Deploy

---

**Don't do this yet - wait for Steps 1 and 2 to complete first!**
