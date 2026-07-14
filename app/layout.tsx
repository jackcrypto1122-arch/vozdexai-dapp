import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const vozdexSans = Inter({
  subsets: ["latin"],
  variable: "--font-vozdex-sans",
});

export const metadata: Metadata = {
  title: "Vozdex AI",
  description:
    "Vozdex AI is a voice-assisted trading terminal for Robinhood Chain with live wallet, market, quote, and execution flows.",
  icons: {
    icon: "/icon.jpg",
    shortcut: "/icon.jpg",
    apple: "/icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vozdexSans.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
