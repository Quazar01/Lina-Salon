export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

export interface DayHours {
  day: Day;
  closed?: boolean;
  open?: string; // "HH:mm"
  close?: string; // "HH:mm"
}

export interface Status {
  isOpen: boolean;
  closesAt?: string;
  nextOpen?: { day: Day; time: string; when: 'today' | 'tomorrow' | 'later' };
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(time?: string): number | null {
  const m = time ? TIME.exec(time.trim()) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Weekday (0 = Monday) and minutes since midnight in the given time zone. */
export function zonedNow(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const dayIndex = DAYS.indexOf(get('weekday').slice(0, 3).toLowerCase() as Day);
  return { dayIndex, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function slot(hours: DayHours[], day: Day) {
  const h = hours.find((d) => d.day === day);
  if (!h || h.closed) return null;
  const open = toMinutes(h.open);
  const close = toMinutes(h.close);
  if (open === null || close === null || close <= open) return null;
  return { open, close, openText: h.open!.trim(), closeText: h.close!.trim() };
}

export function getStatus(hours: DayHours[], date = new Date(), timeZone = 'Europe/Brussels'): Status {
  const { dayIndex, minutes } = zonedNow(date, timeZone);
  const today = slot(hours, DAYS[dayIndex]);

  if (today && minutes >= today.open && minutes < today.close) {
    return { isOpen: true, closesAt: today.closeText };
  }

  // offset 7 = the same weekday next week (e.g. after closing on the only open day)
  for (let offset = 0; offset <= 7; offset++) {
    const day = DAYS[(dayIndex + offset) % 7];
    const s = slot(hours, day);
    if (!s || (offset === 0 && minutes >= s.open)) continue;
    const when = offset === 0 ? 'today' : offset === 1 ? 'tomorrow' : 'later';
    return { isOpen: false, nextOpen: { day, time: s.openText, when } };
  }

  return { isOpen: false };
}
