import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getNotificationCenterForUser } from "@/lib/notification-queries";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const notificationCenter = await getNotificationCenterForUser(user);

  return <AppShell user={user} notificationCenter={notificationCenter}>{children}</AppShell>;
}
