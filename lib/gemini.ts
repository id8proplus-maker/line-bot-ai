import { GoogleGenAI } from "@google/genai";
import { DEFAULT_REPLY, SYSTEM_PROMPT_TEMPLATE } from "./constants";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function escapeUserMessage(text: string): string {
  return text.replace(/[`\\<>]/g, " ").trim();
}

export async function askGemini(
  question: string,
  faqCsv: string
): Promise<string> {
  const safeQuestion = escapeUserMessage(question);

  const prompt = SYSTEM_PROMPT_TEMPLATE.replace(
    "{FAQ_CSV_DATA}",
    faqCsv
  ).replace("{USER_MESSAGE}", safeQuestion);

  const response = await genai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      temperature: 1.0,
      maxOutputTokens: 1024,
    },
  });

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason ?? "UNKNOWN";
  const thoughtsTokenCount =
    candidate?.tokenCount ?? response.usageMetadata?.thoughtsTokenCount ?? 0;
  const candidatesTokenCount =
    response.usageMetadata?.candidatesTokenCount ?? 0;

  console.log(
    `[gemini] finishReason=${finishReason} thoughtsTokenCount=${thoughtsTokenCount} candidatesTokenCount=${candidatesTokenCount}`
  );

  if (finishReason === "MAX_TOKENS" || finishReason !== "STOP") {
    return DEFAULT_REPLY;
  }

  const text = candidate?.content?.parts?.[0]?.text?.trim();
  return text || DEFAULT_REPLY;
}
