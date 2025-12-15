# ATLAS Android App - Build Instructions

## Prerequisites

1. **Android Studio** installed (or Gradle CLI)
2. **Java JDK 17+** installed
3. **Android SDK** (installed via Android Studio)

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. Open the `android` folder in Android Studio:
   ```
   File → Open → Select "g:\ATLAS\android"
   ```

2. Wait for Gradle sync to complete

3. Build the APK:
   ```
   Build → Build Bundle(s) / APK(s) → Build APK(s)
   ```

4. Find the APK at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Using Command Line

1. Navigate to android folder:
   ```bash
   cd g:\ATLAS\android
   ```

2. Build debug APK:
   ```bash
   ./gradlew assembleDebug
   ```

3. Or build release APK (requires signing):
   ```bash
   ./gradlew assembleRelease
   ```

## After Building

1. Copy the APK to public folder:
   ```bash
   copy android\app\build\outputs\apk\debug\app-debug.apk public\downloads\atlas.apk
   ```

2. Rebuild and deploy website:
   ```bash
   npm run build
   firebase deploy
   ```

3. Users can now download from: `https://your-site.com/download`

## Signing for Production

For production release, create a signing key:

```bash
keytool -genkey -v -keystore atlas-release.keystore -alias atlas -keyalg RSA -keysize 2048 -validity 10000
```

Then add to `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('atlas-release.keystore')
            storePassword 'your-password'
            keyAlias 'atlas'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Updating the App

After code changes:
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```
