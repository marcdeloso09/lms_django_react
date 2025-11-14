import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Communities.css";

export default function Communities({ containerClass = "class-grid-container" }) {
  const navigate = useNavigate();

  // --- States ---
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [hoverDuration, setHoverDuration] = useState(0);
  const [action, setAction] = useState("Normal Layout");
  const [focusMode, setFocusMode] = useState(false);
  const [focusedClassIds, setFocusedClassIds] = useState([]);
  const [clickErrorRate, setClickErrorRate] = useState(0);
  const [clickModeActive, setClickModeActive] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);

  // --- Refs ---
  const lastScrollY = useRef(window.scrollY);
  const lastTime = useRef(Date.now());
  const hoverStartTime = useRef(null);
  const enlargeTimeoutRef = useRef(null);
  const clickModeTimeoutRef = useRef(null);
  const totalClicksRef = useRef(0);
  const errorClicksRef = useRef(0);
  const idleTimerRef = useRef(null);
  const activeStartTimeRef = useRef(null);

  // --- Class Data ---
  const classes = [
    { id: 1, title: "Mathematics", teacher: "Prof." },
    { id: 2, title: "Biology", teacher: "Dr." },
    { id: 3, title: "History", teacher: "Mr." },
    { id: 4, title: "Chemistry", teacher: "Ms." },
    { id: 5, title: "Programming", teacher: "Engr." },
    { id: 6, title: "Physics", teacher: "Dr." },
    { id: 7, title: "Statistics", teacher: "Prof." },
  ];

  // --- Save Behavior Log ---
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
      if (!clickModeActive && !focusMode) setAction("Normal Layout");
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

    // --- HARD CAP at 100 px/s ---
    rawVelocity = Math.min(rawVelocity, 100);

    // --- SLOWER SMOOTHING ---
    const maxVelocity = 50;
    const smoothingFactor = 0.05;

    const easedVelocity =
      rawVelocity > maxVelocity
        ? scrollVelocity + (maxVelocity - scrollVelocity) * smoothingFactor
        : scrollVelocity + (rawVelocity - scrollVelocity) * smoothingFactor;

    setScrollVelocity(easedVelocity);

    lastScrollY.current = currentY;
    lastTime.current = currentTime;

    // --- Reset per scroll burst ---
    clearTimeout(window.scrollResetTimeout);
    window.scrollResetTimeout = setTimeout(() => {
      setScrollVelocity(0);
    }, 2000);

    // --- Cancel pending slow scroll trigger when velocity rises ---
    if (easedVelocity >= 30) {
      clearTimeout(window.slowScrollTimeout);
      return;
    }

    // --- SLOW (<30px/s) scroll logic ---
    if (easedVelocity > 0 && easedVelocity < 30) {
      clearTimeout(window.slowScrollTimeout);

      window.slowScrollTimeout = setTimeout(async () => {
        // FINAL CHECK
        if (scrollVelocity >= 30) return;

        setAction("Slow Scroll Detected");

        // Save only once per trigger period
        if (!window.scrollBehaviorSaved) {
          await saveBehavior(
            "Scroll Velocity (<30px/s)",
            `${easedVelocity.toFixed(1)} px/s`
          );

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

  // --- HOVER HANDLERS ---
  const handleMouseEnter = useCallback(
    (id) => {
      hoverStartTime.current = Date.now();

      clearInterval(window.hoverInterval);
      window.hoverInterval = setInterval(() => {
        const elapsed = ((Date.now() - hoverStartTime.current) / 1000).toFixed(1);
        setHoverDuration(elapsed);
      }, 100);

      setTimeout(() => {
        saveBehavior();
        setFocusMode(true);
        setFocusedClassIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        setAction("Focus View");

        clearTimeout(window.focusTimeout);
        window.focusTimeout = setTimeout(() => {
          setFocusMode(false);
          setFocusedClassIds([]);
          if (!clickModeActive) setAction("Normal Layout");
        }, 10000);
      }, 3000);
    },
    [clickModeActive, saveBehavior]
  );

  const handleMouseLeave = useCallback(() => {
  clearInterval(window.hoverInterval);

  if (hoverStartTime.current) {
    const elapsed = (Date.now() - hoverStartTime.current) / 1000;
    setHoverDuration(elapsed.toFixed(1));  // update state
    console.log("🕒 Actual hover duration:", elapsed.toFixed(1), "seconds");

    if (elapsed >= 1) {
      setAction("Hovering over classes");
      saveBehavior("Hovering over classes");  // now uses updated hoverDuration
    }
  }

  hoverStartTime.current = null;
}, [saveBehavior]);;

  // --- CLICK ERROR MODE ---
  const triggerClickErrorMode = useCallback(
    (rate) => {
      const container = document.querySelector(`.${containerClass}`);
      if (!container) return;

      setClickModeActive(true);
      setAction("Click Error Mode");
      saveBehavior("Click Error Mode");
      container.classList.add("click-error-enlarged");

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
          saveBehavior("UI Restored (User Idle)");
        }
      }, 10000);
    };

    const handleActivity = () => {
      const now = Date.now();
      if (!activeStartTimeRef.current) {
        activeStartTimeRef.current = now;
      }
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
      if (easedRate >= 15 && !clickModeActive)
        triggerClickErrorMode(easedRate);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickErrorRate, clickModeActive, triggerClickErrorMode, containerClass]);

  // --- CLEANUP ---
  useEffect(() => {
    const enlargeSnapshot = enlargeTimeoutRef.current;
    const clickSnapshot = clickModeTimeoutRef.current;
    return () => {
      clearTimeout(enlargeSnapshot);
      clearTimeout(clickSnapshot);
      clearInterval(window.hoverInterval);
      clearTimeout(window.focusTimeout);
    };
  }, []);

  // --- NAVIGATION HANDLER ---
  const handleViewClick = (cls) =>
    navigate("/msteams/communities/activity", { state: { cls } });

  // --- UI ---
  return (
    <>
      {clickModeActive && <div className="click-error-overlay" />}

      <div className={`${containerClass} ${focusMode ? "focus-active" : ""}`}>
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`class-card ${
              focusMode && !focusedClassIds.includes(cls.id) ? "hidden-card" : ""
            }`}
            onMouseEnter={() => handleMouseEnter(cls.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="class-card-header"></div>
            <div className="class-card-body">
              <p className="class-title">
                Title: <span>{cls.title}</span>
              </p>
              <p className="class-teacher">
                Teacher: <span>{cls.teacher}</span>
              </p>
              <button className="class-view" onClick={() => handleViewClick(cls)}>
                view
              </button>
            </div>
          </div>
        ))}

        {focusMode && <div className="focus-popup">👁 Focus Mode Enabled</div>}

        <div className="tracking-panel">
          <p>
            <strong>Scroll Speed:</strong> {scrollVelocity.toFixed(1)} px/s
          </p>
          <p>
            <strong>Hover Duration:</strong> {hoverDuration > 0 ? `${hoverDuration}s` : "0s"}
          </p>
          <p>
            <strong>Click Error Rate:</strong> {clickErrorRate.toFixed(1)}%
          </p>
          <p>
            <strong>Action:</strong> {action}
          </p>
        </div>
      </div>
    </>
  );
}
