import { Router } from "express";
import { db, glossariesTable, termsTable, translationHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { TranslateTextBody } from "@workspace/api-zod";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

router.post("/translate", async (req, res) => {
  const parsed = TranslateTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text, glossaryId, novelTitle } = parsed.data;

  let glossaryTerms: { english: string; burmese: string }[] = [];

  if (glossaryId) {
    const terms = await db
      .select()
      .from(termsTable)
      .where(eq(termsTable.glossaryId, glossaryId));
    glossaryTerms = terms.map((t) => ({ english: t.english, burmese: t.burmese }));
  }

  const glossarySection =
    glossaryTerms.length > 0
      ? `\n\nUse this glossary consistently — always use the exact Burmese term for each English term:\n${glossaryTerms
          .map((t) => `- "${t.english}" → "${t.burmese}"`)
          .join("\n")}`
      : "";

  const contextSection = novelTitle
    ? `\nThis is a chapter from the novel: "${novelTitle}".`
    : "";

  const prompt = `You are a professional literary translator specializing in translating WebNovels from English to Burmese (Myanmar language). Your goal is to produce a natural, engaging Burmese translation that readers will enjoy — not a literal word-for-word translation.${contextSection}${glossarySection}

Translate the following English text to Burmese. Keep the tone, style, and narrative energy of the original. Preserve paragraph breaks.

English text:
${text}

Burmese translation:`;

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 8192 },
  });

  const translatedText = response.text ?? "";

  // Find which glossary terms were actually used in the original text
  const appliedTerms = glossaryTerms.filter((t) =>
    text.toLowerCase().includes(t.english.toLowerCase())
  );

  // Save to history
  await db.insert(translationHistoryTable).values({
    originalText: text,
    translatedText,
    glossaryId: glossaryId ?? null,
    novelTitle: novelTitle ?? null,
  });

  res.json({ translatedText, originalText: text, appliedTerms });
});

router.get("/translation-history", async (_req, res) => {
  const history = await db
    .select()
    .from(translationHistoryTable)
    .orderBy(desc(translationHistoryTable.createdAt))
    .limit(50);

  const result = history.map((h) => ({
    id: h.id,
    originalText: h.originalText,
    translatedText: h.translatedText,
    glossaryId: h.glossaryId,
    novelTitle: h.novelTitle,
    createdAt: h.createdAt.toISOString(),
  }));

  res.json(result);
});

export default router;
