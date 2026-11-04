/**
 * The 6-digit code emails sent for sign up, log in and password reset.
 *
 * Email clients support far less than browsers, so this is table layout with inline styles.
 * Gmail and Outlook ignore web fonts: the wordmark is therefore an image rendered from the site
 * header (Syne 800 at 3x, public/email/cashvibe-wordmark.png), while headings use Syne where the
 * client loads it and the closest system fonts elsewhere. Colors are the site's theme tokens.
 */
export type VerificationEmailPurpose = "signup" | "login" | "password-reset";

const SITE_URL = "https://www.cashvibe.shop";
const WORDMARK_URL = `${SITE_URL}/email/cashvibe-wordmark.png`;

const color = {
  page: "#030e07",
  card: "#08180e",
  border: "#293e2d",
  text: "#f4f3e0",
  muted: "#a2a796",
  gold: "#d2a23b",
};

const displayFont = "Syne,'Arial Black','Helvetica Neue',Arial,sans-serif";
const bodyFont = "'Plus Jakarta Sans','Helvetica Neue',Helvetica,Arial,sans-serif";

const copy: Record<
  VerificationEmailPurpose,
  { label: string; heading: string; intro: string; notYou: string }
> = {
  signup: {
    label: "verification",
    heading: "Confirm your email",
    intro: "Welcome to Cashvibe! Enter this code to finish creating your account.",
    notYou: "Didn't sign up? You can ignore this email. No account is created without this code.",
  },
  login: {
    label: "login",
    heading: "Your login code",
    intro: "Enter this code to finish logging in to your Cashvibe account.",
    // A login code is only sent after the correct password was entered.
    notYou:
      "Didn't try to log in? Someone may know your password. Reset it from the Cashvibe login screen.",
  },
  "password-reset": {
    label: "password reset",
    heading: "Reset your password",
    intro: "Enter this code to choose a new password for your Cashvibe account.",
    notYou: "Didn't ask for this? You can ignore this email. Your password stays the same.",
  },
};

export function verificationEmailText(code: string, purpose: VerificationEmailPurpose): string {
  const { label, intro, notYou } = copy[purpose];
  return [
    `Your Cashvibe ${label} code is ${code}. It expires in 10 minutes.`,
    intro,
    `${notYou} Never share this code with anyone.`,
    `Cashvibe · ${SITE_URL.replace("https://", "")}`,
  ].join("\n\n");
}

export function verificationEmailHtml(code: string, purpose: VerificationEmailPurpose): string {
  const { heading, intro, notYou } = copy[purpose];
  // Inbox preview text; the filler stops clients pulling body copy into the preview line.
  const preheader = `${code} is your Cashvibe code. It expires in 10 minutes.`;
  const previewFiller = "&#847;&zwnj;&nbsp;".repeat(60);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${heading}</title>
    <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
    <!--[if mso]><style>table,td,p,h1,a{font-family:Arial,sans-serif!important}</style><![endif]-->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; }
      a[x-apple-data-detectors], u + #body a { color: inherit !important; text-decoration: none !important; font: inherit !important; }
      @media (max-width: 480px) {
        .shell { padding: 32px 12px 40px !important; }
        .card { padding: 32px 22px 28px !important; border-radius: 20px !important; }
        .heading { font-size: 27px !important; }
        .code { font-size: 34px !important; letter-spacing: 8px !important; padding-left: 8px !important; }
      }
    </style>
  </head>
  <body id="body" bgcolor="${color.page}" style="margin:0;padding:0;background-color:${color.page};">
    <div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${color.page};">${preheader}${previewFiller}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${color.page}" style="width:100%;background-color:${color.page};">
      <tr>
        <td class="shell" align="center" style="padding:48px 16px 56px;">
          <!--[if mso]><table role="presentation" width="520" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:520px;">
            <tr>
              <td align="center" style="padding:0 0 26px;">
                <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
                  <img src="${WORDMARK_URL}" width="235" height="50" alt="ca$hvibe" style="display:block;width:235px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;color:${color.text};font-family:${displayFont};font-size:26px;font-weight:800;line-height:50px;text-align:center;">
                </a>
              </td>
            </tr>
            <tr>
              <td class="card" bgcolor="${color.card}" style="padding:40px 40px 34px;background-color:${color.card};border:1px solid ${color.border};border-radius:24px;">
                <p style="margin:0;font-family:${bodyFont};font-size:12px;line-height:1.5;letter-spacing:2.4px;text-transform:uppercase;color:${color.gold};">Cashvibe account</p>
                <h1 class="heading" style="margin:10px 0 0;font-family:${displayFont};font-size:31px;font-weight:800;line-height:1.15;letter-spacing:-0.3px;color:${color.text};">${heading}</h1>
                <p style="margin:12px 0 0;font-family:${bodyFont};font-size:16px;line-height:1.6;color:${color.muted};">${intro}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:28px 0 0;">
                  <tr>
                    <td align="center" bgcolor="${color.page}" style="padding:24px 12px 20px;background-color:${color.page};border:1px solid ${color.gold};border-radius:16px;">
                      <div class="code" style="font-family:${displayFont};font-size:42px;font-weight:800;line-height:1.1;letter-spacing:12px;padding-left:12px;color:${color.text};-webkit-user-select:all;user-select:all;">${code}</div>
                      <div style="margin:12px 0 0;font-family:${bodyFont};font-size:11px;font-weight:600;line-height:1.4;letter-spacing:2.2px;text-transform:uppercase;color:${color.gold};">Expires in 10 minutes</div>
                    </td>
                  </tr>
                </table>
                <p style="margin:26px 0 0;font-family:${bodyFont};font-size:14px;line-height:1.6;color:${color.muted};">${notYou} Never share this code with anyone.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:26px 16px 0;font-family:${bodyFont};font-size:12px;line-height:1.7;color:${color.muted};">
                Cashvibe · After Effects templates<br>
                <a href="${SITE_URL}" target="_blank" style="color:${color.gold};text-decoration:none;">cashvibe.shop</a>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
