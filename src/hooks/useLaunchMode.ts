'use client';

import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/readerStore';

const RAMP_DURATION = 12000; // 12 seconds to reach target speed
const START_WPM = 150;

/**
 * Launch mode hook - handles countdown and speed ramping
 */
export function useLaunchMode() {
  const {
    launch,
    updateCountdown,
    startRamp,
    updateRampWpm,
    endLaunch,
  } = useReaderStore();

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const rampRef = useRef<number | null>(null);

  // Handle countdown (3, 2, 1)
  useEffect(() => {
    if (!launch.isLaunching || launch.countdown === 0) {
      return;
    }

    countdownRef.current = setTimeout(() => {
      if (launch.countdown > 1) {
        updateCountdown(launch.countdown - 1);
      } else {
        // Countdown finished, start ramping
        startRamp();
      }
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [launch.isLaunching, launch.countdown, updateCountdown, startRamp]);

  // Handle speed ramping
  useEffect(() => {
    if (!launch.isLaunching || launch.countdown > 0 || launch.rampStartTime === 0) {
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - launch.rampStartTime;
      const progress = Math.min(1, elapsed / RAMP_DURATION);

      // Ease-out curve for smoother acceleration feel
      const easedProgress = 1 - Math.pow(1 - progress, 2);

      const currentWpm = Math.round(
        START_WPM + (launch.targetWpm - START_WPM) * easedProgress
      );

      updateRampWpm(currentWpm);

      if (progress >= 1) {
        // Ramp complete
        endLaunch();
      } else {
        rampRef.current = requestAnimationFrame(tick);
      }
    };

    rampRef.current = requestAnimationFrame(tick);

    return () => {
      if (rampRef.current) {
        cancelAnimationFrame(rampRef.current);
      }
    };
  }, [launch.isLaunching, launch.countdown, launch.rampStartTime, launch.targetWpm, updateRampWpm, endLaunch]);
}

/**
 * Get the effective WPM (launch mode or normal)
 */
export function useEffectiveWpm(): number {
  const { wpm, launch } = useReaderStore();

  if (launch.isLaunching && launch.rampStartTime > 0) {
    return launch.currentWpm;
  }

  return wpm;
}
