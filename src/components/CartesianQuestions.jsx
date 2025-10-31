export default function CartesianQuestions({ questions, currentQuestionIndex, isPlaying }) {
  return (
    <div className="card w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Cartesian Logic Questions
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Listen carefully and reflect on each question
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className={`p-5 rounded-lg border-2 transition-all duration-300 ${
              index === currentQuestionIndex && isPlaying
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02] shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${q.color}`}>
                    {q.label}
                  </span>
                  {index === currentQuestionIndex && isPlaying && (
                    <span className="flex items-center text-primary-600 dark:text-primary-400 text-sm animate-pulse">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                      </svg>
                      Playing
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {q.description}
                </p>
              </div>
              <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                {q.id}
              </span>
            </div>

            <p className={`text-lg font-medium mt-3 ${
              index === currentQuestionIndex && isPlaying
                ? 'text-primary-900 dark:text-primary-100'
                : 'text-gray-800 dark:text-gray-200'
            }`}>
              {q.question}
            </p>

            {index === currentQuestionIndex && isPlaying && (
              <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 animate-pulse-slow" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How to Use
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Listen to each question carefully</li>
          <li>• Take a moment to reflect before moving to the next</li>
          <li>• Notice what thoughts, feelings, or insights arise</li>
          <li>• There are no right or wrong answers - this is about exploration</li>
        </ul>
      </div>
    </div>
  );
}
