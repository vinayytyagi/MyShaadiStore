import Image from "next/image";
import Link from "next/link";
import { Camera, Check, Landmark, Sparkles } from "lucide-react";

const cards = [
  {
    title: "Wedding Venues",
    points: [
      "Explore top wedding venues",
      "Compare prices and availability",
      "Find the perfect location for your big day",
    ],
    icon: Landmark,
  },
  {
    title: "Decor & Styling",
    points: [
      "Wedding themes & stage decor",
      "Floral setups & mandap design",
      "Customized decor ideas",
    ],
    icon: Sparkles,
  },
  {
    title: "Wedding Services",
    points: [
      "Photography & videography",
      "Bridal makeup & styling",
      "Catering, invitations & more",
    ],
    icon: Camera,
  },
];

export default function HomeWeddingShowcase() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f0f7_0%,#faeff4_50%,#f7e8ef_100%)] px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-[40px] font-semibold tracking-tight text-[#2f3058]">
          MyShaadiStore
        </p>
        <h2 className="mt-3 text-center text-4xl font-bold leading-tight text-[#30305a] sm:text-5xl">
          Shop Everything for Your Dream Wedding -{" "}
          <span className="text-[#ff4f86]">All in One Place</span>
        </h2>
        <p className="mx-auto mt-4 max-w-4xl text-center text-lg leading-8 text-[#4f5076]">
          Discover everything you need for your wedding - outfits, decor, venues, photography, makeup
          and more.
          <br />
          Choose individual services or shop complete wedding essentials with MyShaadiStore.
        </p>

        <div className="relative mt-14">
          <div className="relative z-10 grid gap-4 lg:grid-cols-3">
            {cards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_18px_46px_rgba(20,20,40,0.08)] backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-3xl font-semibold text-[#2f3058]">
                  <card.icon className="h-7 w-7 text-[#ff9b2f]" />
                  <h3>{card.title}</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-lg text-[#4f5076]">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffe6f0] text-[#ff4f86]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="pointer-events-none absolute -right-5 -top-24 hidden h-[600px] w-[460px] lg:block">
            <Image
              src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=1000&q=80"
              alt="Wedding couple"
              fill
              className="object-contain object-top-right"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-[#f7e8ef] to-transparent" />
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/journey"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ff4f86] px-12 py-4 text-3xl font-semibold text-white shadow-[0_14px_30px_rgba(255,79,134,0.35)] transition hover:bg-[#ff3d79]"
          >
            Begin Your Wedding Journey
            <span className="text-3xl">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
