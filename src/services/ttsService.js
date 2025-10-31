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
  console.log(`Starting playback of ${audioUrls.length} audio files`);

  // Use a single Audio element for better mobile compatibility
  const audio = new Audio();
  let currentIndex = 0;

  const playNext = () => {
    return new Promise((resolve) => {
      if (currentIndex >= audioUrls.length) {
        console.log('All audio playback completed');
        resolve();
        return;
      }

      const i = currentIndex;
      console.log(`Processing question ${i + 1}/${audioUrls.length}`);

      if (onQuestionStart) {
        onQuestionStart(i);
      }

      if (!audioUrls[i]) {
        console.warn(`Audio ${i + 1} URL is null/undefined`);
        currentIndex++;
        resolve(playNext());
        return;
      }

      let hasResolved = false;
      let startTime = Date.now();

      // Safety timeout (30 seconds max per audio)
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          console.warn(`Audio ${i + 1} timed out after 30s`);
          hasResolved = true;
          audio.pause();
          audio.currentTime = 0;
          currentIndex++;
          resolve(playNext());
        }
      }, 30000);

      const safeResolve = async () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);

          const playTime = Date.now() - startTime;
          console.log(`Audio ${i + 1} completed after ${playTime}ms`);

          // Check if audio actually played (duration > 1 second means real audio)
          if (playTime < 500 && audio.duration > 0) {
            console.warn(`Audio ${i + 1} ended too quickly (${playTime}ms) - possible autoplay block`);
          }

          // Pause between questions (except after last one)
          if (i < audioUrls.length - 1) {
            console.log(`Pausing for ${pauseDuration}ms`);
            await new Promise(res => setTimeout(res, pauseDuration));
          }

          currentIndex++;
          resolve(playNext());
        }
      };

      // Set up event handlers
      audio.onended = safeResolve;
      audio.onerror = (error) => {
        console.error(`Audio ${i + 1} playback error:`, error);
        safeResolve();
      };

      // Wait for audio to be loaded with metadata
      audio.onloadedmetadata = () => {
        console.log(`Audio ${i + 1} loaded, duration: ${audio.duration}s`);
        if (audio.duration === 0 || isNaN(audio.duration)) {
          console.error(`Audio ${i + 1} has invalid duration, skipping`);
          safeResolve();
        }
      };

      // Set source and play
      audio.src = audioUrls[i];
      audio.load();

      // Attempt to play
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`Audio ${i + 1} started playing successfully`);
          })
          .catch((error) => {
            console.error(`Audio ${i + 1} play() failed:`, error.name, error.message);
            // Try to play anyway after a short delay (sometimes helps on mobile)
            setTimeout(() => {
              audio.play().catch(e => {
                console.error(`Audio ${i + 1} retry also failed:`, e.message);
                safeResolve();
              });
            }, 100);
          });
      }
    });
  };

  await playNext();

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
