// Shell-ul aplicației — providers globali (temă, auth config, tooltip, toast) fără logică de business.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { AuthErrorToaster } from "@/components/auth/auth-error-toaster";
import { AuthProviders } from "@/components/auth/auth-providers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isAuthConfigured } from "@/lib/auth";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SkillForge",
  description: "Copilot personal de skills și carieră"
};

/**
 * Script sincron înainte de primul paint — fără el, pe temă dark apare o clipă de alb
 * (FOUC) până hidratează React. Citește cheia dedicată; ca punte temporară, dacă lipsește
 * preferința din store-ul vechi (skillforge-app.state.theme).
 */
const themeInitScript = `(function(){try{var k="skillforge-theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"&&t!=="system"){var raw=localStorage.getItem("skillforge-app");if(raw){var p=JSON.parse(raw);t=p&&p.state&&p.state.theme;}}var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Configurația se știe pe server; coboară prin context, nu prin props pe fiecare formular.
  const authConfigured = isAuthConfigured();

  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthProviders configured={authConfigured}>
            <TooltipProvider>
              {children}
              {/* useSearchParams cere Suspense în App Router. */}
              <Suspense fallback={null}>
                <AuthErrorToaster />
              </Suspense>
              <Toaster richColors position="bottom-center" />
            </TooltipProvider>
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
