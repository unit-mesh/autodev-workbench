import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNavigation } from "./components/navigation/TopNavigation";
import { SideNavigation } from "./components/navigation/SideNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoDev Work",
  description: "AI-Powered AutoDevelopment Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <TopNavigation />
          <div className="flex">
            <SideNavigation />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
