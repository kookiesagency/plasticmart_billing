import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlasticMart Billing",
  description: "A smart billing system.",
  icons: {
    icon: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
