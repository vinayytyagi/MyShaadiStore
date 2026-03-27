import { notFound } from "next/navigation";
import JourneyStepPage from "@/components/JourneyStepPage";
import { fetchItems, fetchJourneyStep, fetchJourneySteps, fetchStepCategories } from "@/lib/api";

export default async function JourneySlugPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  let step;
  try {
    step = await fetchJourneyStep(slug);
  } catch {
    notFound();
  }

  const category = resolvedSearchParams?.category || "";
  const search = resolvedSearchParams?.search || "";

  const [steps, categories, itemsRes] = await Promise.all([
    fetchJourneySteps(),
    fetchStepCategories(slug),
    fetchItems({ journeyStepId: step.step_id }),
  ]);

  return (
    <main>
      <JourneyStepPage
        steps={steps}
        step={step}
        categories={categories}
        items={itemsRes.items || []}
        selectedCategoryId={category}
        search={search}
      />
    </main>
  );
}
