'use client';

import { useReaderStore } from '@/store/readerStore';

export function LaunchButton() {
  const { launch, startLaunch, cancelLaunch, wpm, words, isPlaying } = useReaderStore();

  const hasContent = words.length > 0;
  const isLaunching = launch.isLaunching;
  const inCountdown = isLaunching && launch.countdown > 0;
  const inRamp = isLaunching && launch.rampStartTime > 0;

  const handleClick = () => {
    if (isLaunching) {
      cancelLaunch();
    } else {
      startLaunch();
    }
  };

  // Don't show if no content or already playing (without launch)
  if (!hasContent || (isPlaying && !isLaunching)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={`
          relative px-6 py-3 rounded-lg font-medium text-sm
          transition-all duration-200
          ${isLaunching
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }
        `}
      >
        {inCountdown ? (
          <span className="flex items-center gap-2">
            <span className="text-2xl font-bold animate-pulse">{launch.countdown}</span>
            <span>Get Ready...</span>
          </span>
        ) : inRamp ? (
          <span className="flex items-center gap-2">
            <span className="font-mono">{launch.currentWpm} WPM</span>
            <span className="text-xs opacity-75">→ {launch.targetWpm}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Launch to {wpm} WPM
          </span>
        )}
      </button>

      {!isLaunching && (
        <p className="text-xs text-gray-600">
          3-2-1 countdown, then ramp from 150 to {wpm} WPM
        </p>
      )}

      {isLaunching && (
        <button
          onClick={cancelLaunch}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
