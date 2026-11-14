# BOOYAH ARENA — Mobile-Friendly (Zero Terminal) Firebase Hosting & APK Guide

## Can AI Studio Deploy `pristine-folder-tc62s.web.app` Automatically?
No — AI Studio's built-in Firebase integration can only deploy `firestore.rules`. Firebase Hosting deployments require either an authenticated Google OAuth session for `pristine-folder-tc62s` or a Service Account key inside GitHub Actions.

If you are on **mobile with no terminal**, use the automated GitHub Actions workflows already included in this project:

---

## Option A: Build the Android APK Directly on Your Phone (Zero Hosting & Zero Terminal)
You do **not** need `pristine-folder-tc62s.web.app` or PWABuilder at all with this method.

1. In AI Studio, export/push this project to a GitHub repository (via **Download App** / **GitHub export**).
2. Open your repository in your mobile browser (Chrome) or GitHub Mobile app.
3. Tap **Actions** → **Build BOOYAH ARENA Android APK** → **Run workflow**.
4. Wait ~2 minutes, open the finished run, and tap **`BOOYAH-ARENA-debug-apk`** under **Artifacts** to download and install `app-debug.apk` directly on your Android phone.

---

## Option B: Activate `https://pristine-folder-tc62s.web.app` Automatically via GitHub Actions (Zero Terminal)
This project includes `.github/workflows/deploy-firebase-hosting.yml`, `firebase.json`, and `.firebaserc` pre-configured for `pristine-folder-tc62s`.

1. Open [Firebase Console](https://console.firebase.google.com/project/pristine-folder-tc62s/settings/serviceaccounts/adminsdk) on your phone → **Project Settings** → **Service accounts** → **Generate new private key** (downloads a `.json` file).
2. In your GitHub repo on mobile browser: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: Paste the contents of the downloaded `.json` key file.
3. Tap **Actions** → **Deploy BOOYAH ARENA to Firebase Hosting** → **Run workflow**.
4. Within ~60 seconds, `https://pristine-folder-tc62s.web.app` goes live automatically on every push and works cleanly with **PWABuilder** (zero `403` error).

---

## Option C: Instant Browser Install on Android (Works Right Now)
Open the AI Studio **Shared App URL** in Chrome on Android, tap the **Install BOOYAH ARENA App Now** button (or Chrome Menu `⋮` → **Install app / Add to Home screen**). It installs immediately with full-screen mode and offline caching without needing any APK build.
