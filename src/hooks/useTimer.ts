import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(initialSeconds: number, enabled: boolean) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || paused || secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, paused, secondsLeft]);

  const reset = useCallback((seconds: number) => {
    setSecondsLeft(seconds);
    setPaused(false);
  }, []);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0 && enabled,
    reset,
    pause,
    resume,
  };
}
