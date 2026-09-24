"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Read-aloud via the browser's built-in speech synthesis (macOS voices in Safari/Chrome), plus voice input. */
export function useSpeech() {
  const [autoRead, setAutoRead] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({ tts: false, stt: false });
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // Detect browser support after mount (these APIs do not exist during server rendering).
    const detect = () => {
      const tts = "speechSynthesis" in window;
      const w = window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown };
      const stt = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
      setSupported({ tts, stt });
      try {
        setAutoRead(localStorage.getItem("chem_autoread") === "1");
      } catch {}
      if (tts) window.speechSynthesis.getVoices(); // warm the voice list
    };
    const t = setTimeout(detect, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleAutoRead = useCallback(() => {
    setAutoRead((v) => {
      try {
        localStorage.setItem("chem_autoread", v ? "0" : "1");
      } catch {}
      if (v) window.speechSynthesis?.cancel();
      return !v;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
    const voices = window.speechSynthesis.getVoices();
    const pick =
      voices.find((v) => /Samantha|Ava|Allison|Zoe/.test(v.name) && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang === "en-US" && v.localService) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (pick) u.voice = pick;
    u.rate = 1.0;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const listen = useCallback((onResult: (text: string) => void) => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (recRef.current) {
      recRef.current.stop();
      recRef.current = null;
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      onResult(normalizeSpoken(t));
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  return { autoRead, toggleAutoRead, speak, stop, speaking, listen, listening, supported };
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/** Make chemistry text read better aloud. */
function cleanForSpeech(t: string) {
  return t
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/\^(-?\d+)/g, " to the power of $1 ")
    .replace(/\be(-?\d+)\b/g, " times ten to the $1 ")
    .replace(/([A-Za-z])₂/g, "$1 two")
    .replace(/([A-Za-z])₃/g, "$1 three")
    .replace(/([A-Za-z])₄/g, "$1 four")
    .replace(/([A-Za-z])₈/g, "$1 eight")
    .replace(/\bcm³|cm\^3\b/g, "cubic centimeters")
    .replace(/\bm³|m\^3\b/g, "cubic meters")
    .replace(/\bg\/cm3\b/g, "grams per cubic centimeter")
    .replace(/\bmL\b/g, "milliliters")
    .replace(/\bkm\/h\b/g, "kilometers per hour")
    .replace(/\bm\/s\b/g, "meters per second")
    .replace(/°C/g, " degrees Celsius")
    .replace(/°F/g, " degrees Fahrenheit")
    .replace(/\bK\b/g, " Kelvin");
}

/** Turn "three point five times ten to the negative four" style dictation into something the grader can parse. */
function normalizeSpoken(t: string) {
  return t
    .toLowerCase()
    .replace(/\bnegative\b/g, "-")
    .replace(/\bminus\b/g, "-")
    .replace(/\btimes ten to the (?:power of )?(-?\s?\d+)/g, (_, e) => "e" + e.replace(/\s/g, ""))
    .replace(/\bpoint\b/g, ".")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s+e\s*/g, "e")
    .trim();
}
