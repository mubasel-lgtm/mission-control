import { NextRequest, NextResponse } from 'next/server';
import { fetchTodayEvents, fetchUpcomingEvents } from '@/lib/calendar';

// Force dynamic rendering for API routes that use request.url
export const dynamic = 'force-dynamic';

// GET /api/calendar/events - Get calendar events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today'; // 'today', 'upcoming', 'week'
    
    let events;
    
    switch (range) {
      case 'today':
        events = await fetchTodayEvents();
        break;
      case 'week':
        events = await fetchUpcomingEvents(7);
        break;
      case 'upcoming':
      default:
        events = await fetchUpcomingEvents(14);
        break;
    }
    
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
