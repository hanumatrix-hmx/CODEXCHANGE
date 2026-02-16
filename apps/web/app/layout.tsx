import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/header";

export const metadata: Metadata = {
    title: "CODEXCHANGE - B2B AI Tools Marketplace",
    description: "Discover, evaluate, and purchase AI tools with ownership rights",
};

import { TRPCReactProvider } from "../utils/trpc/react-provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <TRPCReactProvider>
                    <Header />
                    {children}
                </TRPCReactProvider>
            </body>
        </html>
    );
}
