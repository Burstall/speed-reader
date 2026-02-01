'use client';

import { useReaderStore } from '@/store/readerStore';

export function LaunchButton() {
  const { launch, startLaunch, cancelLaunch, wpm, words, isPlaying, currentIndex, restart } = useReaderStore();

  const hasContent = words.length > 0;
  const isLaunching = launch.isLaunching;
  const inCountdown = isLaunching && launch.countdown > 0;
  const inRamp = isLaunching && launch.rampStartTime > 0;
  const isAtStart = currentIndex === 0;
  const isMidReading = !isAtStart && !isPlaying;

  const handleLaunch = () => {
    if (isLaunching) {
      cancelLaunch();
    } else {
      startLaunch();
    }
  };

  const handleLaunchFromStart = () => {
    restart();
    // Small delay to ensure state is updated before launching
    setTimeout(() => {
      useReaderStore.getState().startLaunch();
    }, 50);
  };

  // Don't show if no content or already playing (without launch)
  if (!hasContent || (isPlaying && !isLaunching)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main launch/cancel button - larger on mobile when resuming mid-reading */}
      <button
        onClick={handleLaunch}
        className={`
          relative rounded-lg font-medium transition-all duration-200
          ${isLaunching
            ? 'px-6 py-3 text-sm bg-red-600 hover:bg-red-700 text-white'
            : isMidReading
              ? 'px-8 py-4 text-base md:px-6 md:py-3 md:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20'
              : 'px-6 py-3 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
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
          <span className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isAtStart ? `Launch to ${wpm} WPM` : `Continue at ${wpm} WPM`}
            </span>
            {isMidReading && (
              <span className="text-[10px] opacity-70 font-normal">
                Resume with speed ramp from current position
              </span>
            )}
          </span>
        )}
      </button>

      {/* Secondary actions when paused mid-reading */}
      {isMidReading && !isLaunching && (
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          <button
            onClick={handleLaunchFromStart}
            className="hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Launch from start
          </button>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <button
            onClick={restart}
            className="hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Reset position
          </button>
        </div>
      )}

      {/* Launch from start option when at start - no secondary needed */}
      {isAtStart && !isLaunching && (
        <p className="text-xs text-gray-500 dark:text-gray-600">
          3-2-1 countdown, then ramp from 150 to {wpm} WPM
        </p>
      )}

      {isLaunching && (
        <button
          onClick={cancelLaunch}
          className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
