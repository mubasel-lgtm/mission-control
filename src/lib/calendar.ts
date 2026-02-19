import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
let gogAvailable: boolean | null = null;

async function hasGogCli(): Promise<boolean> {
  if (gogAvailable !== null) return gogAvailable;
  try {
    await execAsync('command -v gog');
    gogAvailable = true;
  } catch {
    gogAvailable = false;
  }
  return gogAvailable;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  calendarId: string;
  isAllDay: boolean;
  url?: string;
}

export interface Calendar {
  id: string;
  name: string;
  color?: string;
  primary?: boolean;
}

/**
 * Fetch events from Google Calendar using gog CLI
 * Requires: gog CLI to be installed and authenticated (mubasel@petbloom.de)
 */
export async function fetchCalendarEvents(
  options?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }
): Promise<CalendarEvent[]> {
  try {
    if (!(await hasGogCli())) {
      return [];
    }

    // Build gog command with options
    let command = 'gog calendar events';
    
    if (options?.calendarId) {
      command += ` --calendar-id "${options.calendarId}"`;
    }
    if (options?.timeMin) {
      command += ` --time-min "${options.timeMin}"`;
    }
    if (options?.timeMax) {
      command += ` --time-max "${options.timeMax}"`;
    }
    if (options?.maxResults) {
      command += ` --max-results ${options.maxResults}`;
    }

    // Add JSON output flag if supported, otherwise parse text output
    command += ' --format json';

    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('warning')) {
      console.error('gog CLI stderr:', stderr);
    }

    // Parse JSON output
    const events = JSON.parse(stdout);
    return events.map((event: any) => ({
      id: event.id,
      title: event.summary || event.title || 'Untitled',
      description: event.description,
      startTime: event.start?.dateTime || event.start?.date,
      endTime: event.end?.dateTime || event.end?.date,
      location: event.location,
      attendees: event.attendees?.map((a: any) => a.email),
      calendarId: event.calendarId || options?.calendarId || 'primary',
      isAllDay: !!event.start?.date && !event.start?.dateTime,
      url: event.htmlLink || event.url,
    }));
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    // Return fallback data if gog CLI fails
    return getFallbackEvents();
  }
}

/**
 * Fetch available calendars
 */
export async function fetchCalendars(): Promise<Calendar[]> {
  try {
    if (!(await hasGogCli())) {
      return [{ id: 'primary', name: 'Primary', primary: true }];
    }

    const command = 'gog calendar list --format json';
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('warning')) {
      console.error('gog CLI stderr:', stderr);
    }

    const calendars = JSON.parse(stdout);
    return calendars.map((cal: any) => ({
      id: cal.id,
      name: cal.summary || cal.name,
      color: cal.color,
      primary: cal.primary || cal.id === 'primary',
    }));
  } catch (error) {
    console.error('Failed to fetch calendars:', error);
    return [
      { id: 'primary', name: 'Primary', primary: true },
      { id: 'work', name: 'Work', primary: false },
    ];
  }
}

/**
 * Get today's events
 */
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return fetchCalendarEvents({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
  });
}

/**
 * Get upcoming events (next 7 days)
 */
export async function fetchUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return fetchCalendarEvents({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults: 50,
  });
}

// Fallback data when gog CLI is not available
function getFallbackEvents(): CalendarEvent[] {
  const now = new Date();
  return [
    {
      id: 'evt-1',
      title: 'Mission Control Review',
      description: 'Weekly dashboard review',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      calendarId: 'primary',
      isAllDay: false,
    },
    {
      id: 'evt-2',
      title: 'Team Standup',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 24.5 * 60 * 60 * 1000).toISOString(),
      calendarId: 'work',
      isAllDay: false,
    },
  ];
}
