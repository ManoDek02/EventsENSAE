import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "Une erreur interne est survenue." },
    { status: 500 }
  );
}

export function unauthorized(message = "Non authentifié.") {
  return new ApiError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Accès refusé.") {
  return new ApiError(403, message, "FORBIDDEN");
}

export function notFound(message = "Ressource introuvable.") {
  return new ApiError(404, message, "NOT_FOUND");
}

export function badRequest(message: string, code?: string) {
  return new ApiError(400, message, code);
}
