# Splitsmart App - Complete Setup Guide

This guide will help you set up and run the Splitsmart application on a new computer after receiving the project files.

## 📋 Prerequisites

Before you begin, install the following software on your computer:

### Required Software

1. **Node.js** (v16 or later)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Should show v16.x.x or higher

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

### Platform-Specific Requirements

#### For iOS Development (Mac only)
- **Xcode** (latest version)
  - Install from Mac App Store
  - After installation, run: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

#### For Android Development
- **Android Studio**
  - Download from: https://developer.android.com/studio
  - Install Android SDK and create a virtual device

## 🚀 Installation Steps

### Step 1: Extract the Project

1. Extract the ZIP file to your desired location
2. Open Terminal (Mac/Linux) or Command Prompt (Windows)
3. Navigate to the project directory:
   ```bash
   cd path/to/Splitsmart
   ```

### Step 2: Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`.

**Expected time:** 2-5 minutes depending on your internet connection.

### Step 3: Configure Firebase

1. **Create a Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication:**
   - In Firebase Console, go to "Authentication"
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

3. **Get Firebase Configuration:**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click the web icon `</>`
   - Copy the configuration object

4. **Update `firebaseConfig.ts`:**
   - Open `firebaseConfig.ts` in the project
   - Replace the configuration with your Firebase config:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Step 4: Configure Gemini AI (Optional but Recommended)

The app uses Google's Gemini AI for receipt scanning.

1. **Get API Key:**
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key

2. **Update `src/services/gemini.ts`:**
   - Open the file
   - Find line with `YOUR_GEMINI_API_KEY`
   - Replace with your actual API key

## ▶️ Running the Application

### Start the Development Server

```bash
npx expo start
```

You will see a QR code and menu options in the terminal.

### Run on Different Platforms

#### Web (Easiest/Fastest)
Press **`w`** in the terminal
- The app will open in your browser at http://localhost:8082
- Best for quick testing

#### iOS Simulator (Mac only)
Press **`i`** in the terminal
- Xcode must be installed
- First launch may take 2-3 minutes

#### Android Emulator
Press **`a`** in the terminal
- Android Studio must be installed
- An emulator must be running

#### Physical Device
1. Install **Expo Go** app on your phone:
   - iOS: App Store
   - Android: Google Play Store
2. Scan the QR code shown in terminal
3. Phone and computer must be on same WiFi network

## 📦 Project Dependencies

### Main Dependencies
- `expo`: React Native framework
- `react-native`: Mobile framework
- `firebase`: Authentication and backend
- `@google/generative-ai`: AI-powered receipt scanning
- `@react-native-async-storage/async-storage`: Local data storage
- `react-navigation`: Screen navigation
- `nativewind`: Styling framework

### Development Tools
- `typescript`: Type safety
- `babel-preset-expo`: Code compilation

## 🔧 Common Issues and Solutions

### Issue: "Port already in use"
**Solution:** Type `yes` when prompted to use a different port, or kill the process:
```bash
lsof -ti:8081 | xargs kill
```

### Issue: "Module not found"
**Solution:** Clear cache and reinstall:
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: "Xcode not found" (Mac)
**Solution:** Run this command:
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Issue: Web warnings about @tailwind
**Solution:** These are warnings, not errors. The app will still work fine.

### Issue: Bundle loading slowly
**Solution:** First load is always slow. Subsequent loads are faster.

## 📱 Testing the App

### Default Login Credentials
Create a new account using the signup screen. The app uses local storage, so data persists on your device.

### Test Features
1. **Create a group** from the Groups tab
2. **Add members** to the group
3. **Scan a receipt** or upload from gallery
4. **Split the bill** using Equal/Percentage/Items mode
5. **View balances** to see who owes whom

## 🌐 Deployment

### Web Deployment
To build for production:
```bash
npx expo export:web
```
Output will be in `web-build/` directory.

### Mobile App Build
For iOS/Android production builds, you'll need:
- Expo EAS (Expo Application Services)
- Run: `npx eas build`

## 📂 Project Structure

```
Splitsmart/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── services/        # Business logic (auth, storage, AI)
│   └── navigation/      # Navigation setup
├── global.css           # Global styles
├── firebaseConfig.ts    # Firebase configuration
├── App.tsx             # Entry point
└── package.json        # Dependencies
```

## 🆘 Getting Help

If you encounter issues:
1. Check this guide first
2. Review the error message carefully
3. Clear cache: `npx expo start -c`
4. Reinstall dependencies: `rm -rf node_modules && npm install`

## ✅ Verification Checklist

- [ ] Node.js installed (v16+)
- [ ] Project dependencies installed (`npm install` completed)
- [ ] Firebase configured in `firebaseConfig.ts`
- [ ] Gemini API key added (optional)
- [ ] App starts without errors (`npx expo start`)
- [ ] Can access on web (press `w`)
- [ ] Can create account and login

---

**Note:** The app works best on Web for development. iOS/Android require platform-specific tools.
