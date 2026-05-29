import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook that provides a counting-up timer (HH:MM:SS).
 *
 * Returns:
 *   seconds  – total elapsed seconds
 *   running  – boolean, whether the timer is ticking
 *   display  – formatted "HH:MM:SS" string
 *   start()  – start / resume
 *   stop()   – pause the timer
 *   reset()  – stop and zero-out
 */
const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Clear any lingering interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;          // already running
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  // Format as HH:MM:SS
  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const display = `${pad(h)}:${pad(m)}:${pad(s)}`;

  return { seconds, running, display, start, stop, reset };
};

export default useTimer;
