/**
 * Client-side PowerPoint builder from the shared SOP slide deck.
 */
import PptxGenJS from "pptxgenjs";
import {
  SOP_PPTX_FILENAME,
  SOP_PRESENTATION_TITLE,
  SOP_SLIDES,
  type SopSlide,
} from "./sop-presentation-slides";
import { buildSlideNarration } from "./sop-narration";

const NAVY = "203C62";
const SKY = "70BCFC";
const INK = "0F172A";
const MUTED = "475569";
const STAGE = "F1F5F9";
const WHITE = "FFFFFF";

const LOGO_LIGHT = "/Ace_logo_small_light.png";
const LOGO_DARK = "/Ace_logo_small.png";

async function imageToDataUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

type LogoPair = { light: string | null; dark: string | null };
type PptxSlide = ReturnType<PptxGenJS["addSlide"]>;

function stampLogo(_pptx: PptxGenJS, s: PptxSlide, logos: LogoPair, onDark: boolean) {
  const data = onDark ? logos.light : logos.dark;
  if (data) {
    s.addImage({
      data,
      x: 0.28,
      y: 0.12,
      w: 0.32,
      h: 0.32,
    });
  }
  s.addText("Presented by Aceolution", {
    x: 0.68,
    y: 0.14,
    w: 3.2,
    h: 0.28,
    fontSize: 9,
    bold: true,
    color: onDark ? SKY : MUTED,
  });
}

function addNotes(s: PptxSlide, slide: SopSlide, slideNumber: number, total: number) {
  const script = buildSlideNarration(slide, slideNumber, total);
  if (typeof s.addNotes === "function") {
    s.addNotes(script);
  }
}

function addTitleSlide(
  pptx: PptxGenJS,
  slide: SopSlide,
  logos: LogoPair,
  slideNumber: number,
  total: number
) {
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: NAVY },
  });
  stampLogo(pptx, s, logos, true);
  s.addText("ACEOLUTION FINANCE", {
    x: 0.6,
    y: 1.6,
    w: 8.8,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: SKY,
    align: "center",
    charSpacing: 4,
  });
  s.addText(slide.title, {
    x: 0.6,
    y: 2.15,
    w: 8.8,
    h: 0.9,
    fontSize: 36,
    bold: true,
    color: WHITE,
    align: "center",
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.8,
      y: 3.1,
      w: 8.4,
      h: 0.45,
      fontSize: 16,
      color: "BFDBFE",
      align: "center",
    });
  }
  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map((b) => ({ text: b, options: { breakLine: true } })),
      {
        x: 1.2,
        y: 3.7,
        w: 7.6,
        h: 1.4,
        fontSize: 15,
        color: "E2E8F0",
        align: "center",
      }
    );
  }
  addNotes(s, slide, slideNumber, total);
}

function addSectionSlide(
  pptx: PptxGenJS,
  slide: SopSlide,
  logos: LogoPair,
  slideNumber: number,
  total: number
) {
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: "1E3A5F" },
  });
  stampLogo(pptx, s, logos, true);
  s.addText(slide.title, {
    x: 0.7,
    y: 2.2,
    w: 8.6,
    h: 1,
    fontSize: 32,
    bold: true,
    color: WHITE,
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.7,
      y: 3.3,
      w: 8.6,
      h: 0.6,
      fontSize: 16,
      color: "BFDBFE",
    });
  }
  addNotes(s, slide, slideNumber, total);
}

function addAgendaOrTextSlide(
  pptx: PptxGenJS,
  slide: SopSlide,
  logos: LogoPair,
  slideNumber: number,
  total: number
) {
  const s = pptx.addSlide();
  s.background = { color: STAGE };
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.55,
    fill: { color: NAVY },
  });
  stampLogo(pptx, s, logos, true);
  s.addText(SOP_PRESENTATION_TITLE, {
    x: 4.0,
    y: 0.12,
    w: 5.6,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: SKY,
    align: "right",
  });
  s.addText(slide.title, {
    x: 0.5,
    y: 0.85,
    w: 9,
    h: 0.55,
    fontSize: 26,
    bold: true,
    color: INK,
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.5,
      y: 1.4,
      w: 9,
      h: 0.35,
      fontSize: 14,
      color: MUTED,
    });
  }
  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map((b) => ({
        text: b,
        options: { bullet: true, breakLine: true },
      })),
      {
        x: 0.6,
        y: slide.subtitle ? 1.9 : 1.6,
        w: 8.8,
        h: 3.4,
        fontSize: 16,
        color: INK,
        paraSpaceAfter: 8,
      }
    );
  }
  addNotes(s, slide, slideNumber, total);
}

async function addContentSlide(
  pptx: PptxGenJS,
  slide: SopSlide,
  imageCache: Map<string, string | null>,
  logos: LogoPair,
  slideNumber: number,
  total: number
) {
  const s = pptx.addSlide();
  s.background = { color: STAGE };
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.55,
    fill: { color: NAVY },
  });
  stampLogo(pptx, s, logos, true);
  s.addText(SOP_PRESENTATION_TITLE, {
    x: 4.0,
    y: 0.12,
    w: 5.6,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: SKY,
    align: "right",
  });

  const hasImage = Boolean(slide.image);
  s.addText(slide.title, {
    x: 0.4,
    y: 0.75,
    w: hasImage ? 3.6 : 9.2,
    h: 0.5,
    fontSize: hasImage ? 18 : 24,
    bold: true,
    color: INK,
  });

  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map((b) => ({
        text: b,
        options: { bullet: true, breakLine: true },
      })),
      {
        x: 0.4,
        y: 1.35,
        w: hasImage ? 3.6 : 9.2,
        h: hasImage ? 3.8 : 3.6,
        fontSize: hasImage ? 13 : 16,
        color: INK,
        paraSpaceAfter: 6,
      }
    );
  }

  if (slide.image) {
    let data = imageCache.get(slide.image);
    if (data === undefined) {
      data = await imageToDataUrl(slide.image);
      imageCache.set(slide.image, data);
    }
    if (data) {
      s.addImage({
        data,
        x: 4.2,
        y: 0.75,
        w: 5.4,
        h: 4.3,
        sizing: { type: "contain", w: 5.4, h: 4.3 },
      });
    }
  }
  addNotes(s, slide, slideNumber, total);
}

export async function downloadSopPptx(): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LAYOUT_WIDE", width: 10, height: 5.625 });
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Aceolution Finance";
  pptx.title = SOP_PRESENTATION_TITLE;
  pptx.subject = "Full App SOP presentation — Presented by Aceolution";

  const imageCache = new Map<string, string | null>();
  const logos: LogoPair = {
    light: await imageToDataUrl(LOGO_LIGHT),
    dark: await imageToDataUrl(LOGO_DARK),
  };
  const total = SOP_SLIDES.length;

  for (let i = 0; i < SOP_SLIDES.length; i++) {
    const slide = SOP_SLIDES[i];
    const n = i + 1;
    if (slide.kind === "title") {
      addTitleSlide(pptx, slide, logos, n, total);
    } else if (slide.kind === "section") {
      addSectionSlide(pptx, slide, logos, n, total);
    } else if (slide.kind === "agenda") {
      addAgendaOrTextSlide(pptx, slide, logos, n, total);
    } else {
      await addContentSlide(pptx, slide, imageCache, logos, n, total);
    }
  }

  await pptx.writeFile({ fileName: SOP_PPTX_FILENAME });
}
