# Swa-AI (स्व)
[![Chrome AI Challenge](https://img.shields.io/badge/Chrome_AI_Challenge-2025-blueviolet)](https://developer.chrome.com/blog/ai-challenge-2025)

**Your Private, 100% On-Device AI Persona Hub.**

Built for the Google Chrome Built-in AI Challenge 2025.

---

### 🔴 **Live Demo Link**

**[https://YOUR_VERCEL_PROJECT_NAME.vercel.app](https://YOUR_VERCEL_PROJECT_NAME.vercel.app)**

> **Note:** This demo will **ONLY** work in a compatible browser (like Chrome Canary) with the required flags enabled. Please see the "How to Test" section below for instructions.

---

### 💡 Inspiration: Why We Built Swa-AI

We love the power of modern AI, but we often feel frustrated by the "one-size-fits-all" nature of large cloud models. Every new chat starts from zero, forcing us to re-explain our custom instructions, roles, and context. This "generic AI fatigue" is inefficient and time-consuming.

Furthermore, sending sensitive data—like personal journal entries, private code, or speech practice—to a server just isn't an option for many users.

The Chrome Built-in AI Challenge presented a perfect opportunity. We saw a future where AI isn't just a service you access, but a personal tool you *own*. `Swa-AI` (स्व) was born from this vision: to create a truly private, fast, and highly specialized AI hub that adapts to *you*, not the other way around. We wanted to build an AI that remembers your needs, lives entirely on your device, and works for you, for free, forever.

---

### The Problem

Modern cloud-based AI models are powerful but come with trade-offs:
* **Privacy:** Your data is sent to a server for processing.
* **Cost:** API calls are expensive.
* **Connectivity:** They require a constant internet connection.
* **Context:** They are "one-size-fits-all," forcing you to re-explain context and instructions (like persona, tone, and format) in every new chat.

### The Solution: Swa-AI

`Swa-AI` (from the Sanskrit "स्व" meaning "one's own self") is a 100% client-side AI platform. It leverages the built-in Chrome `LanguageModel` API (powered by Gemini Nano) to provide a completely private, offline-first, and zero-cost AI experience.

The core feature is the **Persona Hub**: you can create, save, and reuse persistent, specialist AI personas tailored to your exact needs.

``

---

## 🚀 How to Test (Critical for Judges)

This project uses experimental Chrome APIs. To run it, you **must** use a compatible browser and enable specific flags.

1.  **Get Browser:** Download and install **Chrome Canary** (or a recent Beta/Dev build).
2.  **Enable Flags:** Copy/paste each URL into your browser's address bar, set the flag to **Enabled**, and relaunch after enabling all three.
    * `chrome://flags/#prompt-api-for-gemini-nano`
    * `chrome://flags/#optimization-guide-on-device-model` (Select "Enabled Bypass...")
    * `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` (Required for Speech Coach)
3.  **Visit Demo:** Go to the [Live Demo Link](https://YOUR_VERCEL_PROJECT_NAME.vercel.app) using your configured Chrome Canary.
4.  **Model Download:** The first time you visit a chat page, the app will show a **"Download Model"** button. This requires a user click. The on-device model will download in the background (progress is visible at `chrome://on-device-internals`).
5.  **Hardware Requirements:**
    * **Text Features:** Should work on most systems meeting the base requirements (e.g., 8GB RAM).
    * **Multimodal (Speech Coach):** This feature requires significant resources. It will only work on systems with a **GPU (>4GB VRAM)** or **16GB+ RAM** for CPU fallback. On other systems, it will gracefully display a "capability not available" error.

---


### 💻 Local Setup & Testing

If you want to run this project on your local machine:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/kaushik0010/Swa-AI.git
    cd Swa-AI
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Browser (Crucial):**
    * Follow the **"How to Test"** steps above to enable all three required flags in `chrome://flags` in your Chrome Canary browser.

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

5.  **Access the App:**
    * Open the `http://localhost:5173` URL (or as specified in your terminal) in your **configured Chrome Canary** browser.

---


## ✨ Features

* **100% Private:** All AI processing and data storage (chats, personas) happen and stay in your browser.
* **Zero Cost & Offline:** Runs entirely on-device, requiring no API keys or internet connection after the initial model download.
* **Persistent Persona Hub:** Create, save, and delete custom AI personas stored in your browser's `localStorage`.
* **Chat History:** All conversations are saved locally and grouped by persona.
* **Automatic Chat Titles:** New text chats are automatically titled by the AI for easy reference.
* **Pre-built Personas:**
    * **StoryWeaver:** A creative collaborator for brainstorming and writing stories, complete with title suggestions.
    * **Prompt Writer:** An expert assistant to help you engineer better, more effective prompts.
    * **Speech Coach (Multimodal):** Analyzes your speech using **live audio + video snapshots** to give feedback on tone, clarity, and visual cues (requires a capable system).
* **In-Chat Media Upload:** Attach images or audio files directly into chats for multimodal queries (works with Image Analyst, etc.).
* **Rewrite Functionality:** Click the rewrite icon on any AI response (text personas only) to get a revised version based on your instructions (e.g., "make this shorter").

``

---

## 🛠️ Tech Stack

* **Browser API:** Chrome Built-in AI (`LanguageModel` API / Gemini Nano)
* **Framework:** React (Vite) + TypeScript
* **UI:** TailwindCSS + `shadcn/ui` (Dialog, Sonner, Select, etc.)
* **Media:** `react-media-recorder` (for live capture)
* **State & Storage:** React Hooks (`useState`, `useCallback`) & `localStorage`
* **Validation:** `zod`
* **Deployment:** Vercel

---

## 🔮 Future Improvements

* Implement the "Analyze Uploaded Video" feature for the Speech Coach.
* Allow editing of custom-created personas.
* Add a dedicated `Rewriter API` persona.
* Explore `session.append()` for even longer conversational context.

---

## 👤 Author

* **[Kaushik Paykoli]**
* [github.com/kaushik0010](https://github.com/kaushik0010)