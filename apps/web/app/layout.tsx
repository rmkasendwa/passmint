import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { AppProvider } from "../components/app-provider";
import { listEventsForPage } from "../server-events";
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
}: {
  children: React.ReactNode;
}) {
  const initialEvents = await listEventsForPage();
  const initialThemePreference = await getInitialThemePreference();

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
          initialEvents={initialEvents}
          initialThemePreference={initialThemePreference}
        >
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
