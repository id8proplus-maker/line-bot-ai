import { Client, validateSignature } from "@line/bot-sdk";

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export function verifySignature(body: string, signature: string): boolean {
  return validateSignature(
    body,
    process.env.LINE_CHANNEL_SECRET!,
    signature
  );
}

export async function replyMessage(
  replyToken: string,
  text: string
): Promise<void> {
  await client.replyMessage(replyToken, {
    type: "text",
    text,
  });
}
