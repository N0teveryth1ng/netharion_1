import type { Metadata } from "next";
import { Cinzel, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { SocketProvider } from "@/components/SocketProvider";
import NotificationCenter from "@/components/NotificationCenter";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NETHARION — Where Code Becomes Legend",
  description:
    "A living dark-fantasy realm powered by your GitHub. Presence, not profiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${dmSans.variable} ${geistMono.variable} h-full`}>
      <body className="relative min-h-full antialiased">
        <div className="neth-starfield" aria-hidden />
        <SocketProvider>
          <Providers>
            <div className="relative z-10 flex min-h-full flex-col">
              <Nav />
              <div className="flex-1">{children}</div>
            </div>
            <NotificationCenter />
          </Providers>
        </SocketProvider>
      </body>
    </html>
  );
}
