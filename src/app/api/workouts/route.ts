/**
 * Workouts API - Create/list workouts
 * Triggers recovery recalculation on create
 */

import { createClient } from "@/lib/supabase/server";
import { triggerRecoveryRecalculation } from "@/lib/recovery/trigger";
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
    .from("workouts")
    .select("*, workout_exercises(*), workout_muscle_groups(*)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("workout_date", { ascending: false })
    .limit(50);

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
  const { exercises, muscle_groups, ...workoutData } = body;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      ...workoutData,
    })
    .select()
    .single();

  if (workoutError) {
    return NextResponse.json({ error: workoutError.message }, { status: 500 });
  }

  if (exercises?.length) {
    await supabase.from("workout_exercises").insert(
      exercises.map((e: Record<string, unknown>) => ({
        workout_id: workout.id,
        user_id: user.id,
        ...e,
      }))
    );
  }
  if (muscle_groups?.length) {
    await supabase.from("workout_muscle_groups").insert(
      muscle_groups.map((m: Record<string, unknown>) => ({
        workout_id: workout.id,
        user_id: user.id,
        ...m,
      }))
    );
  }

  await triggerRecoveryRecalculation(user.id).catch(() => {});

  return NextResponse.json(workout);
}
