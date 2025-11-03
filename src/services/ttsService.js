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
 * @returns {object} Control object with stop() method
 */
export async function playQuestionsSequentially(audioObjects, pauseDuration = 2000, onQuestionStart, onComplete) {
  console.log(`🎬 Starting iOS-compatible playback of ${audioObjects.length} questions`);

  // iOS FIX: Use a SINGLE audio element and swap sources to maintain user gesture context
  // This prevents iOS from blocking playback after pauses
  const mainAudio = new Audio();
  mainAudio.preload = 'auto';
  mainAudio.volume = 1.0;
  mainAudio.muted = false;

  let currentIndex = 0;
  let playbackComplete = false;
  let aborted = false; // Flag to stop playback

  // Control object to allow external stop
  const control = {
    stop: () => {
      console.log('🛑 Playback stopped by user');
      aborted = true;
      mainAudio.pause();
      mainAudio.currentTime = 0;
    },
    audio: mainAudio
  };

  const promise = new Promise((resolveAll) => {
    const playNextQuestion = () => {
      // Check if playback was aborted
      if (aborted) {
        console.log('🛑 Playback aborted');
        if (onComplete) onComplete();
        resolveAll();
        return;
      }

      if (currentIndex >= audioObjects.length || playbackComplete) {
        console.log('🎉 All questions completed');
        if (onComplete) onComplete();
        resolveAll();
        return;
      }

      const sourceAudio = audioObjects[currentIndex];
      console.log(`\n========== Question ${currentIndex + 1}/${audioObjects.length} ==========`);

      if (!sourceAudio) {
        console.warn(`⚠️ Audio ${currentIndex + 1} is null, skipping`);
        currentIndex++;
        playNextQuestion();
        return;
      }

      if (onQuestionStart) {
        onQuestionStart(currentIndex);
      }

      // Set source from the preloaded audio blob
      mainAudio.src = sourceAudio.src;
      console.log(`📥 Loaded audio ${currentIndex + 1}, duration: ${sourceAudio.duration}s`);

      // When this question ends, play next after pause
      mainAudio.onended = () => {
        console.log(`✅ Question ${currentIndex + 1} completed`);
        currentIndex++;

        if (currentIndex < audioObjects.length) {
          console.log(`⏸️ Pausing ${pauseDuration}ms before next question`);
          // Schedule next play IMMEDIATELY in same call stack to maintain user gesture
          setTimeout(() => playNextQuestion(), pauseDuration);
        } else {
          playNextQuestion(); // No more questions
        }
      };

      mainAudio.onerror = (e) => {
        console.error(`❌ Error playing question ${currentIndex + 1}:`, e);
        currentIndex++;
        playNextQuestion();
      };

      // Play immediately - this maintains the user gesture context chain
      const playPromise = mainAudio.play();
      if (playPromise) {
        playPromise
          .then(() => console.log(`▶️ Question ${currentIndex + 1} playing`))
          .catch((err) => {
            console.error(`❌ Play failed for question ${currentIndex + 1}:`, err);
            currentIndex++;
            playNextQuestion();
          });
      }
    };

    // Start playback chain
    playNextQuestion();
  });

  // Return control object with promise
  return { promise, control };
}

/**
 * Clean up audio objects and revoke blob URLs to prevent memory leaks
 * @param {array} audioObjects - Array of Audio objects to clean up
 */
export function cleanupAudioObjects(audioObjects) {
  if (!audioObjects || audioObjects.length === 0) return;

  audioObjects.forEach((audio, index) => {
    if (audio && audio.src) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(audio.src);
      console.log(`🧹 Cleaned up audio ${index + 1} blob URL`);
      // Clear the src to release the audio resource
      audio.src = '';
    }
  });
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
