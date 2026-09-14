import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { AppProvider } from "../components/app-provider";
import { getServerSession } from "../server-session";
import { getInitialThemePreference } from "../server-theme";
import "../styles.css";

export const metadata: Metadata = {
  title: {
    default: "Passmint — Good plans start here",
    template: "%s | Passmint",
  },
  description:
    "Discover live experiences, book tickets and bring people together with Passmint.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const [initialSession, initialThemePreference] = await Promise.all([
    getServerSession(),
    getInitialThemePreference(),
  ]);

  const initialResolvedTheme =
    initialThemePreference === "light" ? "light" : "dark";

  return (
    <html lang="en" data-theme={initialResolvedTheme}>
      <body>
        <NextTopLoader
          color="var(--accent)"
          height={3}
          showSpinner={false}
          shadow={false}
          showForHashAnchor={false}
        />
        <AppProvider
          key={initialSession?.token ?? "guest"}
          initialSession={initialSession}
          initialThemePreference={initialThemePreference}
        >
          {children}
          {modal}
        </AppProvider>
      </body>
    </html>
  );
}
