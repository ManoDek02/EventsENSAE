import { NextRequest, NextResponse } from "next/server";
import { errorResponse, notFound } from "@/lib/api-errors";
import { getEventById, serializeEvent } from "@/lib/events";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      throw notFound("Événement introuvable ou non publié.");
    }

    return NextResponse.json({ event: serializeEvent(event) });
  } catch (error) {
    return errorResponse(error);
  }
}
