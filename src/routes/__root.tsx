import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthDialog, type AuthMode } from "@/components/AuthDialog";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getCurrentAccountFn, type AccountUser } from "../lib/auth.functions";

function NotFoundComponent() {
  return (
    <main className="mx-auto grid min-h-[65svh] max-w-6xl place-items-center px-5 py-20 text-center sm:px-6">
      <div className="reveal">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-display text-8xl font-extrabold md:text-9xl">
          <span className="text-gold-gradient">404</span>
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-8">
          Browse templates
        </Link>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[65svh] max-w-6xl place-items-center px-5 py-20 text-center sm:px-6">
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-ghost">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      // Default for pages without their own title (e.g. 404); routes override it.
      { title: "cashvibe — After Effects Templates" },
      { name: "theme-color", content: "#030e07" },
      { name: "color-scheme", content: "dark" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "cashvibe" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  // Bumped on every open so the dialog starts each visit with a clean slate.
  const [authSession, setAuthSession] = useState(0);
  const [authUser, setAuthUser] = useState<AccountUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentAccountFn()
      .then((user) => {
        if (active) setAuthUser(user);
      })
      .catch((error: unknown) => {
        console.warn("Could not restore the account session.", error);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function openAuth(mode: AuthMode) {
    setAuthSession((session) => session + 1);
    setAuthMode(mode);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="flex min-h-svh flex-col overflow-x-clip">
        <SiteHeader
          user={authUser}
          loading={authLoading}
          onOpenAuth={openAuth}
          onUserChange={setAuthUser}
        />
        <div id="main" className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <SiteFooter />
      </div>
      <AuthDialog
        key={authSession}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthenticated={setAuthUser}
      />
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}
