import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./useAuth";

export const useIdleTimer = () => {
  const { logout, isAuthenticated } = useAuth();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  // .env'den dakikaları alıp milisaniyeye çeviriyoruz
  const idleTimeoutMs =
    (Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 5) * 60 * 1000;
  const warningDurationSec = Math.round(
    (Number(import.meta.env.VITE_IDLE_WARNING_MINUTES) || 1) * 60,
  );

  const idleTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const isWarningOpenRef = useRef(false);

  // Ref'i güncel tut
  isWarningOpenRef.current = isWarningOpen;

  const clearAllTimers = () => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearAllTimers();
    setIsWarningOpen(false);
    setRemainingSeconds(warningDurationSec);

    idleTimerRef.current = window.setTimeout(() => {
      setIsWarningOpen(true);
      let timeLeft = warningDurationSec;
      setRemainingSeconds(timeLeft);

      countdownIntervalRef.current = window.setInterval(() => {
        timeLeft -= 1;
        setRemainingSeconds(timeLeft);

        if (timeLeft <= 0) {
          clearAllTimers();
          logout();
        }
      }, 1000);
    }, idleTimeoutMs);
  }, [isAuthenticated, idleTimeoutMs, warningDurationSec, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      // Uyarı modalı açıkken fare kıpırdasa bile süreyi sıfırlama (butona basılması gerekir)
      if (!isWarningOpenRef.current) {
        startIdleTimer();
      }
    };

    // İlk açılışta sayacı başlat
    startIdleTimer();

    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, startIdleTimer]);

  const stayLoggedIn = () => {
    startIdleTimer();
  };

  return {
    isWarningOpen,
    remainingSeconds,
    stayLoggedIn,
    logout,
  };
};
