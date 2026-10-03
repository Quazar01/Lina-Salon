import { describe, expect, it } from 'vitest';
import { getStatus, type DayHours } from '../src/lib/hours';

const week: DayHours[] = [
  { day: 'mon', closed: true },
  { day: 'tue', open: '09:30', close: '18:30' },
  { day: 'wed', open: '09:30', close: '18:30' },
  { day: 'thu', open: '09:30', close: '18:30' },
  { day: 'fri', open: '09:30', close: '19:00' },
  { day: 'sat', open: '09:00', close: '17:00' },
  { day: 'sun', closed: true },
];

// October 2026 is CEST (UTC+2) until the 25th. Tue 6 Oct 2026.
const brussels = (isoLocal: string) => new Date(`${isoLocal}+02:00`);

describe('getStatus', () => {
  it('is open during opening hours and reports closing time', () => {
    expect(getStatus(week, brussels('2026-10-06T10:00:00'))).toEqual({
      isOpen: true,
      closesAt: '18:30',
    });
  });

  it('treats the opening minute as open and the closing minute as closed', () => {
    expect(getStatus(week, brussels('2026-10-06T09:30:00')).isOpen).toBe(true);
    expect(getStatus(week, brussels('2026-10-06T18:30:00')).isOpen).toBe(false);
  });

  it('before opening: next opening is today', () => {
    expect(getStatus(week, brussels('2026-10-06T08:15:00'))).toEqual({
      isOpen: false,
      nextOpen: { day: 'tue', time: '09:30', when: 'today' },
    });
  });

  it('after closing: next opening is tomorrow', () => {
    expect(getStatus(week, brussels('2026-10-06T19:00:00')).nextOpen).toEqual({
      day: 'wed',
      time: '09:30',
      when: 'tomorrow',
    });
  });

  it('skips closed days and wraps around the week', () => {
    // Saturday evening -> Sunday & Monday closed -> Tuesday
    expect(getStatus(week, brussels('2026-10-10T18:00:00')).nextOpen).toEqual({
      day: 'tue',
      time: '09:30',
      when: 'later',
    });
    // Monday just after midnight -> Tuesday is tomorrow
    expect(getStatus(week, brussels('2026-10-12T00:00:00')).nextOpen).toEqual({
      day: 'tue',
      time: '09:30',
      when: 'tomorrow',
    });
  });

  it('uses Brussels time regardless of the Date given in UTC', () => {
    // 08:00 UTC = 10:00 in Brussels (CEST)
    expect(getStatus(week, new Date('2026-10-06T08:00:00Z')).isOpen).toBe(true);
    // Winter time: 8 Dec 2026 08:00 UTC = 09:00 CET -> not yet open
    expect(getStatus(week, new Date('2026-12-08T08:00:00Z')).isOpen).toBe(false);
  });

  it('finds the same weekday next week when only one day is open', () => {
    const onlyTue: DayHours[] = [{ day: 'tue', open: '09:30', close: '18:30' }];
    expect(getStatus(onlyTue, brussels('2026-10-06T19:00:00')).nextOpen).toEqual({
      day: 'tue',
      time: '09:30',
      when: 'later',
    });
  });

  it('handles a week with no valid opening hours', () => {
    const closed: DayHours[] = [
      { day: 'mon', closed: true },
      { day: 'tue', open: 'bad', close: '18:00' },
    ];
    expect(getStatus(closed, brussels('2026-10-06T10:00:00'))).toEqual({ isOpen: false });
  });
});
