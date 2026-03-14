import type { Metadata } from "next";
import { Arimo, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "GitHub Activity Globe",
  description: "Global open-source activity visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${arimo.variable} ${spaceMono.variable} antialiased bg-white dark:bg-black text-black dark:text-white overflow-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
