/**
 * Text-to-Speech Service
 * Supports OpenAI TTS API with Web Speech API fallback
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, route through backend
});

/**
 * Generate speech using OpenAI TTS API
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {Promise<Blob>} - Audio blob
 */
async function generateOpenAISpeech(text, voice = 'alloy') {
  try {
    console.log('Calling OpenAI TTS API...');
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd', // High-quality model
      voice: voice, // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 0.95, // Slightly slower for contemplation
    });

    // Convert response to blob
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    console.log('OpenAI TTS response received successfully');
    return blob;
  } catch (error) {
    console.error('OpenAI TTS API Error:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    throw error;
  }
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
 * Main TTS function - tries OpenAI TTS first, falls back to browser
 * @param {string} text - Text to convert to speech
 * @param {string} voice - OpenAI voice (alloy, echo, fable, onyx, nova, shimmer)
 * @param {boolean} useBrowserFallback - Force use of browser TTS
 * @returns {Promise<string|null>} - Returns audio URL for OpenAI TTS, null for browser TTS
 */
export async function textToSpeech(text, voice = 'alloy', useBrowserFallback = false) {
  try {
    if (!useBrowserFallback && import.meta.env.VITE_OPENAI_API_KEY) {
      const audioBlob = await generateOpenAISpeech(text, voice);
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
 * @param {string} voice - OpenAI voice to use
 * @returns {Promise<array>} - Array of audio URLs
 */
export async function generateQuestionAudios(questions, voice = 'alloy') {
  const audioPromises = questions.map(q => textToSpeech(q.question, voice));
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
      // Play audio from OpenAI TTS
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
 * Check if OpenAI API is available
 * @returns {boolean}
 */
export function isOpenAIAvailable() {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

/**
 * Available OpenAI voices
 */
export const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Calm and professional' },
  { id: 'fable', name: 'Fable', description: 'Warm and expressive' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Bright and energetic' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' }
];
