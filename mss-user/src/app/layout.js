export const dynamic = "force-dynamic";

import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import MainArea from "@/components/layout/MainArea";
import SiteFooter from "@/components/SiteFooter";
import SiteFooterMaroon from "@/components/SiteFooterMaroon";
import { fetchJourneySteps } from "@/lib/api";
import AppToaster from "@/components/ui/toaster";
import { getAuthUserServer } from "@/lib/authCookiesServer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "MyShaadiStore",
  description: "Wedding planning journey powered by admin-managed steps",
};

export default async function RootLayout({ children }) {
  let steps = [];
  let initialUser = null;

  try {
    steps = await fetchJourneySteps();
  } catch {
    steps = [];
  }
  try {
    initialUser = await getAuthUserServer();
  } catch {
    initialUser = null;
  }

  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${playfair.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,#fff7fa_0%,#f7f7fb_35%,#f4f4f8_100%)]">
          <SiteHeader steps={steps} initialUser={initialUser} />
          <AppToaster />
          <MainArea>{children}</MainArea>
          <SiteFooter steps={steps} />
          <SiteFooterMaroon steps={steps} />
          <a
            href="https://wa.me/919568559915?text=Hi%20MyShaadiStore"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_28px_rgba(37,211,102,0.35)] transition hover:scale-105 sm:bottom-6 sm:right-6"
          >
            <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
              <path d="M19.11 17.38c-.27-.14-1.59-.78-1.84-.87-.25-.09-.43-.14-.61.14s-.7.87-.86 1.05c-.16.18-.31.2-.58.07-.27-.14-1.12-.41-2.14-1.31-.79-.7-1.33-1.57-1.49-1.84-.16-.27-.02-.42.12-.56.13-.13.27-.31.41-.47.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.14-.61-1.48-.84-2.03-.22-.53-.44-.46-.61-.47l-.52-.01c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27s.97 2.63 1.11 2.81c.14.18 1.9 2.9 4.6 4.06.64.27 1.14.43 1.53.55.64.2 1.22.17 1.68.1.51-.08 1.59-.65 1.81-1.28.22-.63.22-1.16.16-1.28-.07-.12-.25-.2-.52-.34Z" />
              <path d="M16.03 3C8.83 3 3 8.82 3 16.01c0 2.54.73 5.02 2.12 7.15L3 29l6.03-2.05c2.07 1.13 4.4 1.73 6.99 1.73H16c7.2 0 13.03-5.82 13.03-13.01S23.2 3 16.03 3Zm0 23.45h-.01c-2.15 0-4.25-.58-6.08-1.69l-.43-.25-3.58 1.22 1.17-3.49-.28-.45a10.45 10.45 0 0 1-1.62-5.61c0-5.79 4.72-10.5 10.53-10.5 2.81 0 5.44 1.09 7.43 3.07a10.4 10.4 0 0 1 3.09 7.43c-.01 5.79-4.73 10.5-10.52 10.5Z" />
            </svg>
          </a>
        </div>
      </body>
    </html>
  );
}
