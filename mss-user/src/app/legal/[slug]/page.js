import Link from "next/link";
import { notFound } from "next/navigation";

const COPY = {
  privacy: {
    title: "Privacy Policy",
    body: "We respect your privacy. This page will soon include full details on how we collect, use, and protect your personal information when you use MyShaadiStore.",
  },
  terms: {
    title: "Terms of Service",
    body: "These terms govern your use of MyShaadiStore. A complete version of this document is being prepared. For questions, please contact us via WhatsApp from the website footer.",
  },
  refund: {
    title: "Refund Policy",
    body: "Refund and cancellation rules depend on your order type and payment status. We are publishing a detailed policy here shortly. If you need help with an existing order, open My Orders or reach out on WhatsApp.",
  },
};

export function generateStaticParams() {
  return [{ slug: "privacy" }, { slug: "terms" }, { slug: "refund" }];
}

export default async function LegalPage({ params }) {
  const { slug } = await params;
  const doc = COPY[slug];
  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm font-semibold text-[#ff4f86] hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-800">{doc.title}</h1>
      <p className="mt-6 text-base leading-relaxed text-slate-600">{doc.body}</p>
    </main>
  );
}
