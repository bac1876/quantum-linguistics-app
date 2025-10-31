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
 * Creates actual Audio objects, not just URLs, for better mobile compatibility
 * @param {array} questions - Array of formatted questions
 * @param {string} voice - OpenAI voice to use
 * @returns {Promise<array>} - Array of Audio objects (preloaded and ready)
 */
export async function generateQuestionAudios(questions, voice = 'alloy') {
  console.log('Generating audio elements for all questions...');
  const audioObjects = [];

  for (let i = 0; i < questions.length; i++) {
    try {
      const audioUrl = await textToSpeech(questions[i].question, voice);
      if (audioUrl) {
        // Create Audio object immediately and preload it
        const audio = new Audio(audioUrl);
        audio.preload = 'auto'; // Force preload

        // Wait for it to be ready
        await new Promise((resolve, reject) => {
          audio.onloadeddata = () => {
            console.log(`Audio ${i + 1} preloaded successfully, duration: ${audio.duration}s`);
            resolve();
          };
          audio.onerror = (e) => {
            console.error(`Audio ${i + 1} preload failed:`, e);
            reject(e);
          };
          // Trigger load
          audio.load();
        });

        audioObjects.push(audio);
      } else {
        console.warn(`No audio URL for question ${i + 1}`);
        audioObjects.push(null);
      }
    } catch (error) {
      console.error(`Failed to generate audio ${i + 1}:`, error);
      audioObjects.push(null);
    }
  }

  console.log(`Created ${audioObjects.filter(a => a !== null).length} audio elements`);
  return audioObjects;
}

/**
 * Play preloaded audio objects with pause between questions
 * @param {array} audioObjects - Array of preloaded Audio objects
 * @param {number} pauseDuration - Pause between questions in ms (default 2000)
 * @param {function} onQuestionStart - Callback when each question starts
 * @param {function} onComplete - Callback when all questions finish
 */
export async function playQuestionsSequentially(audioObjects, pauseDuration = 2000, onQuestionStart, onComplete) {
  console.log(`Starting playback of ${audioObjects.length} preloaded audio objects`);

  // Mobile fix: Ensure all audio objects are unmuted and have volume
  audioObjects.forEach((audio, idx) => {
    if (audio) {
      audio.muted = false;
      audio.volume = 1.0;
      console.log(`Audio ${idx + 1} muted=${audio.muted}, volume=${audio.volume}`);
    }
  });

  for (let i = 0; i < audioObjects.length; i++) {
    const audio = audioObjects[i];

    console.log(`Playing question ${i + 1}/${audioObjects.length}`);

    if (onQuestionStart) {
      onQuestionStart(i);
    }

    if (!audio) {
      console.warn(`Audio ${i + 1} is null, skipping`);
      continue;
    }

    // Reset to beginning in case it was played before
    audio.currentTime = 0;

    // Mobile fix: Explicitly set unmuted and full volume before each play
    audio.muted = false;
    audio.volume = 1.0;

    let hasResolved = false;
    let startTime = Date.now();

    await new Promise((resolve) => {
      // Safety timeout
      const timeoutId = setTimeout(() => {
        if (!hasResolved) {
          console.warn(`Audio ${i + 1} timed out after 15s`);
          hasResolved = true;
          audio.pause();
          resolve();
        }
      }, 15000);

      const safeResolve = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);

          const playTime = Date.now() - startTime;
          console.log(`Audio ${i + 1} completed after ${playTime}ms (expected ~${Math.round(audio.duration * 1000)}ms)`);

          // Detect if audio was blocked
          if (playTime < 500 && audio.duration > 1) {
            console.error(`❌ Audio ${i + 1} ended too quickly - AUTOPLAY BLOCKED!`);
          }

          resolve();
        }
      };

      // Set up event handlers
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = () => {
        console.log(`🎵 Audio ${i + 1} ended event fired`);
        cleanup();
        safeResolve();
      };

      audio.onerror = (error) => {
        console.error(`❌ Audio ${i + 1} error event:`, error);
        cleanup();
        safeResolve();
      };

      // Play the preloaded audio
      console.log(`Attempting to play audio ${i + 1} (duration: ${audio.duration}s, ready state: ${audio.readyState})`);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✅ Audio ${i + 1} playing successfully`);
          })
          .catch((error) => {
            console.error(`❌ Audio ${i + 1} play() FAILED:`, error.name, error.message);
            cleanup();
            safeResolve();
          });
      } else {
        console.warn(`Audio ${i + 1} play() returned undefined (old browser?)`);
      }
    });

    // Pause between questions (except after last one)
    if (i < audioObjects.length - 1) {
      console.log(`Pausing for ${pauseDuration}ms before next question`);
      await new Promise(resolve => setTimeout(resolve, pauseDuration));
    }
  }

  console.log('🎉 All audio playback completed');
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
