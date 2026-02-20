import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RestSmart — Recovery Intelligence",
  description: "Data-first recovery tracking for biohackers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-restsmart-bg font-sans antialiased text-slate-200">
        {children}
      </body>
    </html>
  );
}
