import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to a default demo table
  redirect("/table/T1");
}
