import { Link } from "@tanstack/react-router";
import { Camera, LogOut, Star } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logOutAccountFn, updateAvatarFn, type AccountUser } from "@/lib/auth.functions";
import { cn } from "@/lib/utils";

type Props = {
  user: AccountUser | null;
  loading: boolean;
  onOpenAuth: (mode: "login" | "signup") => void;
  onUserChange: (user: AccountUser | null) => void;
};

const menuItemClassName =
  "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-primary/10 focus:text-foreground [&_svg]:text-gold";

export function SiteHeader({ user, loading, onOpenAuth, onUserChange }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logOutAccountFn();
      onUserChange(null);
      toast.success("You're logged out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out. Please try again.");
    } finally {
      setLogoutBusy(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!user) {
      toast.error("Log in before changing your profile photo.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photos must be 5 MB or smaller.");
      return;
    }

    setAvatarBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the profile photo.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      onUserChange(await updateAvatarFn({ data: { dataUrl } }));
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <header
      className={cn(
        "site-header sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "glass border-border/70 shadow-[0_12px_40px_-24px_oklch(0_0_0/0.9)]"
          : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:h-[4.5rem] sm:px-6">
        <Link
          to="/"
          aria-label="cashvibe home"
          className="brand-shine inline-flex shrink-0 items-center gap-1 font-display text-xl font-extrabold text-foreground sm:text-2xl"
        >
          ca<span className="text-gold">$</span>hvibe
          <Star
            aria-hidden="true"
            className="ml-1 h-3.5 w-3.5 animate-pulse fill-gold text-gold drop-shadow-[0_0_5px_var(--gold)]"
          />
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/"
            hash="packs"
            hashScrollIntoView={{ behavior: "smooth", block: "start" }}
            className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground md:inline-flex"
          >
            After Effects packs
          </Link>

          {loading ? (
            <span
              role="status"
              aria-label="Restoring account session"
              className="block h-9 w-28 animate-pulse rounded-full bg-card"
            />
          ) : user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="group flex items-center gap-2.5 rounded-full p-1 transition hover:bg-card data-[state=open]:bg-card sm:pr-3.5"
              >
                <Avatar user={user} busy={avatarBusy} />
                <span className="hidden max-w-40 truncate text-sm text-muted-foreground transition group-hover:text-foreground sm:block">
                  {user.fullName || user.email}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-64 rounded-2xl border-border bg-card p-1.5 shadow-[0_24px_60px_-20px_oklch(0_0_0/0.9)]"
              >
                <DropdownMenuLabel className="px-3 py-2.5">
                  <span className="block truncate text-sm font-semibold">
                    {user.fullName || "Your account"}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  disabled={avatarBusy}
                  className={menuItemClassName}
                  onSelect={() => avatarInputRef.current?.click()}
                >
                  <Camera aria-hidden="true" />
                  {avatarBusy ? "Saving photo…" : "Change photo"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={logoutBusy}
                  className={menuItemClassName}
                  onSelect={handleLogout}
                >
                  <LogOut aria-hidden="true" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                type="button"
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground transition hover:text-gold"
                onClick={() => onOpenAuth("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm"
                onClick={() => onOpenAuth("signup")}
              >
                Sign up
              </button>
            </>
          )}
        </nav>
      </div>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        className="sr-only"
        aria-label="Choose profile photo"
        onChange={handleAvatarChange}
      />
    </header>
  );
}

function Avatar({ user, busy }: { user: AccountUser; busy: boolean }) {
  return user.avatarDataUrl ? (
    <img
      src={user.avatarDataUrl}
      alt=""
      className={cn(
        "h-9 w-9 shrink-0 rounded-full border border-primary/50 object-cover",
        busy && "animate-pulse",
      )}
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/50 bg-background text-sm font-bold text-gold"
    >
      {(user.fullName || user.email || "C").slice(0, 1).toUpperCase()}
    </span>
  );
}
