"use client";
import { Crosshair } from "lucide-react";

export function TodayFab({ todayIso }: { todayIso: string }) {
  function jump() {
    const el = document.getElementById(`day-${todayIso}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  return (
    <button
      onClick={jump}
      aria-label="Jump to today"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <Crosshair className="h-6 w-6" />
    </button>
  );
}
