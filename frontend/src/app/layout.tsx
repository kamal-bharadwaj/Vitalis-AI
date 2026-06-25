import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";
import RightAIPanel from "@/components/RightAIPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vitalis AI - Healthcare Dashboard",
  description: "Virtual healthcare assistant and medical records dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex bg-gray-50 text-gray-900">
        <LeftSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          {children}
        </div>
        <RightAIPanel />
      </body>
    </html>
  );
}
