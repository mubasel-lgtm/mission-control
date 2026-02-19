import { GET as syncGet } from '@/app/api/sync/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return syncGet(request as any);
}
