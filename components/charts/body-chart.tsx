"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface BodyPoint {
  weekLabel: string;
  weight: number | null;
  muscle: number | null;
  bodyFat: number | null;
}

export function BodyChart({ points, dataKey, color, unit }: { points: BodyPoint[]; dataKey: "weight" | "muscle" | "bodyFat"; color: string; unit: string }) {
  if (points.length === 0) return null;
  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis dataKey="weekLabel" stroke="#a1a1aa" fontSize={10} />
          <YAxis stroke="#a1a1aa" fontSize={10} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(v) => [`${v}${unit}`, ""]}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
