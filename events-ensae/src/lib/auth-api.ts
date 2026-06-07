import { auth } from "@/lib/auth";
import { unauthorized } from "@/lib/api-errors";

export async function requireApiAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw unauthorized();
  }

  return session;
}
