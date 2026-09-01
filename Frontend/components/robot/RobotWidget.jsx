"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ROBOT_EVENTS } from "@/lib/robot";
const SOUND_PREF_KEY = "codex_robot_sound_enabled";
const IDLE_LOOK_AROUND_MS = 20000;
const APPROACH_RADIUS = 260;
const BUBBLE_DURATION_MS = 3600;
const MOOD_REVERT_MS = 4000;
function playTone(audioContext, type = "click") {
  try {
    if (!audioContext) return;
    const tones = {
      click: { notes: [660, 880], wave: "sine", duration: 0.1 },
      error: { notes: [180, 120], wave: "sawtooth", duration: 0.16 },
      galactic: { notes: [220, 330, 494], wave: "triangle", duration: 0.24 },
    };
    const sound = tones[type] || tones.click;
    const notes = sound.notes;
    notes.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = sound.wave;
      osc.frequency.value = freq;
      const start =
        audioContext.currentTime + i * (sound.duration / notes.length);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        type === "galactic" ? 0.025 : 0.05,
        start + 0.01,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + sound.duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + sound.duration);
    });
  } catch {}
}
export default function RobotWidget() {
  const rootRef = useRef(null);
  const [mood, setMood] = useState("idle");
  const [blinking, setBlinking] = useState(false);
  const [lookingAround, setLookingAround] = useState(false);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [bounce, setBounce] = useState(false);
  const [scrollPulse, setScrollPulse] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const bubbleTimerRef = useRef(null);
  const moodTimerRef = useRef(null);
  const scrollThrottleRef = useRef(0);
  const clickThrottleRef = useRef(0);
  const scrollYRef = useRef(0);
  const audioContextRef = useRef(null);
  const ambientTimerRef = useRef(null);
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  };
  const stopAmbientSound = () => {
    clearInterval(ambientTimerRef.current);
    ambientTimerRef.current = null;
  };
  const startAmbientSound = (enabled = soundEnabled) => {
    if (ambientTimerRef.current || !enabled) return;
    const audioContext = getAudioContext();
    if (!audioContext) return;
    audioContext.resume();
    playTone(audioContext, "galactic");
    ambientTimerRef.current = setInterval(
      () => playTone(audioContext, "galactic"),
      9000,
    );
  };
  useEffect(() => {
    const saved = window.localStorage.getItem(SOUND_PREF_KEY);
    if (saved !== null) setSoundEnabled(saved === "true");
  }, []);
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(SOUND_PREF_KEY, String(next));
      if (!next) stopAmbientSound();
      else startAmbientSound(next);
      return next;
    });
  };
  const say = useCallback(
    (message) => {
      if (bubble || !message) return;
      setBubble({ message });
      if (soundEnabled) {
        const audioContext = getAudioContext();
        audioContext?.resume();
        playTone(audioContext, "galactic");
        startAmbientSound();
      }
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(
        () => setBubble(null),
        BUBBLE_DURATION_MS,
      );
    },
    [bubble, soundEnabled],
  );
  const setMoodWithRevert = useCallback((next) => {
    setMood(next);
    clearTimeout(moodTimerRef.current);
    if (next !== "idle") {
      moodTimerRef.current = setTimeout(() => setMood("idle"), MOOD_REVERT_MS);
    }
  }, []);
  useEffect(() => {
    const onSay = (e) => say(e.detail?.message);
    const onMood = (e) => {
      const nextMood = e.detail?.mood || "idle";
      setMoodWithRevert(nextMood);
      if (nextMood === "error" && soundEnabled) {
        const audioContext = getAudioContext();
        audioContext?.resume();
        playTone(audioContext, "error");
        startAmbientSound();
      }
    };
    window.addEventListener(ROBOT_EVENTS.SAY_EVENT, onSay);
    window.addEventListener(ROBOT_EVENTS.MOOD_EVENT, onMood);
    return () => {
      window.removeEventListener(ROBOT_EVENTS.SAY_EVENT, onSay);
      window.removeEventListener(ROBOT_EVENTS.MOOD_EVENT, onMood);
    };
  }, [say, setMoodWithRevert, soundEnabled]);
  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const delay = 2800 + Math.random() * 3200;
      setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => !cancelled && setBlinking(false), 140);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      stopAmbientSound();
      audioContextRef.current?.close();
    };
  }, []);
  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (lookingAround) setLookingAround(false);
    };
    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_LOOK_AROUND_MS)
        setLookingAround(true);
    }, 3000);
    window.addEventListener("mousemove", markActive);
    window.addEventListener("keydown", markActive);
    window.addEventListener("scroll", markActive, { passive: true });
    window.addEventListener("click", markActive);
    return () => {
      clearInterval(checkIdle);
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("scroll", markActive);
      window.removeEventListener("click", markActive);
    };
  }, [lookingAround]);
  useEffect(() => {
    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const el = rootRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        const followStrength = 2.8;

        if (distance < APPROACH_RADIUS) {
          const angle = Math.atan2(dy, dx);
          const scale =
            (Math.min(distance, APPROACH_RADIUS) / APPROACH_RADIUS) * followStrength;
          setPupil({
            x: Math.cos(angle) * scale,
            y: Math.sin(angle) * scale,
          });
        } else {
          setPupil({ x: 0, y: 0 });
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      if (now - scrollThrottleRef.current < 700) return;
      scrollThrottleRef.current = now;
      setPupil({ x: 0, y: window.scrollY > scrollYRef.current ? 1.8 : -1.8 });
      scrollYRef.current = window.scrollY;
      setScrollPulse(true);
      setTimeout(() => setScrollPulse(false), 380);
    };
    scrollYRef.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onClick = () => {
      if (soundEnabled) {
        const audioContext = getAudioContext();
        audioContext?.resume();
        playTone(audioContext, "click");
        startAmbientSound();
      }
      const now = Date.now();
      if (now - clickThrottleRef.current < 250) return;
      clickThrottleRef.current = now;
      setBounce(true);
      setTimeout(() => setBounce(false), 260);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [soundEnabled]);
  const mouthPath =
    mood === "error"
      ? "M 10 25 Q 16 20 22 25"
      : mood === "happy"
        ? "M 10 22 Q 16 28 22 22"
        : "M 11 24 Q 16 26 21 24";
  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2"
      aria-hidden="true"
    >

      {bubble && (
        <div className="animate-robot-pop max-w-[190px] rounded-2xl rounded-br-sm border border-edge bg-surface px-3 py-2 text-xs text-fg shadow-glow">
          {bubble.message}
        </div>
      )}
      <div className="group flex items-center gap-1.5">

        <button
          type="button"
          onClick={toggleSound}
          aria-label={
            soundEnabled ? "Turn robot sounds off" : "Turn robot sounds on"
          }
          className="focus-ring grid h-6 w-6 place-items-center rounded-full border border-edge bg-surface text-muted opacity-0 transition hover:text-fg group-hover:opacity-100"
        >

          {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
        </button>
        <div
          className={`relative h-14 w-14 select-none transition-transform duration-200 ${bounce ? "scale-110" : "scale-100"} ${scrollPulse ? "animate-robot-bob" : ""} ${lookingAround ? "animate-robot-look-around" : ""}`}
        >

          <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-md">

            <line
              x1="16"
              y1="4"
              x2="16"
              y2="8"
              stroke="var(--azure-500)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="16"
              cy="3"
              r="1.6"
              fill="var(--azure-500)"
              className="animate-robot-pulse"
            />
            <rect
              x="4"
              y="8"
              width="24"
              height="20"
              rx="7"
              fill="var(--surface-2)"
              stroke="var(--edge)"
            />
            {[11, 21].map((eyeX) => (
              <g key={eyeX}>

                <circle
                  cx={eyeX}
                  cy="17"
                  r="4.4"
                  fill="var(--surface)"
                  stroke="var(--edge)"
                />
                <circle
                  cx={eyeX + pupil.x}
                  cy={17 + pupil.y}
                  r={blinking ? 0.3 : mood === "error" ? 1.6 : 2}
                  fill={mood === "error" ? "#f87171" : "var(--azure-500)"}
                  style={{
                    transition: "r 60ms ease-out, cx 70ms ease-out, cy 70ms ease-out",
                  }}
                />
              </g>
            ))}
            <path
              d={mouthPath}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.4"
              strokeLinecap="round"
              style={{ transition: "none" }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
