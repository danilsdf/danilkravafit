import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const plans = await db.collection("MealPrepPlans").find({ isActive: true }).toArray();
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
