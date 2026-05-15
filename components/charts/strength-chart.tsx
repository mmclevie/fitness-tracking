"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface StrengthPoint {
  date: string;
  topSetKg: number;
  avgKg: number;
  topReps: number;
}

export function StrengthChart({ points }: { points: StrengthPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickFormatter={(s) => s.slice(5)} />
          <YAxis stroke="#a1a1aa" fontSize={10} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(v, name) => {
              const n = String(name);
              return [`${v}${n === "topReps" ? " reps" : "kg"}`, n === "topSetKg" ? "Top set" : n === "avgKg" ? "Average" : "Top reps"];
            }}
          />
          <Line type="monotone" dataKey="topSetKg" stroke="#fafafa" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="avgKg" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
