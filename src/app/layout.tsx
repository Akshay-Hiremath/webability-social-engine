import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Webability Social Content Engine",
  description: "Repurpose Webability blog posts into platform-specific social content instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9ff]">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
