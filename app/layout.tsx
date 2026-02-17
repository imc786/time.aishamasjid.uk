import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { TimeErrorBoundary } from "@/components/time/TimeErrorBoundary";
import "./globals.css";

const outfit = Outfit({
  weight: ["400", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aisha Masjid | Prayer Times",
  description: "Prayer times display for Aisha Masjid & Islamic Centre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        <TimeErrorBoundary>{children}</TimeErrorBoundary>
      </body>
    </html>
  );
}
