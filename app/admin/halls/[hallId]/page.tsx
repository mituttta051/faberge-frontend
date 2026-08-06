import { HallEditor } from "../hall-editor";

export default async function EditHallPage({ params }: { params: Promise<{ hallId: string }> }) {
  const { hallId } = await params;
  return <HallEditor hallId={Number(hallId)} />;
}
