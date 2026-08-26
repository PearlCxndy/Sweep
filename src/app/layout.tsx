import type { Metadata, Viewport } from "next";
import { Archivo, DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sweep.",
  description: "A shopping list built for the forty minutes inside the shop.",
};

export const viewport: Viewport = {
  themeColor: "#FBFAF4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body
        className={`${archivo.variable} ${instrumentSans.variable} ${dmMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
