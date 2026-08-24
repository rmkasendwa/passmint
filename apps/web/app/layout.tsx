import type { Metadata } from "next";
import { AppProvider } from "../components/app-provider";
import { listEventsForPage } from "../server-events";
import { getInitialThemePreference } from "../server-theme";
import "../styles.css";

export const metadata: Metadata = {
  title: "Passmint",
  description: "QR ticketing for events and gate verification.",
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
