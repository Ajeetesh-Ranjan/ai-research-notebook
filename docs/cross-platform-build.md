# Cross-Platform Build Guide

> Build CiteMind for Windows (.exe), macOS (.dmg), Linux (.AppImage), Android (.apk), and iOS (.ipa).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CiteMind Desktop                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Electron   │    │   Backend   │    │   Frontend      │  │
│  │  Main Proc  │───▶│   API       │───▶│   (React)       │  │
│  │  (Node.js)  │    │   (Express) │    │   (WebView)     │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                         Bundled as one app                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CiteMind Mobile                         │
│  ┌─────────────┐    ┌─────────────┐                         │
│  │  Capacitor  │    │   Frontend  │                         │
│  │  (Native)   │───▶│   (React)   │  → API calls to cloud   │
│  │  WebView    │    │   (Web)     │                         │
│  └─────────────┘    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Platform | Requirements |
|---|---|
| All | Node.js 20+, npm 10+ |
| Windows | Windows 10+, WiX Toolset (for MSI) |
| macOS | macOS 12+, Xcode 14+, Apple Developer account (for signed .dmg) |
| Linux | Ubuntu 20.04+ or equivalent |
| Android | Android Studio, JDK 17, Android SDK 34 |
| iOS | macOS, Xcode 15+, Apple Developer account |

---

## Quick Build Commands

From the repository root:

```bash
# Install all dependencies
npm install

# Build the web frontend
npm run build:web

# Build backend
npm run build:api

# --- DESKTOP ---
# Windows .exe + .msi
npm run build:win

# macOS .dmg
npm run build:mac

# Linux .AppImage + .deb + .rpm
npm run build:linux

# All desktop platforms
npm run build:desktop:all

# --- MOBILE ---
# Android .apk
npm run build:android

# iOS .ipa (macOS only)
npm run build:ios
```

---

## Desktop Build (Electron)

### 1. Setup

```bash
cd apps/desktop
npm install
```

### 2. Build Frontend & Backend

```bash
# From repo root
npm run build:web    # Builds apps/web/dist/
npm run build:api    # Builds services/api/dist/
```

### 3. Build for Windows

```bash
cd apps/desktop
npm run build:win
```

**Outputs:**
- `apps/desktop/dist/CiteMind Setup 1.0.0.exe` — Installer
- `apps/desktop/dist/CiteMind 1.0.0.exe` — Portable
- `apps/desktop/dist/CiteMind-1.0.0-win.zip` — Archive

**Code signing (optional but recommended):**
```bash
set WIN_CSC_LINK=C:\path\to\certificate.p12
set WIN_CSC_KEY_PASSWORD=your-password
npm run build:win
```

### 4. Build for macOS

```bash
cd apps/desktop
npm run build:mac
```

**Outputs:**
- `apps/desktop/dist/CiteMind-1.0.0.dmg` — Disk image
- `apps/desktop/dist/CiteMind-1.0.0-mac.zip` — Archive

**Notarization (required for macOS 10.15+):**
```bash
export APPLE_ID=your@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=YOURTEAMID
npm run build:mac
```

### 5. Build for Linux

```bash
cd apps/desktop
npm run build:linux
```

**Outputs:**
- `apps/desktop/dist/CiteMind-1.0.0.AppImage` — Universal Linux
- `apps/desktop/dist/CiteMind_1.0.0_amd64.deb` — Debian/Ubuntu
- `apps/desktop/dist/CiteMind-1.0.0.x86_64.rpm` — Fedora/RHEL

---

## Mobile Build (Capacitor)

### 1. Setup

```bash
cd apps/mobile
npm install
```

### 2. Add Platforms

```bash
npx cap add android
npx cap add ios
```

### 3. Sync Web Assets

```bash
# From repo root
npm run build:web
cd apps/mobile
npx cap sync
```

### 4. Build Android APK

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

**Output:**
- `apps/mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`

**Sign the APK:**
```bash
cd apps/mobile/android
# Generate keystore (one-time)
keytool -genkey -v -keystore release.keystore -alias citemind -keyalg RSA -keysize 2048 -validity 10000
# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore release.keystore app/build/outputs/apk/release/app-release-unsigned.apk citemind
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app-release-signed.apk
```

### 5. Build iOS IPA

**Requires macOS + Xcode.**

```bash
cd apps/mobile
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select "App" target
2. Set Team (Apple Developer account)
3. Product → Archive
4. Distribute App → Ad Hoc / App Store

**Output:**
- `.ipa` file from Xcode Organizer

---

## CI/CD (GitHub Actions)

A sample workflow is provided at `.github/workflows/cross-platform-build.yml`.

It builds on:
- **windows-latest** → .exe
- **macos-latest** → .dmg
- **ubuntu-latest** → .AppImage

And uploads artifacts to GitHub Releases.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `electron-builder` not found | Run `npm install` in `apps/desktop/` |
| Frontend not loading | Ensure `apps/web/dist/index.html` exists |
| Backend not starting | Check `services/api/dist/index.js` exists |
| Android build fails | Ensure Android SDK 34 and JDK 17 are installed |
| macOS notarization fails | Verify Apple Developer credentials and Team ID |
| Windows build slow | Exclude `node_modules` from Windows Defender scan |

---

## File Sizes (Estimated)

| Platform | Size |
|---|---|
| Windows .exe installer | ~180 MB |
| macOS .dmg | ~170 MB |
| Linux .AppImage | ~175 MB |
| Android .apk | ~45 MB |
| iOS .ipa | ~50 MB |
