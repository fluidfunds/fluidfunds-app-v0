import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from './providers';
import "./globals.css";
import { Toaster } from 'sonner'

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '700']
});

export const metadata: Metadata = {
  title: "FluidFunds-A Decentralized Investment Pool Platform with Real-Time Streaming",
  description: "FluidFund enables investors to contribute continuously to a fund manager's pool via Superfluid streams. The fund manager invests the pooled USDC on behalf of the investors.",
  icons: {
    icon: [
      {
        url: "https://framerusercontent.com/images/coUO9J9W8iG6NHXJeSzCdCF7k.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://framerusercontent.com/images/coUO9J9W8iG6NHXJeSzCdCF7k.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
