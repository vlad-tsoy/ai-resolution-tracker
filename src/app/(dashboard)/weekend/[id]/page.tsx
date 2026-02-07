import { notFound } from "next/navigation";
import { getWeekendById } from "@/lib/queries";
import { WeekendDetail } from "@/components/weekend/weekend-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const weekendId = parseInt(id);
  if (isNaN(weekendId)) return { title: "Not Found" };
  const weekend = await getWeekendById(weekendId);
  return {
    title: weekend
      ? `Weekend ${weekend.number}: ${weekend.name}`
      : "Not Found",
  };
}

export default async function WeekendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const weekendId = parseInt(id);

  if (isNaN(weekendId)) {
    notFound();
  }

  const weekend = await getWeekendById(weekendId);

  if (!weekend) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <WeekendDetail weekend={weekend} />
    </main>
  );
}
