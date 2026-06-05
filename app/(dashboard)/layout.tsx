"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import { getNavigationForRole } from "@/lib/navigation";
import { OrganizerStatusBanner } from "@/components/organizer/OrganizerStatusBanner";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";

export default function UnifiedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/sign-in");
    },
  });

  const role = session?.user?.role;

  // Both hooks are called unconditionally (rules of hooks).
  // The enabled flag makes each a no-op when it isn't the active role.
  const { unreadCount } = useNotifications({ enabled: role === "ORGANIZER", showToasts: false });
  const { pendingEventsCount, pendingOrganizersCount } = useAdminAlerts({
    enabled: role === "ADMIN" || role === "SUPER_ADMIN",
    showToasts: false,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Only staff roles are allowed in the dashboard
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "ORGANIZER") {
    redirect("/");
  }

  const navigation = getNavigationForRole(role).map((section) => ({
    ...section,
    items: section.items.map((item) => {
      // ORGANIZER — badge the personal notifications bell (if it's ever added to their nav)
      if (
        role === "ORGANIZER" &&
        (item.name === "Notifications" || item.href === "/dashboard/notifications")
      ) {
        return { ...item, badge: unreadCount > 0 ? unreadCount : undefined };
      }

      // ADMIN — badge "Pending Approvals" with combined pending count
      if (role === "ADMIN" && item.name === "Pending Approvals") {
        const total = pendingEventsCount + pendingOrganizersCount;
        return { ...item, badge: total > 0 ? total : undefined };
      }

      // ADMIN & SUPER_ADMIN — split badges: events on "All Events", orgs on "Organizers"
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        if (item.name === "All Events") {
          return {
            ...item,
            badge: pendingEventsCount > 0 ? pendingEventsCount : undefined,
          };
        }
        if (item.name === "Organizers") {
          return {
            ...item,
            badge: pendingOrganizersCount > 0 ? pendingOrganizersCount : undefined,
          };
        }
      }

      return item;
    }),
  }));

  const portalName =
    role === "SUPER_ADMIN" || role === "ADMIN" ? "Admin Portal" : "Organizer Portal";

  return (
    <DashboardLayout
      navigation={navigation}
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.avatar,
      }}
      portalName={portalName}
      profileUrl="/dashboard/account"
      settingsUrl="/dashboard/settings"
    >
      {role === "ORGANIZER" && <OrganizerStatusBanner />}
      {children}
    </DashboardLayout>
  );
}
