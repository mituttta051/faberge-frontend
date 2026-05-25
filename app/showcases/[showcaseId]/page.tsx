import { showcases } from "@/mocks/data";
import { ShowcaseView } from "./showcase-view";

export function generateStaticParams() {
  return showcases.map((s) => ({ showcaseId: String(s.id) }));
}

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ showcaseId: string }>;
}) {
  const { showcaseId } = await params;
  return <ShowcaseView showcaseId={Number(showcaseId)} />;
}
