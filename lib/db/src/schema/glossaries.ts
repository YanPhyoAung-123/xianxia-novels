import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const glossariesTable = pgTable("glossaries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  novelTitle: text("novel_title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const termsTable = pgTable("terms", {
  id: serial("id").primaryKey(),
  glossaryId: integer("glossary_id").notNull().references(() => glossariesTable.id, { onDelete: "cascade" }),
  english: text("english").notNull(),
  burmese: text("burmese").notNull(),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const translationHistoryTable = pgTable("translation_history", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  glossaryId: integer("glossary_id"),
  novelTitle: text("novel_title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGlossarySchema = createInsertSchema(glossariesTable).omit({ id: true, createdAt: true });
export const insertTermSchema = createInsertSchema(termsTable).omit({ id: true, createdAt: true });
export const insertTranslationHistorySchema = createInsertSchema(translationHistoryTable).omit({ id: true, createdAt: true });

export type InsertGlossary = z.infer<typeof insertGlossarySchema>;
export type Glossary = typeof glossariesTable.$inferSelect;
export type InsertTerm = z.infer<typeof insertTermSchema>;
export type Term = typeof termsTable.$inferSelect;
export type InsertTranslationHistory = z.infer<typeof insertTranslationHistorySchema>;
export type TranslationHistory = typeof translationHistoryTable.$inferSelect;
