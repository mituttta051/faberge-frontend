import { halls } from "@/mocks/data";
import { HallView } from "./hall-view";

export function generateStaticParams() {
  return halls.map((h) => ({ hallId: String(h.id) }));
}

export default async function HallPage({ params }: { params: Promise<{ hallId: string }> }) {
  const { hallId } = await params;
  return <HallView hallId={Number(hallId)} />;
}
