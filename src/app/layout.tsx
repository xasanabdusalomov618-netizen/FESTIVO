import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LANG_COOKIE, resolveLang } from "@/i18n";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toaster";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "FESTIVO",
  description: "FESTIVO — event equipment marketplace",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F172A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = resolveLang(cookieStore.get(LANG_COOKIE)?.value);
  const user = await getCurrentUser();

  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initialLang={lang}>
          <SessionProvider user={user}>
            <ToastProvider>
              <SiteHeader />
              <main id="main" tabIndex={-1}>
                {children}
              </main>
              <SiteFooter />
            </ToastProvider>
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
