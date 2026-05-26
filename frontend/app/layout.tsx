import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Spice Garden — AI Smart Dining Assistant",
  description:
    "Order smarter with Zara, your AI dining companion. Personalised recommendations, group ordering, and conversational checkout.",
  keywords: ["restaurant", "AI", "dining", "food ordering", "smart menu"],
  openGraph: {
    title: "Spice Garden — AI Smart Dining",
    description: "Your AI-powered dining companion",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
