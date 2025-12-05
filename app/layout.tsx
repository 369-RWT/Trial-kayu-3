import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
    title: "Al Fath Kayu",
    description: "Timber Manufacturing System",
};

import GlobalHeader from "@/components/GlobalHeader";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased font-sans bg-slate-50 min-h-screen">
                <GlobalHeader />
                <main>
                    {children}
                </main>
            </body>
        </html>
    );
}
