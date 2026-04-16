import { redirect } from "next/navigation";

// Root redirect → default locale
export default function RootPage() {
  redirect("/fr/demandes");
}
