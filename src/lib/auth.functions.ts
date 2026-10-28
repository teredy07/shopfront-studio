import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type { AccountUser, EmailAuthChallenge } from "./auth.server";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const challengeSchema = z.object({ challengeId: z.string().uuid() });

export const getCurrentAccountFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentAccount } = await import("./auth.server");
  return getCurrentAccount();
});

export const signUpAccountFn = createServerFn({ method: "POST" })
  .validator(credentialsSchema.extend({ name: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { signUpAccount } = await import("./auth.server");
    return signUpAccount({ name: data.name, email: data.email, password: data.password });
  });

export const logInAccountFn = createServerFn({ method: "POST" })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const { logInAccount } = await import("./auth.server");
    return logInAccount(data);
  });

export const verifyEmailCodeFn = createServerFn({ method: "POST" })
  .validator(challengeSchema.extend({ code: z.string().regex(/^\d{6}$/) }))
  .handler(async ({ data }) => {
    const { verifyEmailCode } = await import("./auth.server");
    return verifyEmailCode(data.challengeId, data.code);
  });

export const resendEmailCodeFn = createServerFn({ method: "POST" })
  .validator(challengeSchema)
  .handler(async ({ data }) => {
    const { resendEmailCode } = await import("./auth.server");
    return resendEmailCode(data.challengeId);
  });

export const logOutAccountFn = createServerFn({ method: "POST" }).handler(async () => {
  const { logOutAccount } = await import("./auth.server");
  await logOutAccount();
  return { success: true };
});

export const updateAvatarFn = createServerFn({ method: "POST" })
  .validator(z.object({ dataUrl: z.string().max(800_000) }))
  .handler(async ({ data }) => {
    const { updateAccountAvatar } = await import("./auth.server");
    return updateAccountAvatar(data.dataUrl);
  });
