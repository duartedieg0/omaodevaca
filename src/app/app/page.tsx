import { redirect } from "next/navigation";

import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/safe-redirect";

export default function AppIndexPage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
