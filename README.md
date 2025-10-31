# Quantum Linguistics - Cartesian Logic App

A progressive web app that uses NLP (Neuro-Linguistic Programming) Quantum Linguistics, specifically the Cartesian Logic pattern, to help users transform limiting beliefs through powerful questioning.

Based on the NLP Master Practitioner Training Manual - Chapter 2: Quantum Linguistics.

## What is Cartesian Logic?

Cartesian Logic uses four distinct questions to explore beliefs from all angles, creating cognitive shifts and new perspectives:

1. **Theorem (AB)**: What would happen if you did/were/had [belief]?
2. **Converse (~AB)**: What wouldn't happen if you did/were/had [belief]?
3. **Inverse (A~B)**: What would happen if you didn't/weren't/hadn't [belief]?
4. **Non-Mirror Image Reverse (~A~B)**: What wouldn't happen if you didn't/weren't/hadn't [belief]?

## Features

- **Dual Input Modes**: Enter beliefs via text or speech recognition
- **AI-Powered Question Generation**: Uses GPT-5 to generate personalized, therapeutically powerful questions
- **Text-to-Speech Playback**: Listen to questions with customizable pauses for reflection
- **Progressive Web App**: Install on any device and use offline
- **Privacy-Focused**: Session-only storage, no data persistence
- **Fallback Systems**: Graceful degradation if APIs are unavailable

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-5 API
- **TTS**: OpenAI TTS API (with Web Speech API fallback)
- **Speech Recognition**: Web Speech API
- **PWA**: Vite PWA Plugin

## Installation

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (required for both GPT-5 and TTS)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quantumlin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   **Important**: The `.env` file is already in `.gitignore` to protect your API key.

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` (or the next available port).

## Usage

1. **Enter a Limiting Belief**
   - Type your belief in the text area, OR
   - Click the microphone button to speak your belief

2. **Generate Questions**
   - Click "Generate Questions" to create your personalized Cartesian Logic questions
   - GPT-5 analyzes your belief and generates therapeutically powerful questions

3. **Listen and Reflect**
   - Click "Play All Questions" to hear each question spoken aloud
   - Adjust the pause duration between questions (1-5 seconds) for your reflection time
   - Notice what thoughts, feelings, or insights arise

4. **Start New Session**
   - Click "Start New Session" when ready to work with a different belief

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

To preview the production build locally:
```bash
npm run preview
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add: `VITE_OPENAI_API_KEY`

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `VITE_OPENAI_API_KEY`
   - `VITE_ELEVENLABS_API_KEY` (optional)
6. Click "Deploy"

Vercel automatically detects Vite projects and configures the build settings.

## API Keys

### OpenAI API Key (Required)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key
5. Copy and add to your `.env` file

**Note**: This app uses GPT-5 (model: `gpt-5`) for question generation and OpenAI TTS (model: `tts-1-hd`) for high-quality text-to-speech. Ensure your OpenAI account has access to both APIs.

If the OpenAI TTS API is unavailable, the app automatically falls back to the browser's built-in Web Speech API.

## Project Structure

```
quantumlin/
├── src/
│   ├── components/
│   │   ├── BeliefInput.jsx          # Input interface (text/speech)
│   │   ├── CartesianQuestions.jsx   # Questions display
│   │   └── AudioPlayer.jsx          # Playback controls
│   ├── services/
│   │   ├── cartesianLogic.js        # GPT-5 question generation
│   │   ├── ttsService.js            # Text-to-speech service
│   │   └── speechRecognition.js     # Speech-to-text service
│   ├── App.jsx                      # Main application
│   ├── index.css                    # Tailwind directives
│   └── main.jsx                     # React entry point
├── public/
│   └── vite.svg                     # App icon
├── .env                             # Environment variables (not in git)
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Browser Compatibility

- **Speech Recognition**: Chrome, Edge, Safari (desktop/mobile)
- **Web Speech API TTS**: Most modern browsers
- **PWA Features**: Chrome, Edge, Safari, Firefox

For the best experience, use a modern browser with microphone access.

## Privacy & Data

- No user data is stored or persisted
- All processing happens in the current session only
- API keys are kept secure in environment variables
- Beliefs and questions are not logged or saved

## Troubleshooting

### "OpenAI API Error"
- Verify your API key is correct in `.env`
- Ensure you have GPT-5 access on your OpenAI account
- Check your OpenAI account has available credits

### "Speech recognition not available"
- Ensure you're using HTTPS (or localhost)
- Grant microphone permissions when prompted
- Try Chrome or Edge if using another browser

### "Audio playback failed"
- Check OpenAI API key is valid
- Browser fallback should work automatically
- Ensure audio isn't muted in your browser

## License

MIT

## Credits

Based on NLP Quantum Linguistics techniques from the NLP Master Practitioner Training Manual.

## Support

For issues or questions, please open an issue on GitHub.

---

**Powered by GPT-5 and OpenAI TTS**

NLP Quantum Linguistics • © 2025
