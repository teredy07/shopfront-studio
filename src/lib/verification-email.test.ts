import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  allEmailAssets,
  verificationEmailHtml,
  verificationEmailPurposes,
  verificationEmailText,
} from "@/lib/verification-email";

const imageSources = (html: string) =>
  [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1] ?? "");

describe("verification email", () => {
  it("has an image in public/email for every asset (regenerate them after copy changes)", () => {
    for (const asset of allEmailAssets()) {
      expect(existsSync(`public/email/${asset.file}`), asset.file).toBe(true);
    }
  });

  it.each(verificationEmailPurposes)("%s: only references images that exist", (purpose) => {
    const known = new Set(allEmailAssets().map((asset) => asset.file));
    for (const src of imageSources(verificationEmailHtml("745735", purpose))) {
      expect(src.startsWith("https://www.cashvibe.shop/email/"), src).toBe(true);
      expect(known.has(src.split("/").pop() ?? ""), src).toBe(true);
    }
  });

  it("spells the code with digit images, in order", () => {
    const html = verificationEmailHtml("745735", "login");
    const digits = [...html.matchAll(/<img class="digit"[^>]+alt="(\d)"/g)].map(
      (match) => match[1],
    );
    expect(digits.join("")).toBe("745735");
  });

  it("shows the code in the inbox preview and titles each purpose", () => {
    expect(verificationEmailHtml("745735", "signup")).toContain(
      "745735 is your Cashvibe code. It expires in 10 minutes.",
    );
    expect(verificationEmailHtml("745735", "signup")).toContain(
      "<title>Confirm your email</title>",
    );
    expect(verificationEmailHtml("745735", "login")).toContain("<title>Your login code</title>");
    expect(verificationEmailHtml("745735", "password-reset")).toContain(
      "<title>Reset your password</title>",
    );
  });

  // Gmail's iPhone dark mode recolors text and background colors but not images or gradients.
  it.each(verificationEmailPurposes)("%s: survives Gmail's dark mode", (purpose) => {
    const html = verificationEmailHtml("745735", purpose);
    const body = html.slice(html.indexOf("<body"));
    expect(body.match(/background-color:/g)?.length).toBe(body.match(/linear-gradient\(/g)?.length);

    const visibleText = body
      .replace(/<div style="display:none[^>]*>.*?<\/div>/s, "") // preheader
      .replace(/<!--.*?-->/gs, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    expect(visibleText).toBe("");
  });

  it("tells the account owner a login code means their password was used", () => {
    expect(verificationEmailText("745735", "login")).toContain("Someone may know your password.");
  });

  it("keeps the code in a plain sentence in the text version", () => {
    expect(verificationEmailText("745735", "password-reset")).toMatch(
      /^Your Cashvibe password reset code is 745735\. It expires in 10 minutes\./,
    );
  });
});
