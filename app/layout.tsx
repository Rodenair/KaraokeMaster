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
        <footer style={{ borderTop: "1px solid #2a0040", background: "transparent" }} className="py-4 px-4 text-center">
          <p className="text-xs" style={{ color: "#3a1050" }}>
            © 2026 Rodenair De Leon ·{" "}
            <a
              href="https://www.rodenair.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#ff0080]"
              style={{ color: "#3a1050" }}
            >
              rodenair.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
