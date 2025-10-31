import { useState } from 'react';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechRecognition';

export default function BeliefInput({ onBeliefSubmit, isProcessing }) {
  const [belief, setBelief] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const handleSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    setIsListening(true);
    setError('');

    const recognition = createSpeechRecognition(
      (transcript) => {
        setBelief(transcript);
        setIsListening(false);
      },
      (errorMessage) => {
        setError(`Speech recognition error: ${errorMessage}`);
        setIsListening(false);
      }
    );

    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (belief.trim()) {
      onBeliefSubmit(belief.trim());
    }
  };

  return (
    <div className="card w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          What limiting belief would you like to explore?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Enter or speak your belief, and we'll guide you through Cartesian Logic
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={belief}
            onChange={(e) => setBelief(e.target.value)}
            placeholder="Example: I can't be successful in my career..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            disabled={isProcessing}
          />

          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={handleSpeechRecognition}
              disabled={isListening || isProcessing}
              className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-primary-100 hover:bg-primary-200 dark:bg-primary-800 dark:hover:bg-primary-700'
              }`}
              title="Click to speak your belief"
            >
              <svg
                className={`w-6 h-6 ${isListening ? 'text-white' : 'text-primary-600 dark:text-primary-300'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        {isListening && (
          <div className="text-primary-600 dark:text-primary-400 text-sm animate-pulse">
            🎤 Listening... Speak your belief now
          </div>
        )}

        <button
          type="submit"
          disabled={!belief.trim() || isProcessing}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Questions...
            </span>
          ) : (
            'Generate Cartesian Logic Questions'
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <details className="text-sm text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700">
            What is Cartesian Logic?
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              Cartesian Logic is an NLP technique that challenges limiting beliefs by exploring four
              perspectives:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Theorem:</strong> What would happen if you did?</li>
              <li><strong>Converse:</strong> What wouldn't happen if you did?</li>
              <li><strong>Inverse:</strong> What would happen if you didn't?</li>
              <li><strong>Non-Mirror Reverse:</strong> What wouldn't happen if you didn't?</li>
            </ul>
            <p className="mt-2 text-xs italic">
              Based on NLP Master Practitioner Manual - Chapter 2: Quantum Linguistics
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
