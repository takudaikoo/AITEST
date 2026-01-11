import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const notoSansJP = Noto_Sans_JP({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    preload: false
});

export const metadata: Metadata = {
    title: "AI学ぶくん",
    description: "Internal AI Literacy E-Learning System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className="dark">
            <body className={`${inter.className} ${notoSansJP.className}`}>{children}</body>
        </html>
    );
}
