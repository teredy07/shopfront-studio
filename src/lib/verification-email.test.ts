import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  verificationEmailHtml,
  verificationEmailText,
  type VerificationEmailPurpose,
} from "@/lib/verification-email";

const purposes: VerificationEmailPurpose[] = ["signup", "login", "password-reset"];

describe("verification emails", () => {
  it.each(purposes)("puts the %s code in the inbox preview and the code block", (purpose) => {
    const html = verificationEmailHtml("482913", purpose);
    expect(html).toContain("482913 is your Cashvibe code. It expires in 10 minutes.");
    expect(html).toMatch(/class="code"[^>]*>482913<\/div>/);
  });

  it("titles each email for what it's for", () => {
    expect(verificationEmailHtml("482913", "signup")).toContain(
      "<title>Confirm your email</title>",
    );
    expect(verificationEmailHtml("482913", "login")).toContain("<title>Your login code</title>");
    expect(verificationEmailHtml("482913", "password-reset")).toContain(
      "<title>Reset your password</title>",
    );
  });

  it("loads the wordmark from www, which serves it without a redirect", () => {
    const html = verificationEmailHtml("482913", "login");
    expect(html).toContain('src="https://www.cashvibe.shop/email/cashvibe-wordmark.png"');
    expect(html).not.toContain("https://cashvibe.shop");
    expect(existsSync("public/email/cashvibe-wordmark.png")).toBe(true);
  });

  it("tells the account owner a login code means their password was used", () => {
    expect(verificationEmailText("482913", "login")).toContain("Someone may know your password.");
  });

  it("keeps the code in a plain sentence in the text version", () => {
    expect(verificationEmailText("482913", "password-reset")).toMatch(
      /^Your Cashvibe password reset code is 482913\. It expires in 10 minutes\./,
    );
  });
});
