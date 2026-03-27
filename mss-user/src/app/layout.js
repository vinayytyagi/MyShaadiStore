import { Poppins } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { fetchJourneySteps } from "@/lib/api";
import AppToaster from "@/components/ui/toaster";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "MyShaadiStore",
  description: "Wedding planning journey powered by admin-managed steps",
};

export default async function RootLayout({ children }) {
  let steps = [];

  try {
    steps = await fetchJourneySteps();
  } catch {
    steps = [];
  }

  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7fa_0%,#f7f7fb_35%,#f4f4f8_100%)]">
          <SiteHeader steps={steps} />
          <AppToaster />
          {children}
        </div>
      </body>
    </html>
  );
}
