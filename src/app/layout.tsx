import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Post-it Todo List",
  description: "따뜻하고 깔끔한 포스트잇 스타일의 할 일 관리 웹 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased board-pattern">
        {children}
      </body>
    </html>
  );
}
