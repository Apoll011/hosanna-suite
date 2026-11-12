import { env } from "@/lib/config/env";
import { runAgendaReminders } from "@/lib/cron/agendaReminder.service";

function requireCronSecret(req: Request) {
  if (!env.cronSecret) {
    return Response.json({ error: "CRON_SECRET not configured." }, { status: 403 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return Response.json({ error: "Invalid cron secret." }, { status: 403 });
  }
  return null;
}

async function handle(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const result = await runAgendaReminders();
  return Response.json(result);
}

/** GET|POST /api/cron/agenda-reminders */
export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
