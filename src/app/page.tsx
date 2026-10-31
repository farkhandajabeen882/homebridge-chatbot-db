"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type Message = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const welcome: Message = {
  id: 1,
  role: "bot",
  text:
    "Hello! Welcome to HomeBridge 👋\n\n" +
    "I can help with renting, buying, property information and viewings.\n\n" +
    "Choose a topic or type your question below.",
};

const topics = [
  { label: "Rentals", message: "Show properties to rent" },
  { label: "Buy a home", message: "I want to buy" },
  { label: "Viewings", message: "Viewing information" },
  { label: "Documents", message: "Required documents" },
  { label: "Deposit", message: "Rental deposit" },
  { label: "Office hours", message: "Opening hours" },
  { label: "Pets", message: "Are pets allowed?" },
  { label: "Contact", message: "Contact an agent" },
];

const properties = [
  {
    id: "HB101",
    name: "Maple Apartment",
    area: "Central District",
    details: "2 bedrooms · Furnished",
    price: "£1,250 / month",
    type: "Rent",
    photo: "photo-1600607687939-ce8a6c25118c",
  },
  {
    id: "HB102",
    name: "Park View Flat",
    area: "Green Park",
    details: "2 bedrooms · Unfurnished",
    price: "£1,450 / month",
    type: "Rent",
    photo: "photo-1600210492486-724fe5c67fb0",
  },
  {
    id: "HB103",
    name: "Riverside Studio",
    area: "Riverside",
    details: "Studio · Furnished",
    price: "£1,100 / month",
    type: "Rent",
    photo: "photo-1522708323590-d24dbb6b0267",
  },
  {
    id: "HB201",
    name: "Oakwood Family Home",
    area: "Oakwood District",
    details: "3 bedrooms · Private garden",
    price: "£325,000",
    type: "Buy",
    photo: "photo-1600596542815-ffad4c1539a9",
  },
];

function imageUrl(photo: string) {
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=85`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "Rent" | "Buy">("All");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const idRef = useRef(2);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, chatOpen]);

  useEffect(() => {
    return () => requestRef.current?.abort();
  }, []);

  async function sendMessage(value: string) {
    const message = value.trim();

    if (!message || message.length > 500 || busyRef.current) return;

    busyRef.current = true;
    setIsTyping(true);
    setChatOpen(true);
    setInput("");

    setMessages((current) => [
      ...current,
      { id: idRef.current++, role: "user", text: message },
    ]);

    const controller = new AbortController();
    requestRef.current = controller;

    // Stop waiting if the network request takes too long.
    const timeout = setTimeout(() => controller.abort(), 20000);
    const startedAt = Date.now();

    let reply = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
        cache: "no-store",
      });

      const data: unknown = await response.json();

      if (
        typeof data !== "object" ||
        data === null ||
        !("reply" in data) ||
        typeof data.reply !== "string"
      ) {
        throw new Error("Invalid server response.");
      }

      // Also display friendly error replies returned by the API.
      reply = data.reply;
    } catch {
      reply =
        "I could not reach our property assistant.\n\n" +
        "Please check your connection and try again.";
    } finally {
      clearTimeout(timeout);
    }

    const remainingDelay = Math.max(0, 600 - (Date.now() - startedAt));

    await new Promise<void>((resolve) => {
      setTimeout(resolve, remainingDelay);
    });

    // Ignore an old response if the conversation was reset.
    if (requestRef.current !== controller) return;

    setMessages((current) => [
      ...current,
      { id: idRef.current++, role: "bot", text: reply },
    ]);

    setIsTyping(false);
    busyRef.current = false;
    requestRef.current = null;

    if (window.matchMedia("(min-width: 1024px)").matches) {
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    requestRef.current?.abort();
    requestRef.current = null;
    busyRef.current = false;

    setMessages([welcome]);
    setInput("");
    setIsTyping(false);
    idRef.current = 2;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <main className="min-h-dvh bg-[#f5f7f2] text-[#183d34]">
      <header className="border-b border-[#dfe5da] bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-5 py-4">
          <a href="#" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-xl bg-[#244e43] text-2xl text-white"
            >
              ⌂
            </span>

            <span>
              <span className="block text-xl font-bold">
                HomeBridge<span className="text-[#ac8246]">.</span>
              </span>
              <span className="text-[10px] tracking-[0.18em] text-slate-500">
                YOUR NEXT CHAPTER
              </span>
            </span>
          </a>

          <a
            href="#properties"
            className="hidden text-sm font-medium sm:block"
          >
            Explore properties
          </a>

          <span className="rounded-full border border-[#e4d8bf] bg-[#faf6ed] px-3 py-2 text-[11px] text-[#896535]">
            Neon database demo
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0">
          <section className="relative isolate overflow-hidden rounded-[28px] bg-[#183d34]">
            <Image
              src={imageUrl("photo-1600596542815-ffad4c1539a9")}
              alt="Illustrative modern house with a garden"
              fill
              unoptimized
              priority
              sizes="(min-width: 1024px) 65vw, 100vw"
              className="-z-20 object-cover"
            />

            <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#102e25]/95 via-[#102e25]/65 to-[#102e25]/10" />

            <div className="px-6 py-12 sm:px-9 sm:py-16">
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-2 text-[10px] tracking-widest text-white">
                HOMES FOR YOUR NEXT CHAPTER
              </span>

              <h1 className="mt-7 font-serif text-5xl leading-[1.08] text-white sm:text-6xl">
                A place to live.
                <br />
                A space to
                <br />
                <span className="text-[#e6c58f] italic">belong.</span>
              </h1>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/80">
                Explore our demo homes and get clear answers about
                renting, buying and arranging a viewing.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#properties"
                  className="rounded-xl bg-[#e6c58f] px-5 py-3 text-sm font-semibold text-[#183d34]"
                >
                  Explore homes ↗
                </a>

                <button
                  onClick={() => void sendMessage("Viewing information")}
                  disabled={isTyping}
                  className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  Ask about viewings
                </button>
              </div>

              <p className="mt-7 text-[10px] text-white/60">
                Fictional listings · Illustrative photography
              </p>
            </div>
          </section>

          <section id="properties" className="scroll-mt-5 pt-8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#9b743b]">
              THE HOMEBRIDGE COLLECTION
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-3xl sm:text-4xl">
                Find your kind of home.
              </h2>

              <div className="flex gap-1 rounded-full border border-[#dfe5da] bg-white p-1">
                {(["All", "Rent", "Buy"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    aria-pressed={filter === option}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      filter === option
                        ? "bg-[#244e43] text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {properties
                .filter(
                  (property) =>
                    filter === "All" || property.type === filter,
                )
                .map((property) => (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-3xl border border-[#dfe5da] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative h-52">
                      <Image
                        src={imageUrl(property.photo)}
                        alt={`Illustrative photo for ${property.name}`}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />

                      <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold">
                        {property.type === "Rent" ? "TO RENT" : "FOR SALE"}
                      </span>

                      <span className="absolute right-3 bottom-3 rounded bg-black/50 px-2 py-1 text-[9px] text-white">
                        Illustrative photo
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-[10px] font-semibold tracking-wider text-[#9b743b]">
                        {property.area.toUpperCase()} · {property.id}
                      </p>
                      <h3 className="mt-2 font-serif text-2xl">
                        {property.name}
                      </h3>
                      <p className="mt-3 text-xs text-slate-500">
                        {property.details}
                      </p>
                      <p className="mt-4 text-xl font-bold">
                        {property.price}
                      </p>

                      <button
                        disabled={isTyping}
                        onClick={() =>
                          void sendMessage(
                            property.type === "Rent"
                              ? "Show properties to rent"
                              : "Show property for sale",
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-[#d8e1d6] px-4 py-3 text-sm font-semibold transition hover:bg-[#edf3e9] disabled:opacity-50"
                      >
                        Ask about {property.type === "Rent" ? "rentals" : "buying"} ↗
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </section>

          <footer className="py-7 text-xs leading-6 text-slate-500">
            HomeBridge portfolio demonstration. Properties, prices and
            contact details are fictional. Rental bills are excluded.
            No real appointments are booked.
          </footer>
        </div>

        <aside
          id="property-chat"
          aria-label="HomeBridge property assistant"
          className={`${
            chatOpen ? "flex" : "hidden"
          } fixed inset-x-2 bottom-2 z-40 h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-3xl border border-[#d9e3d3] bg-white shadow-2xl lg:sticky lg:inset-auto lg:top-4 lg:flex lg:h-[calc(100dvh-120px)] lg:max-h-[950px]`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#244e43] px-5 py-4 text-white">
            <div>
              <h2 className="text-lg font-semibold">
                HomeBridge Assistant
              </h2>
              <p className="mt-1 text-xs text-white/75">
                Your property questions, made simpler.
              </p>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
              className="rounded-lg px-3 py-2 text-2xl lg:hidden"
            >
              ×
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-[11px] text-slate-500">
              Rule-based · Answers from Neon
            </span>

            <button
              onClick={resetChat}
              className="text-xs font-semibold"
            >
              New chat ↻
            </button>
          </div>

          <div className="shrink-0 border-b border-[#e0e6da] bg-[#f5f8ef] px-4 py-2.5 text-[11px] leading-5 text-slate-600">
            Messages and replies are saved for this demo.
            Please do not share sensitive personal information.
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions text"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#f5f8f1] p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="min-w-0 max-w-[95%]">
                  <p
                    className={`mb-1 text-[10px] font-semibold text-slate-500 ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {message.role === "user" ? "YOU" : "HOMEBRIDGE"}
                  </p>

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap wrap-break-word ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-[#244e43] text-white"
                        : "rounded-tl-sm border border-[#dfe7d8] bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <p
                role="status"
                className="w-fit rounded-2xl border border-[#dfe7d8] bg-white px-4 py-3 text-sm text-slate-500"
              >
                <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-emerald-600" />
                typing...
              </p>
            )}
          </div>

          <div className="max-h-40 shrink-0 overflow-y-auto border-t border-[#e3e9dc] px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-slate-500">
              QUICK QUESTIONS
            </p>

            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => void sendMessage(topic.message)}
                  disabled={isTyping}
                  className="rounded-full border border-[#d8e1d2] px-3 py-2 text-xs transition hover:bg-[#edf3e9] disabled:opacity-50"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={submit}
            className="shrink-0 border-t border-slate-100 bg-white p-4"
          >
            <label htmlFor="chat-input" className="sr-only">
              Your message
            </label>

            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                autoComplete="off"
                placeholder="Ask a property question..."
                className="min-w-0 flex-1 rounded-xl border border-[#cbd8c6] bg-[#fafcf8] px-3 py-3 text-base text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />

              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="rounded-xl bg-[#244e43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173b31] disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </aside>
      </div>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          aria-controls="property-chat"
          aria-expanded={chatOpen}
          className="fixed right-4 bottom-4 z-30 rounded-full bg-[#244e43] px-5 py-4 text-sm font-semibold text-white shadow-xl lg:hidden"
        >
          Chat with HomeBridge ↗
        </button>
      )}
    </main>
  );
}