import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Plus Jakarta Sans (OFL, fonts/OFL.txt), self-hosted so the build needs no Google Fonts access.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin-wght.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { template: "%s · AntriAja", default: "AntriAja" },
  description: "Antrean untuk acara yang dibagikan di tempat.",
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
