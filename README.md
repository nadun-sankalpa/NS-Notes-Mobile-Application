# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

# NS Notes App ✨📝

Smart, fast, and delightful note-taking powered by NS AI. Capture ideas with text, voice, and camera. Organize them beautifully. Get things done with your Robo Pet assistant.

— Built with Expo + React Native (SDK 53)

## 🚀 Highlights

- 🧠 NS AI Assistant: Chat with AI to summarize, draft, and improve notes
- 🗣️ Voice Typing: Dictate notes hands-free with speech-to-text
- 📸 Image → Text (OCR): Convert images into editable text
- 🤖 Robo Pet: A playful productivity companion that nudges and helps you stay on track
- 🪄 Beautiful UI: Smooth animations and 3D-styled loaders/toasts
- 🔐 Secure Auth: Email login & protected routes
- ☁️ Cloud Ready: Firebase config included

## 🎥 Demo & Download

- ▶️ YouTube Demo: [Add your video URL](https://your-youtube-demo-url)
- 📦 Android APK: [Add your APK download URL](https://your-apk-download-url)

Tip: Replace the placeholder URLs above with your actual YouTube and APK links.

## 📂 Project Structure

```bash
app/
  (auth)/          Auth screens (login, register)
  (dashboard)/     Main app routes (home, tasks, etc.)
components/        UI components (3D alerts, loaders, toasts)
context/           Global contexts (Auth, Settings, Loader, 3D effects)
services/          API, AI, OCR, and Auth services
types/             Shared types and declarations
assets/            Fonts and images
```

## 🧩 Core Features

- Image to Text (OCR)
  - Uses `services/ocrService.ts` to extract text from photos and images
  - Ideal for digitizing handwritten notes and documents

- Voice Typing
  - Dictate notes using the device microphone
  - Type definitions in `types/web-speech.d.ts`

- NS AI Assistant
  - `services/aiService.ts` powers AI features like summarization and content enhancements
  - Use it to brainstorm, generate task lists, or polish your text

- Robo Pet
  - A friendly in-app assistant that gives subtle nudges, reminders, and motivation
  - Integrates with tasks and notes to help you stay productive

## ⚙️ Setup & Installation

1) Install dependencies

```bash
npm install
```

2) Create environment file

- Copy `.env.example` to `.env` and fill in your secrets (e.g., Firebase, AI keys)

3) Start the app

```bash
npx expo start
```

Open in:

- Development build
- Android Emulator
- iOS Simulator
- Expo Go (sandbox)

## 📱 Permissions

- Microphone: Voice typing
- Camera / Media: Image-to-text OCR

Make sure to grant permissions when prompted by the OS.

## 🛠️ Tech Stack

- Expo Router, React Native, TypeScript
- NativeWind/Tailwind for styling (`global.css`, `tailwind.config.js`)
- Firebase integration (`firebase.ts`)
- Beautiful 3D components in `components/`

## 🧪 Scripts

```bash
npm run lint        # Lint the codebase
npm run start       # Expo start
npm run android     # Run on Android
npm run ios         # Run on iOS (macOS)
```

## 📦 Building APK / EAS

We use EAS for builds. Ensure you’re logged in to Expo and have EAS set up.

```bash
npx expo login
npx eas build -p android --profile preview
```

Notes:

- Ensure package versions are compatible with Expo SDK 53
- If you see Gradle or dependency conflicts, clean node_modules and reinstall

## 🧰 Troubleshooting

- Android build fails on Windows
  - Close all editors that may lock files
  - Delete `node_modules`, clear caches, reinstall
  - Ensure dependencies match Expo SDK 53

- iOS bundle identifier
  - Verify `app.json` has a valid `ios.bundleIdentifier` (e.g., `com.nadun27.nsnotesapp`)

## 🔒 Security

- Never commit secrets. Use `.env` and keep `.env` out of version control
- Rotate keys periodically

## 🙌 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feat/awesome`
3. Commit: `git commit -m "feat: add awesome"`
4. Push: `git push origin feat/awesome`
5. Open a PR

## 📸 Screenshots (Optional)

Add screenshots or screen-recordings here to showcase the UI and features.

## 📝 License

This project is licensed under the MIT License.

— Built with ❤️ using Expo and TypeScript

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
