/**
 * Sleep logs API - Create/list sleep logs
 * Triggers recovery recalculation on create
 */

import { createClient } from "@/lib/supabase/server";
import { triggerRecoveryRecalculation } from "@/lib/recoveryEngine/trigger";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("sleep_logs")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("sleep_date", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("sleep_logs")
    .insert({
      user_id: user.id,
      ...body,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await triggerRecoveryRecalculation(user.id).catch(() => {});

  return NextResponse.json(data);
}
