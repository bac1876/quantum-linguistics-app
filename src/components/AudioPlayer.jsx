import { useState } from 'react';

export default function AudioPlayer({ onPlay, onStop, isPlaying, onNewSession }) {
  const [pauseDuration, setPauseDuration] = useState(2);

  return (
    <div className="card w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlay}
            disabled={isPlaying}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
                Playing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play All Questions
              </>
            )}
          </button>

          {isPlaying && (
            <button
              onClick={onStop}
              className="btn-secondary px-4 py-3 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}
        </div>

        {/* Pause Duration Control */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pause between questions:
          </label>
          <select
            value={pauseDuration}
            onChange={(e) => setPauseDuration(Number(e.target.value))}
            disabled={isPlaying}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
          >
            <option value={1}>1 second</option>
            <option value={2}>2 seconds</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
          </select>
        </div>
      </div>

      {/* New Session Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewSession}
          disabled={isPlaying}
          className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Session
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        <p>Click "Play All Questions" to hear each Cartesian Logic question with pauses for reflection</p>
      </div>

      {/* Pass pause duration back to parent */}
      <input type="hidden" value={pauseDuration} data-pause-duration={pauseDuration * 1000} />
    </div>
  );
}
