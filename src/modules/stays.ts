// Stays - a hotel-booking company. Its metadata + three routes, each with zod schemas so the
// OpenAPI at /openapi.json is generated and real. `protect([scope])` guards and documents a route.
import { createRoute, z } from "@hono/zod-openapi";
import { defineCompany, json } from "../poppy/company.js";

const CURRENCY = "USD";

const ROOMS = [
  {
    id: "sea-view",
    name: "Sea View King",
    description: "King bed, sea-facing balcony.",
    pricePerNight: 240,
    available: true,
  },
  {
    id: "garden",
    name: "Garden Twin",
    description: "Two singles, opening onto the garden.",
    pricePerNight: 160,
    available: true,
  },
  {
    id: "loft",
    name: "Harbour Loft",
    description: "Top-floor loft over the harbour.",
    pricePerNight: 310,
    available: false,
  },
] as const;

// The valid room ids, so BookingRequest enumerates them and never drifts from ROOMS.
const ROOM_IDS = ROOMS.map((r) => r.id) as [string, ...string[]];

const Room = z
  .object({
    id: z.string().openapi({ example: "sea-view" }),
    name: z.string().openapi({ example: "Sea View King" }),
    description: z.string().openapi({ example: "King bed, sea-facing balcony." }),
    pricePerNight: z.number().openapi({ example: 240 }),
    currency: z.string().openapi({ example: "USD" }),
    available: z.boolean().openapi({ example: true }),
  })
  .openapi("Room");

const Booking = z
  .object({
    id: z.string().openapi({ example: "STY-7Q2K4M", description: "Confirmation id." }),
    room: z.string().openapi({ example: "sea-view" }),
    checkIn: z.string().openapi({ format: "date", example: "2026-02-01" }),
    nights: z.number().int().openapi({ example: 2 }),
    total: z.number().openapi({ example: 480 }),
    currency: z.string().openapi({ example: "USD" }),
    cancellation: z.string().openapi({ example: "Free cancellation until 24h before check-in." }),
  })
  .openapi("Booking");

const BookingRequest = z
  .object({
    room: z
      .enum(ROOM_IDS)
      .openapi({ example: "sea-view", description: "A room id from GET /rooms." }),
    checkIn: z.string().optional().openapi({ format: "date", example: "2026-02-01" }),
    nights: z.number().int().min(1).optional().openapi({ example: 2 }),
  })
  .openapi("BookingRequest");

const ErrorBody = z.object({ error: z.string(), error_description: z.string() }).openapi("Error");

const bookings = new Map<string, z.infer<typeof Booking>[]>(); // by User ID

export const stays = defineCompany(
  {
    host: process.env.STAYS_HOST ?? "stays.poppysandbox.dev",
    name: "Stays",
    brand: {
      tagline: "Rooms by the water",
      blurb: "A small collection of seaside rooms.",
      primary: "#0f766e",
      bg: "#faf7f1",
    },
    offerings: ROOMS.filter((r) => r.available).map((r) => ({
      name: r.name,
      detail: r.description,
      note: `$${r.pricePerNight} / night`,
    })),
    scopes: [
      {
        name: "stays:read",
        description: "See your Stays bookings.",
        changes: "none",
        personalData: true,
      },
      {
        name: "stays:write",
        description: "Book a room on your account. Each booking needs your approval.",
        changes: "irreversible",
        personalData: true,
      },
    ],
  },
  (app, protect) => {
    // Signed-out: search available rooms.
    app.openapi(
      createRoute({
        method: "get",
        path: "/rooms",
        summary: "Search available rooms.",
        ...protect(),
        responses: {
          200: json(z.object({ company: z.string(), rooms: z.array(Room) }), "Available rooms."),
        },
      }),
      (c) =>
        c.json(
          {
            company: "Stays",
            rooms: ROOMS.filter((r) => r.available).map((r) => ({ ...r, currency: CURRENCY })),
          },
          200,
        ),
    );

    // Signed-in: your bookings.
    app.openapi(
      createRoute({
        method: "get",
        path: "/stays",
        summary: "List your bookings.",
        ...protect(["stays:read"]),
        responses: {
          200: json(z.object({ user: z.string(), bookings: z.array(Booking) }), "Your bookings."),
        },
      }),
      (c) => {
        const user = c.get("user");
        return c.json({ user, bookings: bookings.get(user) ?? [] }, 200);
      },
    );

    // Signed-in: book a room.
    app.openapi(
      createRoute({
        method: "post",
        path: "/stays",
        summary: "Book a room.",
        ...protect(["stays:write"]),
        request: { body: json(BookingRequest, "Room and dates to book.") },
        responses: {
          201: json(z.object({ user: z.string(), booked: Booking }), "Booking confirmed."),
          400: json(ErrorBody, "Unknown or unavailable room."),
        },
      }),
      (c) => {
        const user = c.get("user");
        const body = c.req.valid("json");
        const room = ROOMS.find((r) => r.id === body.room && r.available);
        if (!room)
          return c.json(
            { error: "invalid_request", error_description: "Unknown or unavailable room." },
            400,
          );
        const nights = body.nights ?? 1;
        const booking = {
          id: `STY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          room: room.id,
          checkIn: body.checkIn ?? "2026-12-01",
          nights,
          total: room.pricePerNight * nights,
          currency: CURRENCY,
          cancellation: "Free cancellation until 24h before check-in.",
        };
        bookings.set(user, [...(bookings.get(user) ?? []), booking]);
        return c.json({ user, booked: booking }, 201);
      },
    );
  },
);
