export function createGoogleCalendarUrl(opts: {
  title: string;
  description?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  attendees?: (string | null | undefined)[];
}): string {
  const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  const text = encodeURIComponent(opts.title || "Task Assignment");
  const details = encodeURIComponent(opts.description || "Task assigned in Kodewise WorkOS");

  const start = opts.startDate ? new Date(opts.startDate) : new Date();
  const end = opts.endDate ? new Date(opts.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const formatUtc = (d: Date) => {
    try {
      return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    } catch {
      return new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
    }
  };

  const dates = `${formatUtc(start)}/${formatUtc(end)}`;
  let url = `${baseUrl}&text=${text}&details=${details}&dates=${dates}`;

  const validAttendees = (opts.attendees || []).filter((a): a is string => Boolean(a && a.includes("@")));
  if (validAttendees.length > 0) {
    url += `&add=${encodeURIComponent(validAttendees.join(","))}`;
  }

  return url;
}
