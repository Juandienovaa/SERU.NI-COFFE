import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "seru.ni - Selalu Ada Cerita di Setiap Seduhan",
  description: "Sebuah pengalaman rasa premium yang meluncur langsung ke hari-hari Anda dengan harga merakyat.",
  openGraph: {
    title: "seru.ni - Selalu Ada Cerita di Setiap Seduhan",
    description: "Sebuah pengalaman rasa premium yang meluncur langsung ke hari-hari Anda dengan harga merakyat.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${instrumentSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
