import { notFound } from "next/navigation";
import { ReviewEditor } from "@/components/review/ReviewEditor";
import routes from "@/components/review/routes.json";

export const metadata = { title: "Site Review Editor", robots: { index: false, follow: false } };
export default function ReviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ReviewEditor routes={routes} />;
}
