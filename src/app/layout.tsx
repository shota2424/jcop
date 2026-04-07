import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JCOP - JC Operations Platform",
  description: "昭島青年会議所の事務局業務効率化プラットフォーム。出欠管理・スケジュール管理・議案管理をワンストップで。",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
