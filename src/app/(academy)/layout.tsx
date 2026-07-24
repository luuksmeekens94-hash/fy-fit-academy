import { AcademyAppShell } from "@/components/academy/academy-app-shell";
import { requireUser } from "@/lib/auth";
import { getNotificationCenterForUser } from "@/lib/notification-queries";

export default async function AcademyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const notificationCenter = await getNotificationCenterForUser(user);

  return (
    <AcademyAppShell
      user={{
        name: user.name,
        role: user.role,
        isOnboarding: user.isOnboarding,
      }}
      unreadCount={notificationCenter.unreadCount}
      hasCriticalNotification={notificationCenter.hasCritical}
    >
      {children}
    </AcademyAppShell>
  );
}
