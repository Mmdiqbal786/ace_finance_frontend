import type { SopSlide } from "./sop-presentation-slides";

/** Build a spoken script that explains the slide (used by browser TTS + PPTX notes). */
export function buildSlideNarration(slide: SopSlide, slideNumber: number, total: number): string {
  if (slide.notes?.trim()) {
    return cleanSpeak(slide.notes.trim());
  }

  const parts: string[] = [];

  if (slide.kind === "title") {
    parts.push(
      `Welcome to the Aceolution Finance full application SOP. This is slide ${slideNumber} of ${total}.`
    );
    if (slide.subtitle) parts.push(slide.subtitle.replace(/·/g, "."));
    if (slide.bullets?.length) {
      parts.push("In this presentation we cover the following.");
      parts.push(...slide.bullets.map((b) => b.replace(/·/g, ",")));
    }
    parts.push("Presented by Aceolution.");
    return cleanSpeak(parts.join(" "));
  }

  if (slide.kind === "section") {
    parts.push(`Next section. ${slide.title}.`);
    if (slide.subtitle) parts.push(slide.subtitle);
    parts.push("Let's walk through the details in the following slides.");
    return cleanSpeak(parts.join(" "));
  }

  if (slide.kind === "agenda") {
    parts.push(`Here is the agenda for this SOP. ${slide.title}.`);
    if (slide.bullets?.length) {
      parts.push("We will cover these topics in order.");
      slide.bullets.forEach((b, i) => {
        parts.push(`Item ${i + 1}. ${b}`);
      });
    }
    return cleanSpeak(parts.join(" "));
  }

  parts.push(`Slide ${slideNumber}. ${slide.title}.`);
  if (slide.subtitle) parts.push(slide.subtitle);
  if (slide.image) {
    parts.push("This slide shows a real screenshot from the Aceolution Finance application.");
  }
  if (slide.bullets?.length) {
    parts.push("Key points:");
    slide.bullets.forEach((b, i) => {
      parts.push(`${i + 1}. ${b}`);
    });
  }
  return cleanSpeak(parts.join(" "));
}

function cleanSpeak(text: string): string {
  return text
    .replace(/&amp;/g, "and")
    .replace(/&lt;/g, "less than")
    .replace(/&gt;/g, "greater than")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stopSopSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function speakSopNarration(
  text: string,
  opts?: { rate?: number; onEnd?: () => void; onError?: () => void }
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return false;
  }
  stopSopSpeech();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts?.rate ?? 1;
  u.pitch = 1;
  u.lang = "en-US";

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /en(-|_)US/i.test(v.lang) && /female|samantha|google|natural|aria|jenny/i.test(v.name)) ||
    voices.find((v) => /en(-|_)GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));
  if (preferred) u.voice = preferred;

  u.onend = () => opts?.onEnd?.();
  u.onerror = () => opts?.onError?.();
  window.speechSynthesis.speak(u);
  return true;
}
