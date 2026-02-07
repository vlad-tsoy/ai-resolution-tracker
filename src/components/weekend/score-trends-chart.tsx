"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ScoreRow = {
  weekendNumber: number;
  weekendName: string;
  criterion: string;
  avgRating: number;
};

const chartConfig = {
  outcome_quality: {
    label: "Outcome Quality",
    color: "var(--chart-1)",
  },
  time_saved: {
    label: "Time Saved",
    color: "var(--chart-2)",
  },
  repeatability: {
    label: "Repeatability",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const CRITERIA = ["outcome_quality", "time_saved", "repeatability"] as const;

function transformData(rows: ScoreRow[]) {
  const grouped = new Map<number, Record<string, number | string>>();

  for (const row of rows) {
    // Skip use_again (binary, not 1-5 scale)
    if (!CRITERIA.includes(row.criterion as (typeof CRITERIA)[number])) continue;

    if (!grouped.has(row.weekendNumber)) {
      grouped.set(row.weekendNumber, {
        weekendLabel: `Wk ${row.weekendNumber}`,
      });
    }
    const entry = grouped.get(row.weekendNumber)!;
    entry[row.criterion] = Math.round(row.avgRating * 10) / 10;
  }

  return Array.from(grouped.values());
}

export default function ScoreTrendsChart({ data }: { data: ScoreRow[] }) {
  const chartData = transformData(data);

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Score Trends</h2>
        <p className="text-sm text-muted-foreground">
          Average ratings across completed weekends
        </p>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="weekendLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            domain={[0, 5]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="outcome_quality"
            fill="var(--color-outcome_quality)"
            radius={4}
          />
          <Bar
            dataKey="time_saved"
            fill="var(--color-time_saved)"
            radius={4}
          />
          <Bar
            dataKey="repeatability"
            fill="var(--color-repeatability)"
            radius={4}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
