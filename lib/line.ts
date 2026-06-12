import { validateSignature, messagingApi } from "@line/bot-sdk";

function getClient(): messagingApi.MessagingApiClient {
  return new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  });
}

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
  await getClient().replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}
