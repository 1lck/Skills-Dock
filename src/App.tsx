import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";

import "./App.css";
import { AppShell } from "./components/layout/app-shell";
import { useSkillsDock } from "./hooks/use-skills-dock";

function App() {
  const skillsDock = useSkillsDock();

  // 启动时检查自动更新
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // 在开发环境 (Demo) 下跳过更新检查
        if (skillsDock.isDemoMode) return;

        const update = await check();
        if (update) {
          const shouldUpdate = await ask(
            `发现新版本 v${update.version}！\n\n更新说明：\n${update.body || "无详细说明"}\n\n是否立即下载并安装？`,
            { title: "Skills Dock 发现新版本", kind: "info" }
          );

          if (shouldUpdate) {
            await message("正在后台下载并安装更新，这可能需要几分钟的时间。\n完成后应用将自动重启。", {
              title: "正在更新",
              kind: "info",
            });
            await update.downloadAndInstall();
            // 某些平台下载安装后需要手动触发重启
            try {
              const { relaunch } = await import("@tauri-apps/plugin-process");
              await relaunch();
            } catch (e) {
              console.log("Process plugin missing, expecting auto-restart");
            }
          }
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    }

    checkForUpdates();
  }, [skillsDock.isDemoMode]);

  return (
    <AppShell
      isDemoMode={skillsDock.isDemoMode}
      loading={skillsDock.loading}
      onAddFolder={() => void skillsDock.addFolder()}
      onOpenPath={(path) => void skillsDock.openPath(path)}
      onRefresh={() => void skillsDock.refresh()}
      onSearchChange={skillsDock.setSearch}
      onSelectSkill={skillsDock.setSelectedSkillId}
      onSelectInstallationState={skillsDock.setSelectedInstallationState}
      onSelectToolKind={skillsDock.setSelectedToolKind}
      onSelectSource={skillsDock.setSelectedSourceId}
      onToggleSkillSelection={skillsDock.toggleSkillSelection}
      onToggleSelectAllVisible={skillsDock.toggleSelectAllVisible}
      onClearSelection={skillsDock.clearSelection}
      onBatchApply={(app, enabled) => void skillsDock.batchApply(app, enabled)}
      onToggleApp={(skillId, app, enabled) =>
        void skillsDock.toggleApp(skillId, app, enabled)
      }
      appCounts={skillsDock.appCounts}
      batchBusy={skillsDock.batchBusy}
      search={skillsDock.search}
      selectedSkill={skillsDock.selectedSkill}
      selectedInstallationState={skillsDock.selectedInstallationState}
      selectedToolKind={skillsDock.selectedToolKind}
      selectedSourceId={skillsDock.selectedSourceId}
      selectedSkillIds={skillsDock.selectedSkillIds}
      skills={skillsDock.skills}
      sources={skillsDock.sources}
      usageMap={skillsDock.usageMap}
      installedApps={skillsDock.installedApps}
    />
  );
}

export default App;
