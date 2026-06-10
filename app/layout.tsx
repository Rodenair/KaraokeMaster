import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Videoke! 🎤",
  description: "Classic Pinoy karaoke — start a session, scan the QR, and sing!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${baloo.variable} min-h-screen bg-[#07000f] text-[#f0e6ff] antialiased`}>
        {children}
      </body>
    </html>
  );
}
