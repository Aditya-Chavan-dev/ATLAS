# Firebase Phone Authentication Setup Guide

To enable the Phone Number login feature we've integrated into ATLAS, you need to configure the provider in your Firebase project console.

## 1. Enable Phone Sign-in
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **(atlas-app-...)**.
3. In the left sidebar, click on **Authentication**.
4. Click on the **Sign-in method** tab.
5. Click on **Phone**.
6. Switch the toggle to **Enable**.
7. Click **Save**.

## 2. Add Test Phone Numbers (Crucial for Dev)
To avoid using your real SMS quota and to test without waiting for texts:
1. In the **Phone** provider settings (Authentication > Sign-in method > Phone).
2. Look for the **"Phone numbers for testing"** section (accordion).
3. Click users/add **Phone numbers for testing**.
4. Add a phone number: `+91 99999 99999` (or any dummy number).
5. Add a verification code: `123456`.
6. Click **Add**.

*Now you can log in with this number and code `123456` instantly.*

## 3. Configure ReCaptcha (Web)
Firebase Phone Auth on the web requires ReCaptcha validation to prevent abuse.
*   **Automatic**: Our code (`Login.jsx`) handles the invisible ReCaptcha automatically using `RecaptchaVerifier`.
*   **Domain Whitelist**: If you deploy this app to a custom domain (e.g., `atlas.yourcompany.com`), you must add that domain to **Authentication > Settings > Authorized domains** in the Firebase Console. `localhost` is authorized by default.

## 4. SHA-1 Fingerprint (Android/PWA)
If you are building the Android APK strictly:
1. You may need to add your machine's SHA-1 key to the Firebase Project Settings if using the native Android integration, but **ATLAS currently uses the Web SDK (PWA compatible)**, so this is usually not required unless we switch to native intents.
2. For the Web SDK flow used in ATLAS, the "Authorized Domains" step above is the most important for production.

---

### How it works in ATLAS
1. **User enters phone**: We initialize a `RecaptchaVerifier` (invisible).
2. **Request OTP**: Firebase sends an SMS (or mocks it for test numbers).
3. **Verify OTP**: User enters `123456`.
4. **Login**: Firebase returns a valid User object.
5. **ATLAS Logic**: We check if this phone number matches an employee profile created by the MD and link them if necessary.
