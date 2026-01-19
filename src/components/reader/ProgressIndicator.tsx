'use client';

import { useReaderStore } from '@/store/readerStore';

export function ProgressIndicator() {
  const { currentIndex, words, progress, wpm, jumpTo } = useReaderStore();
  const totalWords = words.length;

  // Calculate time remaining
  const wordsRemaining = totalWords - currentIndex - 1;
  const minutesRemaining = wordsRemaining / wpm;
  const timeRemaining = formatTime(minutesRemaining);

  // Handle click on progress bar to jump to position
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalWords === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetIndex = Math.floor(percentage * totalWords);
    jumpTo(targetIndex);
  };

  if (totalWords === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      {/* Progress bar */}
      <div
        className="w-full h-1.5 bg-gray-800 rounded-full cursor-pointer overflow-hidden"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${Math.round(progress)}%`}
      >
        <div
          className="h-full bg-white rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Word {currentIndex + 1} of {totalWords.toLocaleString()}
        </span>
        <span>
          {timeRemaining} remaining
        </span>
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.ceil(minutes * 60);
    return `${seconds}s`;
  }

  if (minutes < 60) {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
