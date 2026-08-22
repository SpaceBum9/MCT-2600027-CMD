export type ScheduleContext = "work" | "home" | "agentic" | "personal";

export type CalendarEventInput = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string | null;
  description?: string | null;
};

export type AgenticScheduleItem = {
  source: "google-calendar";
  sourceId: string;
  title: string;
  start: string;
  end: string;
  location: string | null;
  contexts: ScheduleContext[];
  delivery: "prepared" | "verified";
};

function inferContexts(event: CalendarEventInput): ScheduleContext[] {
  const haystack = `${event.title} ${event.location ?? ""} ${event.description ?? ""}`.toLowerCase();
  const contexts = new Set<ScheduleContext>();

  if (haystack.includes("arbeit") || haystack.includes("stadthalle")) contexts.add("work");
  if (haystack.includes("agentic") || haystack.includes("agent")) contexts.add("agentic");
  if (haystack.includes("home") || haystack.includes("zuhause") || haystack.includes("zu hause")) contexts.add("home");
  if (contexts.size === 0) contexts.add("personal");

  return [...contexts];
}

export function normalizeCalendarEvent(event: CalendarEventInput): AgenticScheduleItem {
  return {
    source: "google-calendar",
    sourceId: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    location: event.location ?? null,
    contexts: inferContexts(event),
    delivery: "prepared",
  };
}

export function buildAgenticSchedule(events: readonly CalendarEventInput[]): AgenticScheduleItem[] {
  return events
    .map(normalizeCalendarEvent)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export type SchedulerSyncSnapshot = {
  timezone: "Europe/Berlin";
  source: "google-calendar";
  target: "grok-agentic-scheduler";
  status: "prepared" | "verified";
  items: AgenticScheduleItem[];
};

export function buildSchedulerSyncSnapshot(
  events: readonly CalendarEventInput[],
  verifiedDelivery = false,
): SchedulerSyncSnapshot {
  return {
    timezone: "Europe/Berlin",
    source: "google-calendar",
    target: "grok-agentic-scheduler",
    status: verifiedDelivery ? "verified" : "prepared",
    items: buildAgenticSchedule(events).map((item) => ({
      ...item,
      delivery: verifiedDelivery ? "verified" : "prepared",
    })),
  };
}
