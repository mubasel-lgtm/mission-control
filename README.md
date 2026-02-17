# Mission Control Dashboard

Central command center for project management with Todoist and Google Calendar integration.

![Mission Control Dashboard](https://via.placeholder.com/800x400?text=Mission+Control+Dashboard)

## Features

- 📊 **Dashboard Overview** - Real-time stats on projects, tasks, events, blockers, research, and bots
- ✅ **Todoist Integration** - Live sync of tasks with priority mapping
- 📅 **Google Calendar** - Display today's events and upcoming schedule
- 🚫 **Needs Mubasel** - Track blockers that need attention
- 📚 **Research Queue** - Manage research items and topics
- 🤖 **Claude Bot Manager** - Monitor and control automation bots
- 🔄 **Real-time Sync** - Webhook support for instant updates
- 💾 **SQLite Database** - Persistent local storage

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- `gog` CLI installed and authenticated with Google (mubasel@petbloom.de)

### Installation

```bash
# Navigate to project
cd /Users/mubasel/.openclaw/workspace/mission-control

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env.local` file (optional - defaults are provided):

```env
# Todoist API Token (provided)
TODOIST_API_TOKEN=db85fc7c526a7bd2d575f44a4293ef7ff70fa1ca

# Optional: Webhook secret for Todoist
TODOIST_WEBHOOK_SECRET=your_webhook_secret
```

### Todoist Webhook Setup (Optional)

For real-time updates:

1. Go to Todoist App Management Console
2. Create a new app or use existing
3. Set webhook URL to: `https://your-domain.com/api/webhooks/todoist`
4. Subscribe to events: `item:added`, `item:updated`, `item:completed`, `item:deleted`

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project

### Tasks
- `GET /api/tasks` - List tasks (use `?sync=true` to sync with Todoist)
- `POST /api/tasks` - Create a new task

### Calendar
- `GET /api/calendar/events?range=today` - Get today's events
- `GET /api/calendar/events?range=week` - Get week's events

### Blockers (Needs Mubasel)
- `GET /api/blockers` - List blockers
- `POST /api/blockers` - Create a new blocker

### Research Queue
- `GET /api/research` - List research items
- `POST /api/research` - Add research item

### Bot Manager
- `GET /api/bots` - List bots with logs
- `POST /api/bots` - Create or update a bot

### Sync
- `POST /api/sync` - Trigger full sync with external services
- `GET /api/sync/status` - Get sync status

### Webhooks
- `POST /api/webhooks/todoist` - Receive Todoist webhooks

## Database Schema

The SQLite database (`data/mission-control.db`) includes:

- **projects** - Active projects with status, priority, and progress
- **tasks** - Tasks synced from Todoist
- **blockers** - Items needing attention
- **research** - Research queue items
- **bots** - Claude bot configurations
- **bot_logs** - Bot activity logs
- **sync_metadata** - Last sync timestamps

## Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── page.tsx          # Dashboard UI
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   ├── lib/
│   │   ├── db.ts             # Database connection
│   │   ├── todoist.ts        # Todoist API client
│   │   ├── calendar.ts       # Google Calendar client
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── index.ts          # TypeScript definitions
├── data/                     # SQLite database (created on first run)
├── public/                   # Static assets
└── package.json
```

## Usage

### Dashboard

The main dashboard displays:
- **Stats Overview** - Active projects, pending tasks, today's events, blockers, research queue, active bots
- **Projects** - Active projects with progress bars
- **Tasks** - Recent pending tasks from Todoist
- **Calendar** - Today's scheduled events
- **Needs Mubasel** - Open blockers requiring attention
- **Research Queue** - Pending and in-progress research
- **Claude Bot Manager** - Bot status and controls

### Sync

- **Auto-sync**: Dashboard refreshes every 5 minutes
- **Manual sync**: Click the "Sync" button in the header
- **Real-time**: Configure Todoist webhooks for instant updates

### Adding Data

Use the `+` buttons in each section to add new:
- Projects
- Tasks
- Blockers
- Research items

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Initialize database
npm run db:init
```

## Troubleshooting

### Database Issues

If you encounter database errors:
```bash
# Delete the database to reset
rm -rf data/

# Restart the server - it will recreate with sample data
npm run dev
```

### Todoist Sync Issues

- Check API token is valid
- Verify network connectivity
- Check browser console for errors

### Calendar Sync Issues

- Ensure `gog` CLI is installed: `which gog`
- Verify authentication: `gog auth status`
- Re-authenticate if needed: `gog auth login`

## Customization

### Adding New Sections

1. Create API route in `src/app/api/new-section/route.ts`
2. Add database table in `src/lib/db.ts`
3. Create UI component in dashboard
4. Update types in `src/types/index.ts`

### Theming

Modify `src/app/globals.css` to change colors:
- CSS variables control the dark theme
- Tailwind config extends the color palette

## License

MIT - Personal use only

## Credits

Built for Mubasel's personal productivity system.
