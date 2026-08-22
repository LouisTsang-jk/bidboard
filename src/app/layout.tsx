import type { Metadata, Viewport } from "next";
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
  applicationName: "outbid.website",
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
    locale: "en_US",
    title: "Buy the height. Keep the spotlight.",
    description: "One payment puts your link on a public ranking. Higher bids move higher.",
    images: [
      {
        url: "/brand/og-auction-tape.png",
        width: 1200,
        height: 630,
        alt: "outbid.website open bidboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "outbid.website",
    description: "The open bidboard for internet projects.",
    images: ["/brand/og-auction-tape.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  colorScheme: "dark",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "outbid.website",
  url: "https://outbid.website",
  description:
    "A transparent paid leaderboard for websites, products, and internet projects.",
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "outbid.website",
    url: "https://outbid.website",
    logo: {
      "@type": "ImageObject",
      url: "https://outbid.website/brand/icon-512.png",
      width: 512,
      height: 512,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${barlowCondensed.variable}`}>
      <head>
        <script
          defer
          data-domain="outbid.website"
          src="https://plausible-analytics-ce-production-9116.up.railway.app/js/script.js"
        />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
