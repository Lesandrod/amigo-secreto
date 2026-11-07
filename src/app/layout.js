import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Amigo Secreto",
  description: "Plataforma de sorteo confidencial de amigo secreto",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f7f8fa] text-[#090a0f]">
        {children}
      </body>
    </html>
  );
}
