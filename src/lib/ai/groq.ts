import "server-only";

import Groq from "groq-sdk";
import { getServerEnv } from "@/lib/validation/env";

let client: Groq | undefined;

export function getGroqClient() {
  if (!client) {
    client = new Groq({ apiKey: getServerEnv().GROQ_API_KEY });
  }

  return client;
}

export const GROQ_MODEL = "openai/gpt-oss-120b";

