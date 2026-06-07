import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-errors";
import { filterEvents, getPublishedEvents, serializeEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;

    const events = await getPublishedEvents();
    const filtered = filterEvents(events, query, category);

    return NextResponse.json({
      events: filtered.map(serializeEvent),
      total: filtered.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
