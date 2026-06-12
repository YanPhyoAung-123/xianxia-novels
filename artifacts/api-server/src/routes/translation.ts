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

  const prompt = `သင်သည် WebNovel များကို အင်္ဂလိပ်ဘာသာမှ မြန်မာဘာသာသို့ ဘာသာပြန်ရာတွင် ကျွမ်းကျင်သော ဝတ္ထုဘာသာပြန်ဆရာဖြစ်သည်။${contextSection}${glossarySection}

အောက်ပါ စည်းမျဉ်းများကို တင်းကြပ်စွာ လိုက်နာပါ။

**မဖြစ်မနေ လိုက်နာရမည့် စည်းမျဉ်းများ:**
1. မူရင်း English စာသားထဲရှိ စကားလုံးတိုင်း၊ ဝါကျတိုင်းကို မကျော်မဖြတ်ပဲ အပြည့်အစုံ ဘာသာပြန်ရမည်။ တစ်လုံးမှ မကျော်ရ။
2. ဘာသာပြန်ထားသော output တွင် အင်္ဂလိပ်စကားလုံး တစ်လုံးမှ မပါရ — character နာမည်၊ နေရာနာမည်၊ ကျင့်စဉ်အမည်၊ technique အမည် အားလုံးကိုပါ မြန်မာဘာသာဖြင့်သာ ရေးရမည် (Glossary တွင် သတ်မှတ်ထားသည့်အတိုင်း)။
3. မည်သည့် content ကိုမှ အတိုချုံ့မရ၊ ကျန်ခဲ့မရ — dialog တိုင်း၊ narrative တိုင်း၊ description တိုင်းကို အသေးစိတ် ဘာသာပြန်ရမည်။
4. မူရင်း paragraph နှင့် dialog structure ကို ထိန်းသိမ်းရမည်။
5. ဖတ်ရှုသူများ စိတ်ဝင်စားနိုင်ရန် မြန်မာဘာသာ၏ သဘာဝနှင့် ညီညွတ်သော ဆီလျော်မှုရှိသော ဘာသာပြန်ချက်ဖြစ်ရမည်။
6. Glossary တွင် သတ်မှတ်ထားသော term တိုင်းကို တစ်သမတ်တည်း ထိုနာမည်ဖြင့်သာ ဘာသာပြန်ရမည်။

ဘာသာပြန်ရမည့် English စာသား:
${text}

မြန်မာဘာသာပြန်ချက် (မြန်မာဘာသာသာ ပါရမည်):`;

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
