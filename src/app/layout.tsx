import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adnan Afana — Senior Product Designer",
  description:
    "Portfolio of Adnan Afana, a senior product designer crafting digital products across fintech, healthcare, AI and retail.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
