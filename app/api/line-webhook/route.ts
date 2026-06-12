import { NextRequest, NextResponse } from "next/server";
import { WebhookRequestBody, MessageEvent, TextMessage } from "@line/bot-sdk";
import { verifySignature, replyMessage } from "@/lib/line";
import { getFaqData } from "@/lib/sheet";
import { askGemini } from "@/lib/gemini";
import { DEFAULT_REPLY } from "@/lib/constants";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Await all events before returning — Vercel freezes runtime after response
  try {
    await processEvents(body);
  } catch (err) {
    console.error("[webhook] processEvents error:", err);
  }

  return NextResponse.json({ status: "ok" });
}

async function processEvents(body: WebhookRequestBody): Promise<void> {
  for (const event of body.events) {
    // LINE sends a verify event with dummy replyToken on webhook setup
    if (event.type === "message" && (event as MessageEvent).replyToken === "00000000000000000000000000000000") {
      continue;
    }

    if (event.type !== "message" || (event as MessageEvent).message.type !== "text") {
      continue;
    }

    const msgEvent = event as MessageEvent;
    const replyToken = msgEvent.replyToken;
    const userText = (msgEvent.message as TextMessage).text ?? "";

    if (!replyToken || !userText.trim()) continue;

    let answer = DEFAULT_REPLY;
    let faqCsv = "";

    try {
      faqCsv = await getFaqData();
    } catch (err) {
      console.error("[webhook] getFaqData error:", err);
    }

    try {
      answer = await askGemini(userText, faqCsv);
    } catch (err) {
      console.error("[webhook] askGemini error:", err);
    }

    try {
      await replyMessage(replyToken, answer);
    } catch (err) {
      console.error("[webhook] replyMessage error:", err);
    }
  }
}
