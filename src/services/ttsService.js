/**
 * Text-to-Speech Service
 * Supports ElevenLabs API with Web Speech API fallback
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (calm, thoughtful)

/**
 * Generate speech using ElevenLabs API
 * @param {string} text - Text to convert to speech
 * @returns {Promise<Blob>} - Audio blob
 */
async function generateElevenLabsSpeech(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return await response.blob();
}

/**
 * Generate speech using browser Web Speech API (fallback)
 * @param {string} text - Text to convert to speech
 * @returns {Promise<null>} - Plays directly, no blob returned
 */
function generateBrowserSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser does not support speech synthesis'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for contemplation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a calm, professional voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.lang === 'en-US' && (voice.name.includes('Daniel') || voice.name.includes('Alex'))
    ) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    speechSynthesis.speak(utterance);
  });
}

/**
 * Main TTS function - tries ElevenLabs first, falls back to browser
 * @param {string} text - Text to convert to speech
 * @param {boolean} useBrowserFallback - Force use of browser TTS
 * @returns {Promise<string|null>} - Returns audio URL for ElevenLabs, null for browser TTS
 */
export async function textToSpeech(text, useBrowserFallback = false) {
  try {
    if (!useBrowserFallback && ELEVENLABS_API_KEY) {
      const audioBlob = await generateElevenLabsSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } else {
      await generateBrowserSpeech(text);
      return null; // Browser TTS plays directly
    }
  } catch (error) {
    console.error('TTS error:', error);
    // Fallback to browser TTS
    if (!useBrowserFallback) {
      console.log('Falling back to browser TTS');
      await generateBrowserSpeech(text);
      return null;
    }
    throw error;
  }
}

/**
 * Generate audio for all four Cartesian questions
 * @param {array} questions - Array of formatted questions
 * @returns {Promise<array>} - Array of audio URLs
 */
export async function generateQuestionAudios(questions) {
  const audioPromises = questions.map(q => textToSpeech(q.question));
  return await Promise.all(audioPromises);
}

/**
 * Play audio with pause between questions
 * @param {array} audioUrls - Array of audio URLs
 * @param {number} pauseDuration - Pause between questions in ms (default 2000)
 * @param {function} onQuestionStart - Callback when each question starts
 * @param {function} onComplete - Callback when all questions finish
 */
export async function playQuestionsSequentially(audioUrls, pauseDuration = 2000, onQuestionStart, onComplete) {
  for (let i = 0; i < audioUrls.length; i++) {
    if (onQuestionStart) {
      onQuestionStart(i);
    }

    if (audioUrls[i]) {
      // Play audio from ElevenLabs
      await new Promise((resolve) => {
        const audio = new Audio(audioUrls[i]);
        audio.onended = resolve;
        audio.onerror = resolve; // Continue even if error
        audio.play();
      });
    }

    // Pause between questions (except after last one)
    if (i < audioUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, pauseDuration));
    }
  }

  if (onComplete) {
    onComplete();
  }
}

/**
 * Stop all speech synthesis
 */
export function stopSpeech() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

/**
 * Check if ElevenLabs API is available
 * @returns {boolean}
 */
export function isElevenLabsAvailable() {
  return !!ELEVENLABS_API_KEY;
}
