import type { Metadata } from "next";
import { Barlow_Condensed, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://outbid.website"),
  title: {
    default: "outbid.website — Buy the height. Keep the spotlight.",
    template: "%s — outbid.website",
  },
  description:
    "A transparent paid leaderboard for websites, products, and internet projects. Every bid and every move is visible.",
  openGraph: {
    type: "website",
    url: "https://outbid.website",
    siteName: "outbid.website",
    title: "Buy the height. Keep the spotlight.",
    description: "One payment puts your link on a public ranking. Higher bids move higher.",
    images: [{ url: "/brand/og-auction-tape.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "outbid.website",
    description: "The open bidboard for internet projects.",
    images: ["/brand/og-auction-tape.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
