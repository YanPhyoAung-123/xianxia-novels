import { Router } from "express";
import { db, glossariesTable, termsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetGlossaryParams,
  UpdateGlossaryParams,
  UpdateGlossaryBody,
  DeleteGlossaryParams,
  ListTermsParams,
  CreateTermParams,
  CreateTermBody,
  UpdateTermParams,
  UpdateTermBody,
  DeleteTermParams,
  ExportGlossaryParams,
  ImportGlossaryBody,
  CreateGlossaryBody,
} from "@workspace/api-zod";

const router = Router();

// Helper: get glossary with term count
async function getGlossaryWithCount(id: number) {
  const [glossary] = await db
    .select()
    .from(glossariesTable)
    .where(eq(glossariesTable.id, id));
  if (!glossary) return null;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(termsTable)
    .where(eq(termsTable.glossaryId, id));

  return {
    id: glossary.id,
    name: glossary.name,
    description: glossary.description,
    novelTitle: glossary.novelTitle,
    termCount: count,
    createdAt: glossary.createdAt.toISOString(),
  };
}

// List all glossaries
router.get("/glossaries", async (_req, res) => {
  const glossaries = await db.select().from(glossariesTable);

  const result = await Promise.all(
    glossaries.map(async (g) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(termsTable)
        .where(eq(termsTable.glossaryId, g.id));
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        novelTitle: g.novelTitle,
        termCount: count,
        createdAt: g.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

// Create glossary
router.post("/glossaries", async (req, res) => {
  const parsed = CreateGlossaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [created] = await db
    .insert(glossariesTable)
    .values({ name: parsed.data.name, description: parsed.data.description, novelTitle: parsed.data.novelTitle })
    .returning();

  res.status(201).json({
    id: created.id,
    name: created.name,
    description: created.description,
    novelTitle: created.novelTitle,
    termCount: 0,
    createdAt: created.createdAt.toISOString(),
  });
});

// Get glossary
router.get("/glossaries/:id", async (req, res) => {
  const parsed = GetGlossaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const glossary = await getGlossaryWithCount(parsed.data.id);
  if (!glossary) {
    res.status(404).json({ error: "Glossary not found" });
    return;
  }

  res.json(glossary);
});

// Update glossary
router.patch("/glossaries/:id", async (req, res) => {
  const paramsParsed = UpdateGlossaryParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateGlossaryBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (bodyParsed.data.name !== undefined) updates.name = bodyParsed.data.name;
  if (bodyParsed.data.description !== undefined) updates.description = bodyParsed.data.description;
  if (bodyParsed.data.novelTitle !== undefined) updates.novelTitle = bodyParsed.data.novelTitle;

  await db.update(glossariesTable).set(updates).where(eq(glossariesTable.id, paramsParsed.data.id));

  const updated = await getGlossaryWithCount(paramsParsed.data.id);
  if (!updated) {
    res.status(404).json({ error: "Glossary not found" });
    return;
  }

  res.json(updated);
});

// Delete glossary
router.delete("/glossaries/:id", async (req, res) => {
  const parsed = DeleteGlossaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(glossariesTable).where(eq(glossariesTable.id, parsed.data.id));
  res.status(204).end();
});

// List terms
router.get("/glossaries/:id/terms", async (req, res) => {
  const parsed = ListTermsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const terms = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.glossaryId, parsed.data.id));

  res.json(
    terms.map((t) => ({
      id: t.id,
      glossaryId: t.glossaryId,
      english: t.english,
      burmese: t.burmese,
      category: t.category,
      notes: t.notes,
    }))
  );
});

// Create term
router.post("/glossaries/:id/terms", async (req, res) => {
  const paramsParsed = CreateTermParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = CreateTermBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [created] = await db
    .insert(termsTable)
    .values({
      glossaryId: paramsParsed.data.id,
      english: bodyParsed.data.english,
      burmese: bodyParsed.data.burmese,
      category: bodyParsed.data.category,
      notes: bodyParsed.data.notes,
    })
    .returning();

  res.status(201).json({
    id: created.id,
    glossaryId: created.glossaryId,
    english: created.english,
    burmese: created.burmese,
    category: created.category,
    notes: created.notes,
  });
});

// Update term
router.patch("/glossaries/:id/terms/:termId", async (req, res) => {
  const paramsParsed = UpdateTermParams.safeParse({
    id: Number(req.params.id),
    termId: Number(req.params.termId),
  });
  const bodyParsed = UpdateTermBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (bodyParsed.data.english !== undefined) updates.english = bodyParsed.data.english;
  if (bodyParsed.data.burmese !== undefined) updates.burmese = bodyParsed.data.burmese;
  if (bodyParsed.data.category !== undefined) updates.category = bodyParsed.data.category;
  if (bodyParsed.data.notes !== undefined) updates.notes = bodyParsed.data.notes;

  const [updated] = await db
    .update(termsTable)
    .set(updates)
    .where(eq(termsTable.id, paramsParsed.data.termId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Term not found" });
    return;
  }

  res.json({
    id: updated.id,
    glossaryId: updated.glossaryId,
    english: updated.english,
    burmese: updated.burmese,
    category: updated.category,
    notes: updated.notes,
  });
});

// Delete term
router.delete("/glossaries/:id/terms/:termId", async (req, res) => {
  const parsed = DeleteTermParams.safeParse({
    id: Number(req.params.id),
    termId: Number(req.params.termId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db.delete(termsTable).where(eq(termsTable.id, parsed.data.termId));
  res.status(204).end();
});

// Export glossary
router.get("/glossaries/:id/export", async (req, res) => {
  const parsed = ExportGlossaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const glossary = await getGlossaryWithCount(parsed.data.id);
  if (!glossary) {
    res.status(404).json({ error: "Glossary not found" });
    return;
  }

  const terms = await db
    .select()
    .from(termsTable)
    .where(eq(termsTable.glossaryId, parsed.data.id));

  res.json({
    glossary,
    terms: terms.map((t) => ({
      id: t.id,
      glossaryId: t.glossaryId,
      english: t.english,
      burmese: t.burmese,
      category: t.category,
      notes: t.notes,
    })),
  });
});

// Import glossary
router.post("/glossaries/import", async (req, res) => {
  const parsed = ImportGlossaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid import data" });
    return;
  }

  const [createdGlossary] = await db
    .insert(glossariesTable)
    .values({
      name: parsed.data.glossary.name,
      description: parsed.data.glossary.description,
      novelTitle: parsed.data.glossary.novelTitle,
    })
    .returning();

  if (parsed.data.terms.length > 0) {
    await db.insert(termsTable).values(
      parsed.data.terms.map((t) => ({
        glossaryId: createdGlossary.id,
        english: t.english,
        burmese: t.burmese,
        category: t.category,
        notes: t.notes,
      }))
    );
  }

  res.status(201).json({
    id: createdGlossary.id,
    name: createdGlossary.name,
    description: createdGlossary.description,
    novelTitle: createdGlossary.novelTitle,
    termCount: parsed.data.terms.length,
    createdAt: createdGlossary.createdAt.toISOString(),
  });
});

export default router;
