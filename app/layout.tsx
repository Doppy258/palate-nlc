import type { Metadata } from "next";
import { landingMetadata } from "@/components/landing";
import "./globals.css";

export const metadata: Metadata = {
  title: landingMetadata.title,
  description: landingMetadata.description,
  icons: {
    icon: [
      {
        url: landingMetadata.faviconLight,
        media: "(prefers-color-scheme: light)",
      },
      {
        url: landingMetadata.faviconDark,
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: landingMetadata.appleTouchIcon,
  },
  openGraph: {
    title: landingMetadata.title,
    description: landingMetadata.description,
    images: [landingMetadata.ogImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: landingMetadata.title,
    description: landingMetadata.description,
    images: [landingMetadata.ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
