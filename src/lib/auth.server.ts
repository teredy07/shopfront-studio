import { createClient, type Client, type Row } from "@libsql/client";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export type AccountUser = {
  id: string;
  email: string;
  fullName: string;
  avatarDataUrl: string | null;
};

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const MAX_AVATAR_BYTES = 512 * 1024;
const PASSWORD_KEY_LENGTH = 64;
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

export async function signUpAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AccountUser> {
  const db = await ensureSchema();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || name.length > 80) throw new Error("Enter a name with 1 to 80 characters.");
  if (input.password.length < 8 || input.password.length > 128) {
    throw new Error("Use a password between 8 and 128 characters.");
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = (await derivePassword(input.password, salt)).toString("hex");
  const user: AccountUser = {
    id: randomUUID(),
    email,
    fullName: name,
    avatarDataUrl: null,
  };

  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, full_name, password_salt, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [user.id, user.email, user.fullName, salt, passwordHash, Date.now()],
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

export async function logInAccount(input: { email: string; password: string }): Promise<AccountUser> {
  const db = await ensureSchema();
  const email = input.email.trim().toLowerCase();
  const result = await db.execute({
    sql: `SELECT id, email, full_name, password_salt, password_hash, avatar_data_url
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

  const user = accountFromRow(row);
  await startSession(user.id);
  return user;
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
