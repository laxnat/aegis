import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, Bebas_Neue } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

// Each font is exposed as a CSS variable and referenced in globals.css via
// Tailwind's font-display / font-ui / font-mono utilities
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Aegis",
  description: "Workspace personified",
  icons: {
    icon: "/aegis-logo-transparent.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-secondary">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} ${bebasNeue.variable} antialiased`}
      >
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-tertiary)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: 'var(--font-barlow-condensed)',
              fontSize: '1rem',
              letterSpacing: '0.05em',
            },
          }}
        />
      </body>
    </html>
  );
}
