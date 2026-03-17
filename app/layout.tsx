import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, Bebas_Neue } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

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
        <NextTopLoader color="#ffc54a" shadow="0 0 10px #ffc54a,0 0 5px #00bbfa" height={3} showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
