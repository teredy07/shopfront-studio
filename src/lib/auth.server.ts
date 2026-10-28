import { createClient, type Client, type Row } from "@libsql/client";
import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export type AccountUser = {
  id: string;
  email: string;
  fullName: string;
  avatarDataUrl: string | null;
};

export type EmailAuthChallenge = {
  challengeId: string;
  email: string;
  purpose: "signup" | "login" | "password-reset";
  expiresAt: number;
  resendAvailableAt: number;
};

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const MAX_AVATAR_BYTES = 512 * 1024;
const PASSWORD_KEY_LENGTH = 64;
const EMAIL_CODE_LIFETIME_MS = 10 * 60 * 1000;
const EMAIL_CODE_RESEND_DELAY_MS = 60 * 1000;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
const EMAIL_CODE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const sessionCookie = process.env["NODE_ENV"] === "production"
  ? "__Host-cashvibe_session"
  : "cashvibe_session";
const cookieOptions = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
};

let clientPromise: Promise<Client> | undefined;
let schemaSetup: Promise<void> | undefined;

async function getDatabase(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const configuredUrl = process.env["TURSO_DATABASE_URL"]?.trim();
      // Turso tokens are ASCII and never contain whitespace. Remove any
      // invisible line separators introduced when copying the token into a
      // hosting dashboard, since fetch rejects them in the Authorization header.
      const authToken = process.env["TURSO_AUTH_TOKEN"]?.replace(/\s/gu, "");
      if (process.env["NODE_ENV"] === "production" && !configuredUrl) {
        throw new Error("The account database is not configured yet. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to the Vercel project, then redeploy.");
      }

      const url = configuredUrl || "file:./data/cashvibe.sqlite";
      if (url.startsWith("file:")) {
        const localPath = url.slice("file:".length);
        const absolutePath = resolve(process.cwd(), localPath);
        await mkdir(dirname(absolutePath), { recursive: true });
      } else if (!authToken) {
        throw new Error("TURSO_AUTH_TOKEN is required for the hosted account database.");
      }

      return createClient({ url, ...(authToken ? { authToken } : {}) });
    })().catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

async function ensureSchema(): Promise<Client> {
  const db = await getDatabase();
  if (!schemaSetup) {
    schemaSetup = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE COLLATE NOCASE,
          full_name TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          avatar_data_url TEXT,
          created_at INTEGER NOT NULL
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      await db.execute("CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS email_verification_challenges (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL COLLATE NOCASE,
          purpose TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          full_name TEXT,
          password_salt TEXT,
          password_hash TEXT,
          user_id TEXT,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0
        )
      `);
      await db.execute(`
        CREATE UNIQUE INDEX IF NOT EXISTS email_challenge_email_purpose_idx
        ON email_verification_challenges(email, purpose)
      `);
    })().catch((error: unknown) => {
      schemaSetup = undefined;
      throw error;
    });
  }
  await schemaSetup;
  return db;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolvePromise(derivedKey);
    });
  });
}

function accountFromRow(row: Row): AccountUser {
  return {
    id: String(row["id"]),
    email: String(row["email"]),
    fullName: String(row["full_name"]),
    avatarDataUrl: typeof row["avatar_data_url"] === "string" ? row["avatar_data_url"] : null,
  };
}

async function startSession(userId: string): Promise<void> {
  const db = await ensureSchema();
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [hashToken(token), userId, now + SESSION_LIFETIME_SECONDS * 1000, now],
  });
  setCookie(sessionCookie, token, { ...cookieOptions, maxAge: SESSION_LIFETIME_SECONDS });
}

export async function getCurrentAccount(): Promise<AccountUser | null> {
  const token = getCookie(sessionCookie);
  if (!token) return null;

  const db = await ensureSchema();
  const now = Date.now();
  const result = await db.execute({
    sql: `SELECT users.id, users.email, users.full_name, users.avatar_data_url
          FROM sessions JOIN users ON users.id = sessions.user_id
          WHERE sessions.token_hash = ? AND sessions.expires_at > ? LIMIT 1`,
    args: [hashToken(token), now],
  });
  if (!result.rows[0]) {
    deleteCookie(sessionCookie, cookieOptions);
    return null;
  }
  return accountFromRow(result.rows[0]);
}

type AuthPurpose = EmailAuthChallenge["purpose"];
type ChallengePayload = {
  fullName?: string;
  passwordSalt?: string;
  passwordHash?: string;
  userId?: string;
};

function hashEmailCode(challengeId: string, code: string): string {
  return createHash("sha256").update(`${challengeId}:${code}`).digest("hex");
}

async function sendEmailCode(email: string, code: string, purpose: AuthPurpose): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  if (!apiKey) {
    throw new Error("Email verification is not configured. Add RESEND_API_KEY to Vercel, then redeploy.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cashvibe <noreply@cashvibe.shop>",
      to: [email],
      subject: purpose === "password-reset" ? "Reset your Cashvibe password" : "Your Cashvibe verification code",
      text: purpose === "password-reset"
        ? `Your Cashvibe password reset code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`
        : `Your Cashvibe verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;color:#f5f2d9;background:#06130c;padding:32px;border-radius:16px"><p style="color:#d7a936;letter-spacing:3px">CASHVIBE</p><h1 style="font-size:24px">${purpose === "password-reset" ? "Reset your password" : "Your verification code"}</h1><p>${purpose === "password-reset" ? "Enter this code to choose a new password." : "Enter this code to continue."} It expires in 10 minutes.</p><p style="font-size:36px;font-weight:700;letter-spacing:10px;color:#d7a936">${code}</p><p style="color:#a7ad9d">If you didn't request this, you can ignore this email.</p></div>`,
    }),
  });

  if (!response.ok) {
    throw new Error("We couldn't send your verification email. Check that the Resend key is valid and cashvibe.shop is verified.");
  }
}

function challengeResult(row: Row): EmailAuthChallenge {
  return {
    challengeId: String(row["id"]),
    email: String(row["email"]),
    purpose: String(row["purpose"]) as AuthPurpose,
    expiresAt: Number(row["expires_at"]),
    resendAvailableAt: Number(row["created_at"]) + EMAIL_CODE_RESEND_DELAY_MS,
  };
}

async function createEmailChallenge(
  db: Client,
  email: string,
  purpose: AuthPurpose,
  payload: ChallengePayload,
  reuseId?: string,
  deliverEmail = true,
): Promise<EmailAuthChallenge> {
  const now = Date.now();
  const existing = await db.execute({
    sql: "SELECT id, email, purpose, created_at, expires_at FROM email_verification_challenges WHERE email = ? AND purpose = ? LIMIT 1",
    args: [email, purpose],
  });
  const existingRow = existing.rows[0];
  if (!reuseId && existingRow && now < Number(existingRow["created_at"]) + EMAIL_CODE_RESEND_DELAY_MS) {
    await db.execute({
      sql: `UPDATE email_verification_challenges
            SET full_name = ?, password_salt = ?, password_hash = ?, user_id = ?
            WHERE id = ?`,
      args: [payload.fullName ?? null, payload.passwordSalt ?? null, payload.passwordHash ?? null, payload.userId ?? null, String(existingRow["id"])],
    });
    return challengeResult(existingRow);
  }

  const challengeId = reuseId ?? randomUUID();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.execute({
    sql: "DELETE FROM email_verification_challenges WHERE email = ? AND purpose = ?",
    args: [email, purpose],
  });
  await db.execute({
    sql: `INSERT INTO email_verification_challenges
          (id, email, purpose, code_hash, full_name, password_salt, password_hash, user_id, created_at, expires_at, attempts)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [challengeId, email, purpose, hashEmailCode(challengeId, code), payload.fullName ?? null,
      payload.passwordSalt ?? null, payload.passwordHash ?? null, payload.userId ?? null,
      now, now + EMAIL_CODE_LIFETIME_MS],
  });

  try {
    if (deliverEmail) await sendEmailCode(email, code, purpose);
  } catch (error) {
    await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
    throw error;
  }

  return {
    challengeId,
    email,
    purpose,
    expiresAt: now + EMAIL_CODE_LIFETIME_MS,
    resendAvailableAt: now + EMAIL_CODE_RESEND_DELAY_MS,
  };
}

export async function signUpAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<EmailAuthChallenge> {
  const db = await ensureSchema();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || name.length > 80) throw new Error("Enter a name with 1 to 80 characters.");
  if (input.password.length < 8 || input.password.length > 128) {
    throw new Error("Use a password between 8 and 128 characters.");
  }
  const existingUser = await db.execute({ sql: "SELECT id FROM users WHERE email = ? LIMIT 1", args: [email] });
  if (existingUser.rows[0]) throw new Error("An account with this email already exists. Log in instead.");

  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await derivePassword(input.password, salt)).toString("hex");
  return createEmailChallenge(db, email, "signup", { fullName: name, passwordSalt: salt, passwordHash });
}

export async function logInAccount(input: { email: string; password: string }): Promise<EmailAuthChallenge> {
  const db = await ensureSchema();
  const email = input.email.trim().toLowerCase();
  const result = await db.execute({
    sql: `SELECT id, email, full_name, password_salt, password_hash
          FROM users WHERE email = ? LIMIT 1`,
    args: [email],
  });
  const row = result.rows[0];
  const salt = row ? String(row["password_salt"]) : "cashvibe-dummy-auth-salt";
  const expectedHex = row ? String(row["password_hash"]) : "00".repeat(PASSWORD_KEY_LENGTH);
  const actualHash = await derivePassword(input.password, salt);
  const expectedHash = Buffer.from(expectedHex, "hex");
  const passwordMatches = expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
  if (!row || !passwordMatches) throw new Error("Email or password is incorrect.");

  return createEmailChallenge(db, email, "login", { userId: String(row["id"]) });
}

export async function startPasswordReset(emailInput: string): Promise<EmailAuthChallenge> {
  const db = await ensureSchema();
  const email = emailInput.trim().toLowerCase();
  const result = await db.execute({ sql: "SELECT id FROM users WHERE email = ? LIMIT 1", args: [email] });
  const row = result.rows[0];
  return createEmailChallenge(
    db,
    email,
    "password-reset",
    row ? { userId: String(row["id"]) } : {},
    undefined,
    Boolean(row),
  );
}

export async function resendEmailCode(challengeId: string): Promise<EmailAuthChallenge> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM email_verification_challenges WHERE id = ? LIMIT 1",
    args: [challengeId],
  });
  const row = result.rows[0];
  if (!row || Date.now() - Number(row["created_at"]) > EMAIL_CODE_MAX_AGE_MS) {
    throw new Error("This verification request expired. Start again to get a new code.");
  }
  const waitMs = Number(row["created_at"]) + EMAIL_CODE_RESEND_DELAY_MS - Date.now();
  if (waitMs > 0) throw new Error(`Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`);

  const payload: ChallengePayload = {};
  if (typeof row["full_name"] === "string") payload.fullName = row["full_name"];
  if (typeof row["password_salt"] === "string") payload.passwordSalt = row["password_salt"];
  if (typeof row["password_hash"] === "string") payload.passwordHash = row["password_hash"];
  if (typeof row["user_id"] === "string") payload.userId = row["user_id"];
  const purpose = String(row["purpose"]) as AuthPurpose;
  return createEmailChallenge(db, String(row["email"]), purpose, payload, challengeId, purpose !== "password-reset" || typeof row["user_id"] === "string");
}

export async function verifyEmailCode(challengeId: string, code: string): Promise<AccountUser> {
  const db = await ensureSchema();
  const result = await db.execute({
    sql: "SELECT * FROM email_verification_challenges WHERE id = ? LIMIT 1",
    args: [challengeId],
  });
  const row = result.rows[0];
  if (!row) throw new Error("That verification code expired or was already used. Start again to get a new one.");
  if (row["purpose"] !== "signup" && row["purpose"] !== "login") {
    throw new Error("Use the password reset form to verify this code.");
  }
  if (Date.now() > Number(row["expires_at"])) {
    await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
    throw new Error("That verification code expired. Start again to get a new one.");
  }
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");

  const expected = Buffer.from(String(row["code_hash"]), "hex");
  const actual = Buffer.from(hashEmailCode(challengeId, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attempts = Number(row["attempts"]) + 1;
    if (attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
      throw new Error("Too many incorrect codes. Start again to request a new one.");
    }
    await db.execute({ sql: "UPDATE email_verification_challenges SET attempts = ? WHERE id = ?", args: [attempts, challengeId] });
    throw new Error(`That code isn't correct. ${EMAIL_CODE_MAX_ATTEMPTS - attempts} attempts remaining.`);
  }

  const consumed = await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
  if (consumed.rowsAffected !== 1) throw new Error("That verification code was already used. Start again to get a new one.");

  if (row["purpose"] === "signup") {
    const user: AccountUser = {
      id: randomUUID(),
      email: String(row["email"]),
      fullName: String(row["full_name"] ?? ""),
      avatarDataUrl: null,
    };
    if (!user.fullName || typeof row["password_salt"] !== "string" || typeof row["password_hash"] !== "string") {
      throw new Error("This signup request is incomplete. Start again to create your account.");
    }
    try {
      await db.execute({
        sql: `INSERT INTO users (id, email, full_name, password_salt, password_hash, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [user.id, user.email, user.fullName, row["password_salt"], row["password_hash"], Date.now()],
      });
    } catch (error) {
      if (String(error).toLowerCase().includes("unique") || String(error).toLowerCase().includes("constraint")) {
        throw new Error("An account with this email already exists. Log in instead.");
      }
      throw error;
    }
    await startSession(user.id);
    return user;
  }

  const userId = String(row["user_id"] ?? "");
  if (!userId) throw new Error("This login request is incomplete. Start again to log in.");
  const userResult = await db.execute({
    sql: "SELECT id, email, full_name, avatar_data_url FROM users WHERE id = ? LIMIT 1",
    args: [userId],
  });
  if (!userResult.rows[0]) throw new Error("This account no longer exists. Sign up again.");
  const user = accountFromRow(userResult.rows[0]);
  await startSession(user.id);
  return user;
}

export async function completePasswordReset(challengeId: string, code: string, newPassword: string): Promise<void> {
  const db = await ensureSchema();
  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new Error("Use a password between 8 and 128 characters.");
  }
  const result = await db.execute({
    sql: "SELECT * FROM email_verification_challenges WHERE id = ? LIMIT 1",
    args: [challengeId],
  });
  const row = result.rows[0];
  if (!row || row["purpose"] !== "password-reset") {
    throw new Error("That reset code is invalid or expired. Request a new one and try again.");
  }
  if (Date.now() > Number(row["expires_at"])) {
    await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
    throw new Error("That reset code expired. Request a new one and try again.");
  }
  if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");

  const expected = Buffer.from(String(row["code_hash"]), "hex");
  const actual = Buffer.from(hashEmailCode(challengeId, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attempts = Number(row["attempts"]) + 1;
    if (attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
      throw new Error("Too many incorrect codes. Request a new reset code.");
    }
    await db.execute({ sql: "UPDATE email_verification_challenges SET attempts = ? WHERE id = ?", args: [attempts, challengeId] });
    throw new Error(`That code isn't correct. ${EMAIL_CODE_MAX_ATTEMPTS - attempts} attempts remaining.`);
  }

  const userId = String(row["user_id"] ?? "");
  if (!userId) throw new Error("That reset code is invalid or expired. Request a new one and try again.");
  const consumed = await db.execute({ sql: "DELETE FROM email_verification_challenges WHERE id = ?", args: [challengeId] });
  if (consumed.rowsAffected !== 1) throw new Error("That reset code was already used. Request a new one and try again.");

  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await derivePassword(newPassword, salt)).toString("hex");
  const update = await db.execute({
    sql: "UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?",
    args: [salt, passwordHash, userId],
  });
  if (update.rowsAffected !== 1) throw new Error("This account no longer exists. Start again.");
  await db.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] });
}

export async function logOutAccount(): Promise<void> {
  const token = getCookie(sessionCookie);
  if (token) {
    const db = await ensureSchema();
    await db.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hashToken(token)] });
  }
  deleteCookie(sessionCookie, cookieOptions);
}

export async function updateAccountAvatar(dataUrl: string): Promise<AccountUser> {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || Buffer.from(match[2] ?? "", "base64").byteLength > MAX_AVATAR_BYTES) {
    throw new Error("Choose a JPG, PNG, or WebP photo under 512 KB after resizing.");
  }

  const current = await getCurrentAccount();
  if (!current) throw new Error("Log in before changing your profile photo.");

  const db = await ensureSchema();
  await db.execute({
    sql: "UPDATE users SET avatar_data_url = ? WHERE id = ?",
    args: [dataUrl, current.id],
  });
  return { ...current, avatarDataUrl: dataUrl };
}
