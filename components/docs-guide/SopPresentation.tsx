"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SOP_PRESENTATION_TITLE,
  SOP_SLIDES,
  type SopSlide,
  type SopSlideKind,
} from "../../lib/sop-presentation-slides";
import {
  buildSlideNarration,
  speakSopNarration,
  stopSopSpeech,
} from "../../lib/sop-narration";
import { lockDemoGuideAccess } from "../../lib/demo-guide";
import "./sop-presentation.css";

const LOGO_LIGHT = "/Ace_logo_small_light.png";
const LOGO_DARK = "/Ace_logo_small.png";
const VOICE_KEY = "ace_sop_auto_voice";

const FX_FORWARD = ["slide-left", "fade-up", "zoom-in", "wipe-right", "flip-in", "scale-fade"] as const;
const FX_BACK = ["slide-right", "fade-down", "zoom-out", "wipe-left", "flip-out", "scale-fade"] as const;

type FxName = (typeof FX_FORWARD)[number] | (typeof FX_BACK)[number];

function pickFx(index: number, kind: SopSlideKind, dir: 1 | -1): FxName {
  if (kind === "title") return dir > 0 ? "zoom-in" : "zoom-out";
  if (kind === "section") return dir > 0 ? "wipe-right" : "wipe-left";
  if (kind === "agenda") return dir > 0 ? "fade-up" : "fade-down";
  const list = dir > 0 ? FX_FORWARD : FX_BACK;
  return list[index % list.length];
}

const SECTION_JUMPS = SOP_SLIDES.map((s, i) => ({ slide: s, index: i })).filter(
  ({ slide }) => slide.kind === "section" || slide.kind === "agenda" || slide.id === "title"
);

function SlideLogo({ onDark }: { onDark?: boolean }) {
  return (
    <div className={`sop-slide__logo ${onDark ? "sop-slide__logo--on-dark" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={onDark ? LOGO_LIGHT : LOGO_DARK} alt="Aceolution" width={36} height={36} />
      <div className="sop-slide__logo-text">
        <span className="sop-slide__logo-brand">Aceolution</span>
        <span className="sop-slide__logo-by">Presented by Aceolution</span>
      </div>
    </div>
  );
}

function SlideBody({ slide }: { slide: SopSlide }) {
  if (slide.kind === "title") {
    return (
      <div className="sop-slide sop-slide--title">
        <SlideLogo onDark />
        <div className="sop-slide__brand">Aceolution Finance</div>
        <h1 className="sop-slide__hero">{slide.title}</h1>
        {slide.subtitle ? <p className="sop-slide__sub">{slide.subtitle}</p> : null}
        {slide.bullets?.length ? (
          <ul className="sop-slide__bullets sop-slide__bullets--center">
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (slide.kind === "agenda" || slide.kind === "section") {
    const onDark = slide.kind === "section";
    return (
      <div className={`sop-slide sop-slide--${slide.kind}`}>
        <SlideLogo onDark={onDark} />
        <h2 className="sop-slide__title">{slide.title}</h2>
        {slide.subtitle ? <p className="sop-slide__sub">{slide.subtitle}</p> : null}
        {slide.bullets?.length ? (
          <ul className="sop-slide__bullets">
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const hasImage = Boolean(slide.image);
  return (
    <div className={`sop-slide sop-slide--content ${hasImage ? "sop-slide--with-image" : ""}`}>
      <SlideLogo />
      <div className="sop-slide__text">
        <h2 className="sop-slide__title">{slide.title}</h2>
        {slide.subtitle ? <p className="sop-slide__sub">{slide.subtitle}</p> : null}
        {slide.bullets?.length ? (
          <ul className="sop-slide__bullets">
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
      {slide.image ? (
        <div className="sop-slide__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt={slide.title} />
        </div>
      ) : null}
    </div>
  );
}

export default function SopPresentation() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [fx, setFx] = useState<FxName>("zoom-in");
  const [animKey, setAnimKey] = useState(0);
  const [autoVoice, setAutoVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const autoVoiceRef = useRef(false);
  const total = SOP_SLIDES.length;
  const slide = SOP_SLIDES[index];
  const sectionOptions = useMemo(() => SECTION_JUMPS, []);
  const narration = useMemo(
    () => buildSlideNarration(slide, index + 1, total),
    [slide, index, total]
  );

  useEffect(() => {
    autoVoiceRef.current = autoVoice;
  }, [autoVoice]);

  useEffect(() => {
    try {
      setAutoVoice(sessionStorage.getItem(VOICE_KEY) === "1");
    } catch {
      // ignore
    }
    const warm = () => {
      try {
        window.speechSynthesis?.getVoices();
      } catch {
        // ignore
      }
    };
    warm();
    window.speechSynthesis?.addEventListener?.("voiceschanged", warm);
    return () => {
      stopSopSpeech();
      window.speechSynthesis?.removeEventListener?.("voiceschanged", warm);
    };
  }, []);

  const speakCurrent = useCallback(() => {
    const script = buildSlideNarration(SOP_SLIDES[index], index + 1, total);
    const ok = speakSopNarration(script, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    setSpeaking(ok);
    return ok;
  }, [index, total]);

  const stopVoice = useCallback(() => {
    stopSopSpeech();
    setSpeaking(false);
  }, []);

  const toggleAutoVoice = useCallback(() => {
    setAutoVoice((on) => {
      const next = !on;
      try {
        sessionStorage.setItem(VOICE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      if (!next) {
        stopSopSpeech();
        setSpeaking(false);
      }
      return next;
    });
  }, []);

  const goTo = useCallback(
    (next: number, dirHint?: 1 | -1) => {
      const clamped = Math.min(total - 1, Math.max(0, next));
      if (clamped === index) return;
      const dir: 1 | -1 = dirHint ?? (clamped > index ? 1 : -1);
      const target = SOP_SLIDES[clamped];
      stopSopSpeech();
      setSpeaking(false);
      setFx(pickFx(clamped, target.kind, dir));
      setAnimKey((k) => k + 1);
      setIndex(clamped);
    },
    [index, total]
  );

  const go = useCallback(
    (delta: number) => {
      goTo(index + delta, delta >= 0 ? 1 : -1);
    },
    [goTo, index]
  );

  useEffect(() => {
    if (!autoVoice) return;
    const t = window.setTimeout(() => {
      if (!autoVoiceRef.current) return;
      const script = buildSlideNarration(SOP_SLIDES[index], index + 1, total);
      const ok = speakSopNarration(script, {
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
      setSpeaking(ok);
    }, 450);
    return () => window.clearTimeout(t);
  }, [index, autoVoice, total, animKey]);

  const exit = useCallback(() => {
    stopSopSpeech();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    router.push("/docs-guide/");
  }, [router]);

  const exitAccess = useCallback(() => {
    stopSopSpeech();
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    lockDemoGuideAccess();
    window.location.assign("/demo-guide/");
  }, []);

  const toggleFullscreen = useCallback(() => {
    const root = document.documentElement;
    if (!document.fullscreenElement) {
      void root.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0, -1);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(total - 1, 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        exit();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        toggleAutoVoice();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        speakCurrent();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        stopVoice();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, go, goTo, speakCurrent, stopVoice, toggleAutoVoice, toggleFullscreen, total]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (Math.abs(dx) < 56) return;
    if (dx < 0) go(1);
    else go(-1);
  }

  return (
    <div className="sop-present">
      <header className="sop-present__bar">
        <div className="sop-present__bar-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sop-present__bar-logo"
            src={LOGO_LIGHT}
            alt="Aceolution"
            width={28}
            height={28}
          />
          <span className="sop-present__product">{SOP_PRESENTATION_TITLE}</span>
          <span className="sop-present__counter">
            {index + 1} / {total}
          </span>
          {speaking ? <span className="sop-present__speaking">Speaking…</span> : null}
        </div>
        <div className="sop-present__bar-actions">
          <label className="sop-present__jump">
            <span className="sr-only">Jump to section</span>
            <select
              value={sectionOptions.reduce((best, cur) => (cur.index <= index ? cur.index : best), 0)}
              onChange={(e) => {
                const next = Number(e.target.value);
                goTo(next, next >= index ? 1 : -1);
              }}
              aria-label="Jump to section"
            >
              {sectionOptions.map(({ slide: s, index: i }) => (
                <option key={s.id} value={i}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`sop-present__btn ${autoVoice ? "sop-present__btn--voice-on" : "sop-present__btn--voice"}`}
            onClick={toggleAutoVoice}
            title="Auto AI voice on each slide (V)"
          >
            {autoVoice ? "Voice ON" : "Voice OFF"}
          </button>
          <button
            type="button"
            className="sop-present__btn sop-present__btn--voice"
            onClick={() => speakCurrent()}
            title="Speak this slide (S)"
          >
            Speak
          </button>
          <button
            type="button"
            className="sop-present__btn sop-present__btn--ghost"
            onClick={stopVoice}
            disabled={!speaking}
            title="Stop voice (M)"
          >
            Stop
          </button>
          <button type="button" className="sop-present__btn" onClick={() => go(-1)} disabled={index === 0}>
            Prev
          </button>
          <button
            type="button"
            className="sop-present__btn"
            onClick={() => go(1)}
            disabled={index >= total - 1}
          >
            Next
          </button>
          <button type="button" className="sop-present__btn" onClick={toggleFullscreen}>
            Fullscreen
          </button>
          <button type="button" className="sop-present__btn sop-present__btn--ghost" onClick={exit}>
            Exit
          </button>
          <button
            type="button"
            className="sop-present__btn sop-present__btn--ghost"
            onClick={exitAccess}
            title="Lock guide access and return to the password screen"
          >
            Exit access
          </button>
        </div>
      </header>

      <main
        className="sop-present__stage"
        aria-live="polite"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div key={animKey} className={`sop-present__anim sop-fx-${fx}`}>
          <SlideBody slide={slide} />
        </div>
      </main>

      <footer className="sop-present__hint">
        ← → / swipe · V auto voice · S speak · M stop · F fullscreen · Esc exit
        {autoVoice || speaking ? (
          <span className="sop-present__script" title={narration}>
            {" "}
            · Narrating slide details
          </span>
        ) : null}
      </footer>
    </div>
  );
}
