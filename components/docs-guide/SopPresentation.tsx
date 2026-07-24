"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SOP_PRESENTATION_TITLE,
  SOP_SLIDES,
  type SopSlide,
  type SopSlideKind,
} from "../../lib/sop-presentation-slides";
import "./sop-presentation.css";

const LOGO_LIGHT = "/Ace_logo_small_light.png";
const LOGO_DARK = "/Ace_logo_small.png";

/** Screen-change effects — rotated by slide + direction so each change feels different. */
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
  const touchStartX = useRef<number | null>(null);
  const total = SOP_SLIDES.length;
  const slide = SOP_SLIDES[index];
  const sectionOptions = useMemo(() => SECTION_JUMPS, []);

  const goTo = useCallback(
    (next: number, dirHint?: 1 | -1) => {
      const clamped = Math.min(total - 1, Math.max(0, next));
      if (clamped === index) return;
      const dir: 1 | -1 = dirHint ?? (clamped > index ? 1 : -1);
      const target = SOP_SLIDES[clamped];
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

  const exit = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    router.push("/docs-guide/");
  }, [router]);

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
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, go, goTo, toggleFullscreen, total]);

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
        </div>
      </header>

      <main
        className="sop-present__stage"
        aria-live="polite"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={animKey}
          className={`sop-present__anim sop-fx-${fx}`}
        >
          <SlideBody slide={slide} />
        </div>
      </main>

      <footer className="sop-present__hint">
        ← → / swipe · Space · F fullscreen · Esc exit
      </footer>
    </div>
  );
}
