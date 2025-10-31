/**
 * Speech Recognition Service
 * Uses Web Speech API for voice input
 */

/**
 * Check if speech recognition is supported
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Create and configure speech recognition instance
 * @param {function} onResult - Callback with transcribed text
 * @param {function} onError - Callback with error
 * @returns {object} - Recognition instance with start/stop methods
 */
export function createSpeechRecognition(onResult, onError) {
  if (!isSpeechRecognitionSupported()) {
    throw new Error('Speech recognition is not supported in this browser');
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Configuration
  recognition.continuous = false; // Stop after one result
  recognition.interimResults = false; // Only final results
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Event handlers
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResult) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        if (onError) {
          onError(error.message);
        }
      }
    },
    stop: () => {
      recognition.stop();
    },
    abort: () => {
      recognition.abort();
    }
  };
}

/**
 * Simple promise-based speech recognition
 * @returns {Promise<string>} - Transcribed text
 */
export function recognizeSpeech() {
  return new Promise((resolve, reject) => {
    const recognition = createSpeechRecognition(
      (text) => resolve(text),
      (error) => reject(new Error(error))
    );
    recognition.start();
  });
}
