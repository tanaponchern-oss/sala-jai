import type { Metadata, Viewport } from "next";
import { Noto_Serif_Thai, Sarabun } from "next/font/google";
import "./globals.css";

const display = Noto_Serif_Thai({ subsets: ["thai", "latin"], weight: ["500", "700"], variable: "--font-display" });
const body = Sarabun({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "ศาลาใจ",
  description: "พื้นที่พักใจ คุยระบายและรับคำแนะนำด้วยหลักพุทธจิตวิทยา ไม่ต้องสมัครสมาชิก",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
