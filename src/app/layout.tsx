import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "@/shared/providers/TRPCProvider";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "UCourse · Virtual University", template: "%s | UCourse" },
  description:
    "UCourse es la plataforma de aprendizaje de Virtual University: masterclass y cursos gratuitos con material permanente, evaluación y certificados verificables.",
  keywords: [
    "cursos online",
    "masterclass",
    "aprendizaje",
    "certificados",
    "evaluación",
    "educación gratuita",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
