"use client";

import { motion } from "motion/react";
import { WeekendCard, type WeekendWithWorkItems } from "./weekend-card";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

type CategorySectionProps = {
  title: string;
  weekends: WeekendWithWorkItems[];
};

export function CategorySection({ title, weekends }: CategorySectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-4">{title}</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {weekends.map((weekend) => (
          <motion.div key={weekend.id} variants={item}>
            <WeekendCard weekend={weekend} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
