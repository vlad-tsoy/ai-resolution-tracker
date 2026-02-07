import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const categoryEnum = pgEnum("category", [
  "foundation",
  "core_projects",
  "automation",
  "system_and_build",
  "bonus",
]);

export const weekends = pgTable("weekends", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  number: integer("number").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  deliverable: text("deliverable").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  category: categoryEnum("category").notNull(),
  isBonus: boolean("is_bonus").default(false).notNull(),
  notes: text("notes"),
  scorecardNotes: text("scorecard_notes"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const weekendsRelations = relations(weekends, ({ many }) => ({
  workItems: many(workItems),
  doneCriteria: many(doneCriteria),
  scorecardRatings: many(scorecardRatings),
}));

export const workItems = pgTable("work_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer("weekend_id")
    .notNull()
    .references(() => weekends.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  isAdvanced: boolean("is_advanced").default(false).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workItemsRelations = relations(workItems, ({ one }) => ({
  weekend: one(weekends, {
    fields: [workItems.weekendId],
    references: [weekends.id],
  }),
}));

export const doneCriteria = pgTable("done_criteria", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer("weekend_id")
    .notNull()
    .references(() => weekends.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  isMet: boolean("is_met").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const doneCriteriaRelations = relations(doneCriteria, ({ one }) => ({
  weekend: one(weekends, {
    fields: [doneCriteria.weekendId],
    references: [weekends.id],
  }),
}));

export const scorecardRatings = pgTable("scorecard_ratings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  weekendId: integer("weekend_id")
    .notNull()
    .references(() => weekends.id, { onDelete: "cascade" }),
  criterion: varchar("criterion", { length: 255 }).notNull(),
  rating: real("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => [
  unique("scorecard_ratings_weekend_criterion").on(t.weekendId, t.criterion),
]);

export const scorecardRatingsRelations = relations(
  scorecardRatings,
  ({ one }) => ({
    weekend: one(weekends, {
      fields: [scorecardRatings.weekendId],
      references: [weekends.id],
    }),
  })
);
