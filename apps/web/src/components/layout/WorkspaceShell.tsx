"use client";

import type { WorkspaceMode } from "@prometeus/core";
import { BottomDrawer } from "@/features/drawer/BottomDrawer";
import { LabPage } from "@/features/lab/LabPage";
import { TopTabs } from "@/components/layout/TopTabs";
import { WritePage } from "@/features/write/WritePage";
import { useState } from "react";

export function WorkspaceShell() {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>("lab");

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center px-5 pb-28 pt-8 sm:px-8 sm:pt-10">
        <TopTabs activeMode={activeMode} onModeChange={setActiveMode} />

        {activeMode === "lab" ? <LabPage /> : <WritePage />}
      </div>

      <BottomDrawer canInsertNotes={activeMode === "write"} />
    </main>
  );
}
