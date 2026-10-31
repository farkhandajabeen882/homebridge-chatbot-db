import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";

type Rule = {
  intent: string;
  keywords: string[];
  reply: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { reply: "Please send a valid message." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("message" in body) ||
    typeof body.message !== "string"
  ) {
    return NextResponse.json(
      { reply: "Please type a message first." },
      { status: 400 },
    );
  }

  const message = body.message.trim();

  if (!message || message.length > 500) {
    return NextResponse.json(
      {
        reply: "Please enter a message between 1 and 500 characters.",
      },
      { status: 400 },
    );
  }

  try {
    const sql = getDb();

    const rows = await sql`
      SELECT intent, keywords, reply
      FROM public.rules
      ORDER BY priority ASC, id ASC
    `;

    const rules = rows as Rule[];
    const normalizedMessage = ` ${normalize(message)} `;

    const matchedRule = rules.find((rule) =>
      rule.keywords.some((keyword) => {
        const normalizedKeyword = normalize(keyword);

        return (
          normalizedKeyword.length > 0 &&
          normalizedMessage.includes(` ${normalizedKeyword} `)
        );
      }),
    );

    const reply =
      matchedRule?.reply ??
      "I could not match that question.\n\n" +
        "Please ask about renting, buying, properties, viewings, " +
        "documents, deposits, pets, office hours or contact details.";

    const intent = matchedRule?.intent ?? "fallback";

    await sql`
      INSERT INTO public.chat_logs
        (user_message, bot_reply, matched_intent)
      VALUES
        (${message}, ${reply}, ${intent})
    `;

    return NextResponse.json(
      { reply, intent },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("HomeBridge database request failed.");

    return NextResponse.json(
      {
        reply:
          "Our property assistant is temporarily unavailable. " +
          "Please try again shortly.",
      },
      { status: 503 },
    );
  }
}