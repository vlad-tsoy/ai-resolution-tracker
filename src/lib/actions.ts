"use server";

import { db } from "@/lib/db";
import { workItems, weekends, scorecardRatings } from "@/db/schema";
import { eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Toggle Work Item ---

export async function toggleWorkItem(itemId: number) {
  // Validate input
  const id = z.number().int().positive().parse(itemId);

  // Toggle in a single atomic SQL operation
  const [updated] = await db
    .update(workItems)
    .set({
      isCompleted: not(workItems.isCompleted),
      updatedAt: new Date(),
    })
    .where(eq(workItems.id, id))
    .returning();

  if (!updated) return;

  // Derive weekend completion from core items
  const allItems = await db.query.workItems.findMany({
    where: eq(workItems.weekendId, updated.weekendId),
  });
  const coreItems = allItems.filter((item) => !item.isAdvanced);
  const allCoreCompleted =
    coreItems.length > 0 && coreItems.every((item) => item.isCompleted);

  // Update weekend completedAt based on core item status
  await db
    .update(weekends)
    .set({
      completedAt: allCoreCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, updated.weekendId));

  // Revalidate both pages
  revalidatePath("/");
  revalidatePath(`/weekend/${updated.weekendId}`);
}

// --- Save Notes ---

const saveNotesSchema = z.object({
  weekendId: z.number().int().positive(),
  notes: z.string().max(50000),
});

export async function saveNotes(weekendId: number, notes: string) {
  const parsed = saveNotesSchema.parse({ weekendId, notes });

  await db
    .update(weekends)
    .set({
      notes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, parsed.weekendId));

  revalidatePath(`/weekend/${parsed.weekendId}`);
}

// --- Save Scorecard Rating ---

const VALID_CRITERIA = ['outcome_quality', 'time_saved', 'repeatability', 'use_again'] as const;

const saveRatingSchema = z.object({
  weekendId: z.number().int().positive(),
  criterion: z.enum(VALID_CRITERIA),
  rating: z.number().int().min(0).max(5),
});

export async function saveRating(weekendId: number, criterion: string, rating: number) {
  const parsed = saveRatingSchema.parse({ weekendId, criterion, rating });

  await db
    .insert(scorecardRatings)
    .values({
      weekendId: parsed.weekendId,
      criterion: parsed.criterion,
      rating: parsed.rating,
    })
    .onConflictDoUpdate({
      target: [scorecardRatings.weekendId, scorecardRatings.criterion],
      set: {
        rating: parsed.rating,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/weekend/${parsed.weekendId}`);
}

// --- Save Scorecard Notes ---

const saveScorecardNotesSchema = z.object({
  weekendId: z.number().int().positive(),
  notes: z.string().max(50000),
});

export async function saveScorecardNotes(weekendId: number, notes: string) {
  const parsed = saveScorecardNotesSchema.parse({ weekendId, notes });

  await db
    .update(weekends)
    .set({
      scorecardNotes: parsed.notes,
      updatedAt: new Date(),
    })
    .where(eq(weekends.id, parsed.weekendId));

  revalidatePath(`/weekend/${parsed.weekendId}`);
}
