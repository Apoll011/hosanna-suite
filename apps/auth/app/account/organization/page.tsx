import { redirect } from "next/navigation";

/** Overview removed — land on org profile. */
export default function OrganizationIndexPage() {
  redirect("/account/organization/profile");
}
