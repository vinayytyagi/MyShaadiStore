const steps = [
  "Choose your journey step from the admin-driven wedding flow.",
  "Browse categories and curated vendor items for that stage.",
  "Compare options, track progress, and keep building your basket.",
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff4f86]">How it works</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-700">
          Plan every wedding moment step by step
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          MyShaadiStore is driven entirely by the journey steps, categories, and items created from the
          admin panel. This page explains the user flow in one place.
        </p>

        <div className="mt-10 grid gap-5">
          {steps.map((item, index) => (
            <div
              key={item}
              className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ff4f86] font-bold text-white">
                {index + 1}
              </div>
              <p className="pt-2 text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
