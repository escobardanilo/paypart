import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "Must be the HTTP(S) Supabase project API URL."),
  SUPABASE_SECRET_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
});

export function getServerEnv() {
  const result = serverEnvSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  });

  if (!result.success) {
    throw new Error(
      `Missing or invalid server environment variables: ${result.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return result.data;
}
