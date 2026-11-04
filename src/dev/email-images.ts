/**
 * Draws the verification email's images (see src/lib/verification-email.ts) with the site's own
 * fonts, at 3x for sharp phone screens. Not part of the app bundle. To regenerate after changing
 * the email copy: run `npm run dev`, open the site, run this in the browser console, and move the
 * downloaded files into public/email/.
 *
 *   (await import("/src/dev/email-images.ts")).downloadEmailImages()
 */
import {
  allEmailAssets,
  emailColors,
  emailLayout,
  type EmailAsset,
} from "@/lib/verification-email";

const SCALE = 3;

type TextStyle = {
  family: string;
  weight: number;
  size: number;
  lineHeight: number;
  color: string;
  letterSpacing?: number;
  uppercase?: boolean;
  align?: "left" | "center";
};

type Paragraph = { text: string; style: TextStyle; spaceBefore: number };

// Mirrors the site's auth dialog: gold tracked eyebrow, Syne title, muted body copy.
const jakarta = '"Plus Jakarta Sans"';
const styles = {
  eyebrow: {
    family: jakarta,
    weight: 400,
    size: 12,
    lineHeight: 18,
    color: emailColors.gold,
    letterSpacing: 2.4,
    uppercase: true,
  },
  title: { family: "Syne", weight: 800, size: 30, lineHeight: 34, color: emailColors.text },
  intro: { family: jakarta, weight: 400, size: 15, lineHeight: 24, color: emailColors.muted },
  label: {
    family: jakarta,
    weight: 600,
    size: 11,
    lineHeight: 16,
    color: emailColors.gold,
    letterSpacing: 2.2,
    uppercase: true,
    align: "center",
  },
  note: { family: jakarta, weight: 400, size: 14, lineHeight: 22, color: emailColors.muted },
  footer: {
    family: jakarta,
    weight: 400,
    size: 12,
    lineHeight: 20,
    color: emailColors.muted,
    align: "center",
  },
  footerLink: {
    family: jakarta,
    weight: 600,
    size: 12,
    lineHeight: 20,
    color: emailColors.gold,
    align: "center",
  },
  digit: { family: "Syne", weight: 800, size: 26, lineHeight: 56, color: emailColors.text },
} satisfies Record<string, TextStyle>;

const fontFor = (style: TextStyle) => `${style.weight} ${style.size * SCALE}px ${style.family}`;

function createCanvas(width: number, height: number, background: string) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * SCALE);
  canvas.height = Math.round(height * SCALE);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available.");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function applyStyle(context: CanvasRenderingContext2D, style: TextStyle) {
  context.font = fontFor(style);
  context.fillStyle = style.color;
  context.letterSpacing = `${(style.letterSpacing ?? 0) * SCALE}px`;
  context.textAlign = style.align ?? "left";
  context.textBaseline = "alphabetic";
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Lays out paragraphs like CSS block text: wrapped lines, half-leading above each baseline. */
function drawParagraphs(
  paragraphs: Paragraph[],
  {
    width,
    background,
    paddingTop = 0,
    divider = false,
  }: {
    width: number;
    background: string;
    paddingTop?: number;
    divider?: boolean;
  },
) {
  const measure = createCanvas(1, 1, background).context;
  const laidOut = paragraphs.map((paragraph) => {
    applyStyle(measure, paragraph.style);
    const text = paragraph.style.uppercase ? paragraph.text.toUpperCase() : paragraph.text;
    return { ...paragraph, lines: wrapText(measure, text, width * SCALE) };
  });
  const height =
    paddingTop +
    laidOut.reduce(
      (total, item) => total + item.spaceBefore + item.lines.length * item.style.lineHeight,
      0,
    );

  const { canvas, context } = createCanvas(width, height, background);
  if (divider) {
    context.fillStyle = emailColors.border;
    context.fillRect(0, 0, canvas.width, SCALE);
  }
  let top = paddingTop * SCALE;
  for (const item of laidOut) {
    top += item.spaceBefore * SCALE;
    applyStyle(context, item.style);
    const metrics = context.measureText("Hg");
    const ascent = metrics.fontBoundingBoxAscent;
    const contentHeight = ascent + metrics.fontBoundingBoxDescent;
    const x = item.style.align === "center" ? canvas.width / 2 : 0;
    for (const line of item.lines) {
      const lineHeight = item.style.lineHeight * SCALE;
      context.fillText(line, x, top + (lineHeight - contentHeight) / 2 + ascent);
      top += lineHeight;
    }
  }
  return canvas;
}

/** The header logo: "ca", gold "$", "hvibe" and the glowing star, spaced like the site header. */
function drawWordmark() {
  const { width, height } = emailLayout.wordmark;
  const { canvas, context } = createCanvas(width, height, emailColors.page);
  const fontSize = 24 * SCALE;
  const starSize = 14 * SCALE;
  const partGap = 4 * SCALE;
  const starGap = 8 * SCALE;
  const parts = [
    ["ca", emailColors.text],
    ["$", emailColors.gold],
    ["hvibe", emailColors.text],
  ] as const;
  context.font = `800 ${fontSize}px Syne`;
  const widths = parts.map(([text]) => context.measureText(text).width);
  const metrics = context.measureText("ca$hvibe");
  const textWidth = widths.reduce((sum, value) => sum + value, 0) + partGap * (parts.length - 1);
  const totalWidth = textWidth + starGap + starSize;
  const lineCenter = (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
  const left = (canvas.width - totalWidth) / 2;
  const baseline = canvas.height / 2 + lineCenter;

  const drawText = (glow: { blur: number; color: string } | null) => {
    let x = left;
    parts.forEach(([text, color], index) => {
      context.fillStyle = color;
      context.shadowColor = glow ? glow.color : "transparent";
      context.shadowBlur = glow ? glow.blur : 0;
      context.fillText(text, x, baseline);
      x += (widths[index] ?? 0) + partGap;
    });
  };
  drawText({ blur: 4 * SCALE, color: "rgba(210, 162, 59, 0.38)" });
  drawText({ blur: 10 * SCALE, color: "rgba(210, 162, 59, 0.12)" });
  drawText(null);

  // lucide's "star" icon, as used in the header.
  const star = new Path2D(
    "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  );
  const drawStar = (blur: number) => {
    context.save();
    context.translate(left + textWidth + starGap, baseline - lineCenter - starSize / 2);
    context.scale(starSize / 24, starSize / 24);
    context.fillStyle = emailColors.gold;
    context.strokeStyle = emailColors.gold;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.shadowColor = blur ? emailColors.gold : "transparent";
    context.shadowBlur = blur;
    context.fill(star);
    context.stroke(star);
    context.restore();
  };
  drawStar(5 * SCALE);
  drawStar(0);
  return canvas;
}

/** One code box, styled like the site's code input slots. */
function drawDigit(digit: string) {
  const { width, height } = emailLayout.digit;
  const { canvas, context } = createCanvas(width, height, emailColors.card);
  const inset = SCALE / 2;
  context.beginPath();
  context.roundRect(inset, inset, canvas.width - SCALE, canvas.height - SCALE, 12 * SCALE);
  context.fillStyle = emailColors.page;
  context.fill();
  context.lineWidth = SCALE;
  context.strokeStyle = "rgba(210, 162, 59, 0.55)";
  context.stroke();

  applyStyle(context, styles.digit);
  context.textAlign = "center";
  const metrics = context.measureText(digit);
  const glyphHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  context.fillText(
    digit,
    canvas.width / 2,
    (canvas.height - glyphHeight) / 2 + metrics.actualBoundingBoxAscent,
  );
  return canvas;
}

async function drawAsset(asset: EmailAsset): Promise<HTMLCanvasElement> {
  const width = emailLayout.contentWidth;
  switch (asset.kind) {
    case "wordmark":
      return drawWordmark();
    case "heading":
      return drawParagraphs(
        [
          { text: asset.eyebrow, style: styles.eyebrow, spaceBefore: 0 },
          { text: asset.title, style: styles.title, spaceBefore: 8 },
          { text: asset.intro, style: styles.intro, spaceBefore: 8 },
        ],
        { width, background: emailColors.card },
      );
    case "expires":
      return drawParagraphs([{ text: asset.text, style: styles.label, spaceBefore: 0 }], {
        width,
        background: emailColors.card,
      });
    case "note":
      return drawParagraphs([{ text: asset.text, style: styles.note, spaceBefore: 0 }], {
        width,
        background: emailColors.card,
        paddingTop: 21,
        divider: true,
      });
    case "footer":
      return drawParagraphs(
        [
          { text: asset.lines[0], style: styles.footer, spaceBefore: 0 },
          { text: asset.lines[1], style: styles.footerLink, spaceBefore: 0 },
        ],
        { width, background: emailColors.page },
      );
    case "digit":
      return drawDigit(asset.digit);
  }
}

export async function renderEmailImages(): Promise<Array<{ file: string; blob: Blob }>> {
  await Promise.all(
    ["800 30px Syne", `400 15px ${jakarta}`, `600 12px ${jakarta}`].map((font) =>
      document.fonts.load(font),
    ),
  );
  if (!document.fonts.check("800 30px Syne") || !document.fonts.check(`400 15px ${jakarta}`)) {
    throw new Error("Open this on the site so Syne and Plus Jakarta Sans are loaded.");
  }
  const images: Array<{ file: string; blob: Blob }> = [];
  for (const asset of allEmailAssets()) {
    const canvas = await drawAsset(asset);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(`Could not encode ${asset.file}.`);
    images.push({ file: asset.file, blob });
  }
  return images;
}

export async function downloadEmailImages() {
  for (const { file, blob } of await renderEmailImages()) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
