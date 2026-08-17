import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "AIAsk｜一次提问，多种答案",
  description: "同时向豆包、千问与腾讯混元提问，并排比较答案，快速得到更可靠的综合结论。",
  applicationName: "AIAsk",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "AIAsk｜一次提问，多种答案",
    description: "同时向豆包、千问与腾讯混元提问，并排比较答案，快速得到更可靠的综合结论。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "AIAsk——一次提问，多种答案" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAsk｜一次提问，多种答案",
    description: "同时询问多位 AI，并排比较，综合结论。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
