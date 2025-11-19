import { useState, useEffect, useRef, useCallback } from "react";

export default function useCanvaBehavior(containerClass = "chat-container") {
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [hoverDuration, setHoverDuration] = useState(0);
  const [action, setAction] = useState("Normal");
  const [focusMode, setFocusMode] = useState(false);
  const [focusedChatIds, setFocusedChatIds] = useState([]);
  const [clickErrorRate, setClickErrorRate] = useState(0);
  const [clickModeActive, setClickModeActive] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);

  // References
  const lastScrollY = useRef(window.scrollY);
  const lastTime = useRef(Date.now());
  const hoverStartTime = useRef(null);
  const enlargeTimeoutRef = useRef(null);
  const clickModeTimeoutRef = useRef(null);
  const totalClicksRef = useRef(0);
  const errorClicksRef = useRef(0);
  const idleTimerRef = useRef(null);
  const activeStartTimeRef = useRef(null);
  const lastFastScrollRef = useRef(0);

  // --- SAVE BEHAVIOR (moved up so it’s defined before being used)
  const saveBehavior = useCallback(async (customAction = null) => {
  try {
    const token = localStorage.getItem("accessToken");
    const participantId = localStorage.getItem("participantId");
    if (!token || !participantId) return;

    const payload = {
      participant_id: participantId,
      scroll_velocity: scrollVelocity,
      hover_duration: `${hoverDuration}s`,  // ← always use actual state value
      click_error_rate: clickErrorRate,
      focus_mode: focusMode ? "Active" : "Inactive",
      action: customAction || action,
    };

    const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/";

    const res = await fetch(`${API_BASE}save-behavior/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Failed to save behavior:", res.status, errText);
    } else {
      console.log("✅ Behavior saved:", payload);
    }
  } catch (err) {
    console.error("⚠️ Error in saveBehavior:", err);
  }
}, [scrollVelocity, hoverDuration, clickErrorRate, focusMode, action]);

  // --- ENLARGE MODE ---
  const triggerEnlargeMode = useCallback(() => {
    const container = document.querySelector(`.${containerClass}`);
    if (!container) return;

    document.body.classList.add("enlarge-mode");
    container.classList.add("enlarged");

    clearTimeout(enlargeTimeoutRef.current);
    enlargeTimeoutRef.current = setTimeout(() => {
      document.body.classList.remove("enlarge-mode");
      container.classList.remove("enlarged");
      if (!clickModeActive && !focusMode) setAction("Normal");
    }, 10000);
  }, [clickModeActive, focusMode, containerClass]);

// --- SCROLL DETECTION ---
useEffect(() => {
  const handleScroll = () => {
    const currentY = window.scrollY;
    const currentTime = Date.now();
    const dy = Math.abs(currentY - lastScrollY.current);
    const dt = (currentTime - lastTime.current) / 1000;

    let rawVelocity = dt > 0 ? dy / dt : 0;
    rawVelocity = Math.min(rawVelocity, 100);

    const maxVelocity = 50;
    const smoothingFactor = 0.05;

    const easedVelocity =
      rawVelocity > maxVelocity
        ? scrollVelocity + (maxVelocity - scrollVelocity) * smoothingFactor
        : scrollVelocity + (rawVelocity - scrollVelocity) * smoothingFactor;

    setScrollVelocity(easedVelocity);

    lastScrollY.current = currentY;
    lastTime.current = currentTime;

    // Reset per scroll burst
    clearTimeout(window.scrollResetTimeout);
    window.scrollResetTimeout = setTimeout(() => {
      setScrollVelocity(0);
    }, 2000);

    // --- FAST SCROLL (>=30px/s) ---
    if (easedVelocity >= 30) {
      clearTimeout(window.slowScrollTimeout);
      setAction("Fast Scroll Detected");

      // Save if the velocity changed enough since last save
      if (Math.abs(easedVelocity - lastFastScrollRef.current) > 2) {
        lastFastScrollRef.current = easedVelocity;
        saveBehavior(`Scroll Velocity (>=30px/s): ${easedVelocity.toFixed(1)} px/s`);
      }

      return;
    }

    // --- SLOW (<30px/s) ---
    else if (easedVelocity > 0 && easedVelocity < 30) {
      clearTimeout(window.slowScrollTimeout);

      window.slowScrollTimeout = setTimeout(async () => {
        if (easedVelocity >= 30) return;

        setAction("Slow Scroll Detected");
        if (!window.scrollBehaviorSaved) {
          await saveBehavior(`Scroll Velocity (<30px/s): ${easedVelocity.toFixed(1)} px/s`);
          triggerEnlargeMode();

          window.scrollBehaviorSaved = true;
          setTimeout(() => (window.scrollBehaviorSaved = false), 4000);
        }
      }, 2000);
    }
  };

  lastScrollY.current = window.scrollY;
  lastTime.current = Date.now();

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, [scrollVelocity, triggerEnlargeMode, saveBehavior]);

   // --- HOVER HANDLERS (REVISED — triggers focus mode ONLY after 3s) ---
const handleMouseEnter = useCallback(
  (id) => {
    hoverStartTime.current = Date.now();

    // Live hover timer updates
    const hoverInterval = setInterval(() => {
      const elapsed = ((Date.now() - hoverStartTime.current) / 1000).toFixed(1);
      setHoverDuration(elapsed);
    }, 100);
    window.hoverInterval = hoverInterval;

    // Delay check for focus mode (3 seconds)
    window.focusCheckTimeout = setTimeout(() => {
      if (!hoverStartTime.current) return; // user already left
      const elapsed = (Date.now() - hoverStartTime.current) / 1000;

      if (elapsed >= 3) {
        // Trigger focus mode only if hovered >=3s
        setFocusMode(true);
        setFocusedChatIds((prev) =>
          prev.includes(id) ? prev : [...prev, id]
        );
        setAction("Focus View");

        // Auto-reset after 10s
        clearTimeout(window.focusTimeout);
        window.focusTimeout = setTimeout(() => {
          setFocusMode(false);
          setFocusedChatIds([]);
          if (!clickModeActive) setAction("Normal Layout");
        }, 10000);
      }
    }, 3000);
  },
  [clickModeActive]
);

const handleMouseLeave = useCallback(() => {
  clearInterval(window.hoverInterval);
  clearTimeout(window.focusCheckTimeout);

  if (hoverStartTime.current) {
    const elapsed = (Date.now() - hoverStartTime.current) / 1000;
    const finalDuration = parseFloat(elapsed.toFixed(1));
    setHoverDuration(finalDuration);

    // Always save hover duration — even <3s
    saveBehavior("Hovering over classes");

    // Behavior adaptation ONLY if hover >= 3 sec
    if (finalDuration >= 3) {
      setAction("Hovering over classes");
    }

    console.log("Hover duration:", finalDuration, "seconds");
  }

  hoverStartTime.current = null;
}, [saveBehavior]);

  // --- CLICK ERROR MODE ---
  const triggerClickErrorMode = useCallback(
    (rate) => {
      const container = document.querySelector(`.${containerClass}`);
      if (!container) return;

      setClickModeActive(true);
      setAction("Click Error Mode");
      saveBehavior("Click Error Mode", `${rate.toFixed(1)}%`);
      container?.classList.add("click-error-enlarged");

      clearTimeout(clickModeTimeoutRef.current);
      clickModeTimeoutRef.current = setTimeout(() => {
        setClickModeActive(false);
        container.classList.remove("click-error-enlarged");
        totalClicksRef.current = 0;
        errorClicksRef.current = 0;
        setClickErrorRate(0);
        setAction("Normal Layout");
      }, 10000);
    },
    [containerClass, saveBehavior]
  );

  // --- DIM BACKGROUND ---
  useEffect(() => {
    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (isDimmed) {
          document.body.classList.remove("dim-background");
          setIsDimmed(false);
          setAction("UI Restored (User Idle)");
          saveBehavior("Action", "UI Restored (User Idle)");
        }
      }, 10000);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (!activeStartTimeRef.current) activeStartTimeRef.current = now;

      const elapsed = (now - activeStartTimeRef.current) / 1000;
      if (elapsed >= 3000 && !isDimmed) {
        document.body.classList.add("dim-background");
        setIsDimmed(true);
        setAction("UI Dimmed");
        saveBehavior("UI Dimmed");
      }
      resetIdleTimer();
    };

    const handleIdleReset = () => {
      activeStartTimeRef.current = null;
    };

    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("blur", handleIdleReset);

    return () => {
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("blur", handleIdleReset);
      clearTimeout(idleTimerRef.current);
    };
  }, [isDimmed, saveBehavior]);

  // --- CLICK TRACKING ---
  useEffect(() => {
    const handleClick = (e) => {
      totalClicksRef.current += 1;
      const insideContainer = !!e.target.closest(`.${containerClass}`);
      if (!insideContainer) errorClicksRef.current += 1;

      const rawRate = (errorClicksRef.current / totalClicksRef.current) * 100;
      const maxRate = 20;
      const smoothingFactor = 0.1;
      const easedRate =
        rawRate > maxRate
          ? clickErrorRate + (maxRate - clickErrorRate) * smoothingFactor
          : rawRate;

      setClickErrorRate(easedRate);
      if (easedRate >= 16 && !clickModeActive) triggerClickErrorMode(easedRate);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickErrorRate, clickModeActive, triggerClickErrorMode, containerClass]);

  return {
    scrollVelocity,
    hoverDuration,
    clickErrorRate,
    action,
    handleMouseEnter,
    handleMouseLeave,
    clickModeActive,
    focusMode,
    focusedChatIds,
  };
}
