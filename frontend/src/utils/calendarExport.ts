import { Note, Reminder } from '@/types';
import { stripHtmlTags } from './editorHelper';

/**
 * Utility to format Date to UTC iCalendar string (YYYYMMDDTHHMMSSZ)
 */
function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for iCalendar syntax (commas, semicolons, backslashes, newlines)
 */
function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Export a single or multiple notes with reminders to a standard .ics file
 */
export function exportNotesToIcs(
  notes: Note[],
  remindersByNote: Record<string, Reminder>,
  calendarTitle: string = 'Note on Web Reminders'
): boolean {
  if (typeof window === 'undefined') return false;

  const validItems = notes.filter((n) => Boolean(remindersByNote[n.id]));
  if (validItems.length === 0) return false;

  const nowStr = formatIcsDate(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Note on Web//SecureNote Reminders//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarTitle)}`,
    'X-WR-TIMEZONE:Asia/Bangkok',
  ];

  validItems.forEach((note) => {
    const reminder = remindersByNote[note.id];
    if (!reminder || !reminder.reminderDateTime) return;

    const startDate = new Date(reminder.reminderDateTime);
    if (isNaN(startDate.getTime())) return;

    // Default duration: 30 minutes
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const title = note.title || reminder.title || 'โน้ตเตือนความจำ';
    const cleanContent = stripHtmlTags(note.content || '');
    const noteUrl = `${window.location.origin}/notes/${note.id}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:reminder-${reminder.id || note.id}@noteonweb.com`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${formatIcsDate(startDate)}`);
    lines.push(`DTEND:${formatIcsDate(endDate)}`);
    lines.push(`SUMMARY:${escapeIcsText(title)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(`${cleanContent.slice(0, 300)}\n\nดูโน้ตฉบับเต็ม: ${noteUrl}`)}`);
    lines.push(`URL:${noteUrl}`);
    lines.push('STATUS:CONFIRMED');

    // Add Recurrence Rule if configured
    if (reminder.repeatRule && reminder.repeatRule !== 'none') {
      if (reminder.repeatRule === 'daily') {
        lines.push('RRULE:FREQ=DAILY');
      } else if (reminder.repeatRule === 'weekly') {
        lines.push('RRULE:FREQ=WEEKLY');
      } else if (reminder.repeatRule === 'monthly') {
        lines.push('RRULE:FREQ=MONTHLY');
      }
    }

    // Alarm / Notification Trigger
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT0M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${escapeIcsText(`⏰ เตือนความจำ: ${title}`)}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `note-reminders-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}
