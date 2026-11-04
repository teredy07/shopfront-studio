/**
 * The 6-digit code emails sent for sign up, log in and password reset.
 *
 * Mail apps are hostile to a dark, custom-font design: Gmail and Outlook ignore web fonts, and
 * Gmail's iPhone app recolors emails in dark mode (dark backgrounds turn light, light text turns
 * dark) but never touches images or background gradients. So every piece of text is an image
 * rendered from the site's own fonts (src/dev/email-images.ts), and every background is painted
 * with a one-color gradient. The text below is the source for those images, their alt text and
 * the plain-text part. Image file names hash their text: change the copy here, then regenerate
 * the images, or the tests fail.
 */
export type VerificationEmailPurpose = "signup" | "login" | "password-reset";

export const verificationEmailPurposes: readonly VerificationEmailPurpose[] = [
  "signup",
  "login",
  "password-reset",
];

const SITE_URL = "https://www.cashvibe.shop";
const ASSET_URL = `${SITE_URL}/email`;
/** Part of every image's file name; bump it after a visual change so mail apps refetch. */
const ASSET_VERSION = 2;

export const emailColors = {
  page: "#030e07",
  card: "#08180e",
  border: "#293e2d",
  text: "#f4f3e0",
  muted: "#a2a796",
  gold: "#d2a23b",
} as const;

/** CSS pixel sizes shared by the HTML layout and the image renderer. */
export const emailLayout = {
  /** Width of the text images inside the card (card 400px minus 30px padding each side). */
  contentWidth: 340,
  wordmark: { width: 240, height: 60 },
  digit: { width: 44, height: 56, gap: 6 },
} as const;

export const emailCopy = {
  eyebrow: "Cashvibe account",
  expires: "Expires in 10 minutes",
  neverShare: "Never share this code with anyone.",
  footer: ["Cashvibe · After Effects packs", "cashvibe.shop"] as const,
  purposes: {
    signup: {
      label: "verification",
      title: "Confirm your email",
      intro: "Welcome to Cashvibe! Enter this code to finish creating your account.",
      notYou: "Didn't sign up? You can ignore this email. No account is created without this code.",
    },
    login: {
      label: "login",
      title: "Your login code",
      intro: "Enter this code to finish logging in to your Cashvibe account.",
      // A login code is only sent after the correct password was entered.
      notYou:
        "Didn't try to log in? Someone may know your password. Reset it from the Cashvibe login screen.",
    },
    "password-reset": {
      label: "password reset",
      title: "Reset your password",
      intro: "Enter this code to choose a new password for your Cashvibe account.",
      notYou: "Didn't ask for this? You can ignore this email. Your password stays the same.",
    },
  },
} as const;

export type EmailAsset =
  | { kind: "wordmark"; file: string; alt: string }
  | { kind: "heading"; file: string; alt: string; eyebrow: string; title: string; intro: string }
  | { kind: "expires"; file: string; alt: string; text: string }
  | { kind: "note"; file: string; alt: string; text: string }
  | { kind: "footer"; file: string; alt: string; lines: readonly [string, string] }
  | { kind: "digit"; file: string; alt: string; digit: string };

/** 32-bit FNV-1a, enough to give each text its own stable file name. */
function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function fileFor(kind: EmailAsset["kind"], content: string): string {
  return `${kind}-${hashText(`${ASSET_VERSION}|${content}`)}.png`;
}

const wordmarkAsset: EmailAsset = {
  kind: "wordmark",
  file: fileFor("wordmark", "ca$hvibe"),
  alt: "ca$hvibe",
};

const expiresAsset: EmailAsset = {
  kind: "expires",
  file: fileFor("expires", emailCopy.expires),
  alt: emailCopy.expires,
  text: emailCopy.expires,
};

const footerAsset: EmailAsset = {
  kind: "footer",
  file: fileFor("footer", emailCopy.footer.join("\n")),
  alt: emailCopy.footer.join(" · "),
  lines: emailCopy.footer,
};

function headingAsset(purpose: VerificationEmailPurpose): EmailAsset {
  const { title, intro } = emailCopy.purposes[purpose];
  return {
    kind: "heading",
    file: fileFor("heading", [emailCopy.eyebrow, title, intro].join("\n")),
    alt: `${title}. ${intro}`,
    eyebrow: emailCopy.eyebrow,
    title,
    intro,
  };
}

function noteAsset(purpose: VerificationEmailPurpose): EmailAsset {
  const text = `${emailCopy.purposes[purpose].notYou} ${emailCopy.neverShare}`;
  return { kind: "note", file: fileFor("note", text), alt: text, text };
}

function digitAsset(digit: string): EmailAsset {
  return { kind: "digit", file: fileFor("digit", digit), alt: digit, digit };
}

/** Every image the emails can reference; the renderer draws exactly this list. */
export function allEmailAssets(): EmailAsset[] {
  return [
    wordmarkAsset,
    expiresAsset,
    footerAsset,
    ...verificationEmailPurposes.flatMap((purpose) => [headingAsset(purpose), noteAsset(purpose)]),
    ..."0123456789".split("").map(digitAsset),
  ];
}

export function verificationEmailText(code: string, purpose: VerificationEmailPurpose): string {
  const { label, intro, notYou } = emailCopy.purposes[purpose];
  return [
    `Your Cashvibe ${label} code is ${code}. It expires in 10 minutes.`,
    intro,
    `${notYou} ${emailCopy.neverShare}`,
    `Cashvibe · ${SITE_URL.replace("https://", "")}`,
  ].join("\n\n");
}

/** A solid color Gmail's dark mode leaves alone: it recolors background-color, not gradients. */
const paint = (color: string) =>
  `background-color:${color};background-image:linear-gradient(${color},${color});`;

const imageReset = "display:block;border:0;outline:none;text-decoration:none;";
// Styles the alt text when images are blocked.
const altTextStyle = `font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${emailColors.text};`;

const escapeAttribute = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

function blockImage(asset: EmailAsset): string {
  return `<img src="${ASSET_URL}/${asset.file}" width="${emailLayout.contentWidth}" alt="${escapeAttribute(asset.alt)}" style="${imageReset}width:100%;max-width:${emailLayout.contentWidth}px;height:auto;${altTextStyle}">`;
}

export function verificationEmailHtml(code: string, purpose: VerificationEmailPurpose): string {
  const { title } = emailCopy.purposes[purpose];
  const { wordmark, digit } = emailLayout;
  // Inbox preview text; the filler stops clients pulling more of the email into the preview.
  const preheader = `${code} is your Cashvibe code. It expires in 10 minutes.`;
  const previewFiller = "&#847;&zwnj;&nbsp;".repeat(60);
  const digitCells = [...code]
    .map((character, index, all) => {
      const left = index === 0 ? 0 : digit.gap / 2;
      const right = index === all.length - 1 ? 0 : digit.gap / 2;
      return `<td style="padding:0 ${right}px 0 ${left}px;"><img class="digit" src="${ASSET_URL}/${digitAsset(character).file}" width="${digit.width}" height="${digit.height}" alt="${character}" style="${imageReset}width:${digit.width}px;height:${digit.height}px;${altTextStyle}font-size:24px;font-weight:bold;text-align:center;"></td>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${title}</title>
    <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
      @media (max-width: 480px) {
        .shell { padding: 28px 10px 36px !important; }
        .card { padding: 26px 18px 24px !important; border-radius: 19px !important; }
        .card-frame { border-radius: 20px !important; }
      }
      @media (max-width: 360px) {
        .digit { width: 38px !important; height: 48px !important; }
      }
    </style>
  </head>
  <body bgcolor="${emailColors.page}" style="margin:0;padding:0;${paint(emailColors.page)}">
    <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${emailColors.page};">${preheader}${previewFiller}</div>
    <div style="${paint(emailColors.page)}">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${emailColors.page}" style="width:100%;${paint(emailColors.page)}">
        <tr>
          <td class="shell" align="center" style="padding:44px 16px 52px;">
            <!--[if mso]><table role="presentation" width="402" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:402px;">
              <tr>
                <td align="center" style="padding:0 0 20px;">
                  <a href="${SITE_URL}" target="_blank" style="text-decoration:none;"><img src="${ASSET_URL}/${wordmarkAsset.file}" width="${wordmark.width}" height="${wordmark.height}" alt="${wordmarkAsset.alt}" style="${imageReset}width:${wordmark.width}px;max-width:100%;height:auto;${altTextStyle}font-size:26px;font-weight:bold;text-align:center;"></a>
                </td>
              </tr>
              <tr>
                <td class="card-frame" bgcolor="${emailColors.border}" style="padding:1px;border-radius:24px;${paint(emailColors.border)}">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                    <tr>
                      <td class="card" bgcolor="${emailColors.card}" style="padding:30px 30px 28px;border-radius:23px;${paint(emailColors.card)}">
                        ${blockImage(headingAsset(purpose))}
                        <div style="padding:26px 0 0;">
                          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                            <tr>${digitCells}</tr>
                          </table>
                        </div>
                        <div style="padding:14px 0 0;">${blockImage(expiresAsset)}</div>
                        <div style="padding:24px 0 0;">${blockImage(noteAsset(purpose))}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:20px 0 0;">
                  <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">${blockImage(footerAsset)}</a>
                </td>
              </tr>
            </table>
            <!--[if mso]></td></tr></table><![endif]-->
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;
}
