import { exhibits } from "@/mocks/data";
import { ExhibitView } from "./exhibit-view";

export function generateStaticParams() {
  return exhibits.map((e) => ({ exhibitId: String(e.id) }));
}

export default async function ExhibitPage({ params }: { params: Promise<{ exhibitId: string }> }) {
  const { exhibitId } = await params;
  return <ExhibitView exhibitId={Number(exhibitId)} />;
}
