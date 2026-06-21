import { redirect } from "next/navigation";

// The Clarity Output was merged into the Pattern page (the verdict + "what to do
// next" now live there once the exploration goal is reached). Keep this route as
// a redirect so old links/bookmarks still work.
export default function ClarityPage() {
  redirect("/dashboard/pattern");
}
