export const WEEKDAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export interface DeliverableTarget {
  name: string;
  value: number;
}

export type WeeklySchedule = Record<WeekdayKey, DeliverableTarget[]>;

export interface ClientMetadata {
  amc: boolean;
  seo: boolean;
  status: string;
  revamp: string;
  targets: DeliverableTarget[];
  weeklySchedule: WeeklySchedule;
  post: number;
  reel: number;
}

const DEFAULT_CLIENT_METADATA: ClientMetadata = {
  amc: false,
  seo: false,
  status: "Working",
  revamp: "None",
  targets: [],
  weeklySchedule: createEmptyWeeklySchedule(),
  post: 0,
  reel: 0,
};

export function normalizeTargetName(name: string | null | undefined): string {
  return (name || "").trim().toLowerCase();
}

export function createEmptyWeeklySchedule(): WeeklySchedule {
  return {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  };
}

export function normalizeTargets(
  targets: Array<Partial<DeliverableTarget>> | null | undefined
): DeliverableTarget[] {
  const counts = new Map<string, number>();

  for (const target of targets || []) {
    const name = normalizeTargetName(target.name);
    const value = Math.max(0, Math.floor(Number(target.value) || 0));

    if (!name || value <= 0) continue;
    counts.set(name, (counts.get(name) || 0) + value);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildWeeklyScheduleFromTargets(
  targets: Array<Partial<DeliverableTarget>> | null | undefined
): WeeklySchedule {
  const schedule = createEmptyWeeklySchedule();
  const normalizedTargets = normalizeTargets(targets);

  normalizedTargets.forEach((target, targetIndex) => {
    for (let i = 0; i < target.value; i++) {
      const dayKey = WEEKDAY_KEYS[(i + targetIndex) % WEEKDAY_KEYS.length];
      const dayEntries = schedule[dayKey];
      const existing = dayEntries.find((entry) => entry.name === target.name);

      if (existing) {
        existing.value += 1;
      } else {
        dayEntries.push({ name: target.name, value: 1 });
      }
    }
  });

  return schedule;
}

export function scheduleToTargets(schedule: WeeklySchedule): DeliverableTarget[] {
  const collected: DeliverableTarget[] = [];

  for (const dayKey of WEEKDAY_KEYS) {
    for (const entry of schedule[dayKey] || []) {
      collected.push(entry);
    }
  }

  return normalizeTargets(collected);
}

function normalizeScheduleDayEntries(value: unknown): DeliverableTarget[] {
  if (Array.isArray(value)) {
    return normalizeTargets(value as Array<Partial<DeliverableTarget>>);
  }

  if (value && typeof value === "object") {
    return normalizeTargets(
      Object.entries(value as Record<string, unknown>).map(([name, count]) => ({
        name,
        value: Number(count) || 0,
      }))
    );
  }

  return [];
}

export function normalizeWeeklySchedule(
  schedule: unknown,
  fallbackTargets: Array<Partial<DeliverableTarget>> | null | undefined = []
): WeeklySchedule {
  if (!schedule || typeof schedule !== "object") {
    return buildWeeklyScheduleFromTargets(fallbackTargets);
  }

  const normalized = createEmptyWeeklySchedule();

  for (const dayKey of WEEKDAY_KEYS) {
    normalized[dayKey] = normalizeScheduleDayEntries(
      (schedule as Partial<Record<WeekdayKey, unknown>>)[dayKey]
    );
  }

  const hasAnyEntries = WEEKDAY_KEYS.some((dayKey) => normalized[dayKey].length > 0);
  return hasAnyEntries ? normalized : buildWeeklyScheduleFromTargets(fallbackTargets);
}

export function parseClientNotes(notes: string | null | undefined): ClientMetadata {
  if (!notes) {
    return { ...DEFAULT_CLIENT_METADATA };
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    const legacyTargets: DeliverableTarget[] = [
      { name: "post", value: Number(parsed.post) || 0 },
      { name: "reel", value: Number(parsed.reel) || 0 },
      parsed.customTargetName && (Number(parsed.customTargetValue) || 0) > 0
        ? {
            name: String(parsed.customTargetName),
            value: Number(parsed.customTargetValue) || 0,
          }
        : null,
    ].filter(Boolean) as DeliverableTarget[];

    const targets = normalizeTargets(
      Array.isArray(parsed.targets) ? (parsed.targets as Array<Partial<DeliverableTarget>>) : legacyTargets
    );
    const weeklySchedule = normalizeWeeklySchedule(parsed.weeklySchedule, targets);
    const weeklyTotals = scheduleToTargets(weeklySchedule);

    return {
      amc: Boolean(parsed.amc),
      seo: Boolean(parsed.seo),
      status: typeof parsed.status === "string" ? parsed.status : DEFAULT_CLIENT_METADATA.status,
      revamp: typeof parsed.revamp === "string" ? parsed.revamp : DEFAULT_CLIENT_METADATA.revamp,
      targets: weeklyTotals.length > 0 ? weeklyTotals : targets,
      weeklySchedule,
      post:
        weeklyTotals.find((target) => target.name === "post")?.value ||
        targets.find((target) => target.name === "post")?.value ||
        0,
      reel:
        weeklyTotals.find((target) => target.name === "reel")?.value ||
        targets.find((target) => target.name === "reel")?.value ||
        0,
    };
  } catch {
    return { ...DEFAULT_CLIENT_METADATA };
  }
}

export function serializeClientNotes(
  metadata: Partial<ClientMetadata> & {
    targets?: Array<Partial<DeliverableTarget>>;
    weeklySchedule?: WeeklySchedule;
  }
): string {
  const targets = normalizeTargets(metadata.targets);
  const weeklySchedule = normalizeWeeklySchedule(metadata.weeklySchedule, targets);
  const weeklyTotals = scheduleToTargets(weeklySchedule);
  const finalTargets = weeklyTotals.length > 0 ? weeklyTotals : targets;

  return JSON.stringify({
    amc: Boolean(metadata.amc),
    seo: Boolean(metadata.seo),
    status: metadata.status || DEFAULT_CLIENT_METADATA.status,
    revamp: metadata.revamp || DEFAULT_CLIENT_METADATA.revamp,
    targets: finalTargets,
    weeklySchedule,
    post: finalTargets.find((target) => target.name === "post")?.value || 0,
    reel: finalTargets.find((target) => target.name === "reel")?.value || 0,
  });
}

export function getScheduleTypes(
  schedule: WeeklySchedule,
  fallbackTargets: Array<Partial<DeliverableTarget>> | null | undefined = []
): string[] {
  const typeSet = new Set<string>();

  for (const target of normalizeTargets(fallbackTargets)) {
    typeSet.add(target.name);
  }

  for (const dayKey of WEEKDAY_KEYS) {
    for (const entry of schedule[dayKey] || []) {
      typeSet.add(entry.name);
    }
  }

  return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
}
