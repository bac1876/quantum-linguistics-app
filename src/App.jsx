import { useState, useRef } from 'react';
import BeliefInput from './components/BeliefInput';
import CartesianQuestions from './components/CartesianQuestions';
import AudioPlayer from './components/AudioPlayer';
import { generateCartesianQuestions, formatQuestionsForDisplay } from './services/cartesianLogic';
import { generateQuestionAudios, playQuestionsSequentially, stopSpeech } from './services/ttsService';

function App() {
  const [currentBelief, setCurrentBelief] = useState('');
  const [questions, setQuestions] = useState(null);
  const [formattedQuestions, setFormattedQuestions] = useState([]);
  const [audioObjects, setAudioObjects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [error, setError] = useState('');
  const pauseDurationRef = useRef(2000); // Default 2 seconds
  const wakeLockRef = useRef(null); // Store wake lock reference

  const handleBeliefSubmit = async (belief) => {
    setCurrentBelief(belief);
    setIsProcessing(true);
    setIsLoadingAudio(false);
    setError('');

    try {
      // Generate questions using GPT-5
      const generatedQuestions = await generateCartesianQuestions(belief);
      setQuestions(generatedQuestions);

      // Format for display
      const formatted = formatQuestionsForDisplay(generatedQuestions);
      setFormattedQuestions(formatted);

      setIsProcessing(false); // Questions are ready, show them
      setIsLoadingAudio(true); // Now loading audio

      // Generate audio objects for all questions (preloaded and ready)
      const audios = await generateQuestionAudios(formatted);

      // Verify all audios loaded successfully
      const validAudios = audios.filter(a => a !== null);
      if (validAudios.length < formatted.length) {
        console.warn(`Only ${validAudios.length}/${formatted.length} audio files loaded successfully`);
      }

      setAudioObjects(audios);
      setIsLoadingAudio(false);

    } catch (err) {
      console.error('Error processing belief:', err);
      setError('Failed to generate questions. Please try again.');
      setIsProcessing(false);
      setIsLoadingAudio(false);
    }
  };

  const handlePlay = async () => {
    if (audioObjects.length === 0) {
      setError('No audio available. Please generate questions first.');
      return;
    }

    setIsPlaying(true);
    setError('');

    // Mobile fix: Request Wake Lock to keep screen active during playback
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('✅ Wake Lock acquired - screen will stay active');
      }
    } catch (err) {
      console.warn('Wake Lock not supported or failed:', err);
    }

    try {
      await playQuestionsSequentially(
        audioObjects,
        pauseDurationRef.current,
        (index) => {
          setCurrentQuestionIndex(index);
        },
        () => {
          setIsPlaying(false);
          setCurrentQuestionIndex(-1);
          // Release wake lock when playback completes
          if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
            console.log('✅ Wake Lock released');
          }
        }
      );
    } catch (err) {
      console.error('Playback error:', err);
      setError('Playback failed. Please try again.');
      setIsPlaying(false);
      setCurrentQuestionIndex(-1);
      // Release wake lock on error
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('✅ Wake Lock released (error)');
      }
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
    setCurrentQuestionIndex(-1);
    // Release wake lock if active
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('✅ Wake Lock released (manual stop)');
    }
  };

  const handleNewSession = () => {
    handleStop();
    setCurrentBelief('');
    setQuestions(null);
    setFormattedQuestions([]);
    setAudioObjects([]);
    setError('');
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 mb-3">
            Quantum Linguistics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Transform limiting beliefs using Cartesian Logic
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Based on NLP Master Practitioner Techniques
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Belief Input */}
          {!questions && (
            <BeliefInput
              onBeliefSubmit={handleBeliefSubmit}
              isProcessing={isProcessing}
            />
          )}

          {/* Current Belief Display */}
          {currentBelief && questions && (
            <div className="card max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Belief:</h3>
              <p className="text-lg italic text-gray-900 dark:text-white">
                "{currentBelief}"
              </p>
            </div>
          )}

          {/* Questions Display */}
          {formattedQuestions.length > 0 && (
            <CartesianQuestions
              questions={formattedQuestions}
              currentQuestionIndex={currentQuestionIndex}
              isPlaying={isPlaying}
            />
          )}

          {/* Audio Player Controls */}
          {formattedQuestions.length > 0 && (
            <AudioPlayer
              onPlay={handlePlay}
              onStop={handleStop}
              isPlaying={isPlaying}
              isLoadingAudio={isLoadingAudio}
              onNewSession={handleNewSession}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by GPT-5 and OpenAI TTS
          </p>
          <p className="mt-1">
            NLP Quantum Linguistics • © 2025
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
