"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { showDismissibleToast } from "@/lib/utils/toast-helpers";
import { api } from "@/lib/api-client";

export interface PendingEvent {
  id: string;
  title: string;
  eventCode: string;
  type: string;
  updatedAt: string;
}

export interface PendingOrganizer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function useAdminAlerts({ enabled = true, showToasts = true }: { enabled?: boolean; showToasts?: boolean } = {}) {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganizer[]>([]);

  // Every ID we have ever seen — used to diff and only toast genuinely new arrivals
  const knownIdsRef = useRef<Set<string>>(new Set());
  // Seed on first fetch so we never toast items that were already pending at login
  const isInitialFetchRef = useRef(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const [eventsRes, usersRes] = await Promise.allSettled([
        api.get("/events/admin/all?status=PENDING_REVIEW&limit=100"),
        api.get("/users"),
      ]);

      const rawEvents: any[] =
        eventsRes.status === "fulfilled"
          ? Array.isArray(eventsRes.value)
            ? eventsRes.value
            : eventsRes.value?.data ?? []
          : [];

      const allUsers: any[] =
        usersRes.status === "fulfilled"
          ? Array.isArray(usersRes.value)
            ? usersRes.value
            : usersRes.value?.data ?? []
          : [];

      const mappedEvents: PendingEvent[] = rawEvents.map((e: any) => ({
        id: String(e._id || e.id),
        title: e.title || "Untitled Event",
        eventCode: e.eventCode || e._id || e.id,
        type: e.type || "VOTING",
        updatedAt: e.updatedAt || e.createdAt || new Date().toISOString(),
      }));

      const mappedOrgs: PendingOrganizer[] = allUsers
        .filter((u: any) => u.role === "ORGANIZER" && u.status === "PENDING")
        .map((u: any) => ({
          id: String(u._id || u.id),
          name: u.businessName || u.fullName || u.name || "New Organizer",
          email: u.email || "",
          createdAt: u.createdAt || new Date().toISOString(),
        }));

      setPendingEvents(mappedEvents);
      setPendingOrgs(mappedOrgs);

      // Build a unified list for diffing
      type AlertItem = { id: string; kind: "event" | "organizer"; label: string };
      const current: AlertItem[] = [
        ...mappedEvents.map((e) => ({ id: e.id, kind: "event" as const, label: e.title })),
        ...mappedOrgs.map((o) => ({ id: o.id, kind: "organizer" as const, label: o.name })),
      ];

      if (isInitialFetchRef.current) {
        current.forEach((a) => knownIdsRef.current.add(a.id));
        isInitialFetchRef.current = false;
      } else {
        const brandNew = current.filter((a) => !knownIdsRef.current.has(a.id));
        brandNew.forEach((a) => {
          knownIdsRef.current.add(a.id);
          if (showToasts) {
            if (a.kind === "event") {
              showDismissibleToast(`New event submitted for review — ${a.label}`, { icon: "📋" });
            } else {
              showDismissibleToast(`New organizer registration — ${a.label}`, { icon: "👤" });
            }
          }
        });
      }
    } catch {
      // Admin alerts fetch failed silently
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(interval);
  }, [enabled, fetchAlerts]);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("adminAlertsReadIds");
        if (stored) return new Set(JSON.parse(stored));
      } catch (e) {}
    }
    return new Set();
  });

  // Sync to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminAlertsReadIds", JSON.stringify([...readIds]));
    }
  }, [readIds]);

  // Clean up stale readIds (IDs that are no longer pending)
  useEffect(() => {
    if (pendingEvents.length === 0 && pendingOrgs.length === 0) return;
    setReadIds((prev) => {
      const currentIds = new Set([
        ...pendingEvents.map(e => e.id),
        ...pendingOrgs.map(o => o.id)
      ]);
      const next = new Set([...prev].filter(id => currentIds.has(id)));
      if (next.size !== prev.size) {
        return next;
      }
      return prev;
    });
  }, [pendingEvents, pendingOrgs]);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      pendingEvents.forEach((e) => next.add(e.id));
      pendingOrgs.forEach((o) => next.add(o.id));
      return next;
    });
  }, [pendingEvents, pendingOrgs]);

  const visibleEvents = pendingEvents.filter((e) => !readIds.has(e.id));
  const visibleOrgs = pendingOrgs.filter((o) => !readIds.has(o.id));

  return {
    pendingEvents: visibleEvents,
    pendingOrgs: visibleOrgs,
    pendingEventsCount: visibleEvents.length,
    pendingOrganizersCount: visibleOrgs.length,
    pendingCount: visibleEvents.length + visibleOrgs.length,
    markAllAsRead,
  };
}
