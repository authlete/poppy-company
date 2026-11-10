// Stays - a hotel-booking company. Its metadata + three routes, each with zod schemas so the
// OpenAPI at /openapi.json is generated and real. `protect([scope])` guards and documents a route.
import { createRoute, z } from "@hono/zod-openapi";
import { defineCompany, json } from "../poppy/company.js";

const Room = z
  .object({
    id: z.string(),
    name: z.string(),
    pricePerNight: z.number(),
    available: z.boolean(),
  })
  .openapi("Room");

const Booking = z
  .object({
    room: z.string(),
    checkIn: z.string(),
    nights: z.number(),
    total: z.number(),
  })
  .openapi("Booking");

const BookingRequest = z
  .object({
    room: z.string(),
    checkIn: z.string().optional(),
    nights: z.number().optional(),
  })
  .openapi("BookingRequest");

const ErrorBody = z.object({ error: z.string(), error_description: z.string() }).openapi("Error");

const ROOMS = [
  { id: "sea-view", name: "Sea View King", pricePerNight: 240, available: true },
  { id: "garden", name: "Garden Twin", pricePerNight: 160, available: true },
  { id: "loft", name: "Harbour Loft", pricePerNight: 310, available: false },
];

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
      {
        name: "poppy:browser-sign-in",
        description: "Use Stays signed in, with the other access you approve.",
        changes: "none",
        personalData: false,
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
      (c) => c.json({ company: "Stays", rooms: ROOMS.filter((r) => r.available) }, 200),
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
          room: room.id,
          checkIn: body.checkIn ?? "2026-12-01",
          nights,
          total: room.pricePerNight * nights,
        };
        bookings.set(user, [...(bookings.get(user) ?? []), booking]);
        return c.json({ user, booked: booking }, 201);
      },
    );
  },
);
