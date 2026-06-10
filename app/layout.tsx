import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modern Karaoke",
  description: "Host a karaoke session — anyone can add songs via QR code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f1a] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
