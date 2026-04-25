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
        // 开发调试和 Demo 模式都不做启动更新检查，避免打断当前使用。
        if (skillsDock.isDemoMode || import.meta.env.DEV) return;

        const update = await check();
        if (update) {
          const shouldUpdate = await ask(
            `发现新版本 v${update.version}。\n\n更新说明：\n${update.body || "无详细说明"}\n\n是否现在下载并安装？`,
            { title: "Skills Dock 可选更新", kind: "info" }
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
        // 不用弹窗阻断用户；网络、GitHub 可达性和本地环境都可能导致失败。
        console.warn("Update check skipped due to error:", err);
      }
    }

    checkForUpdates();
  }, [skillsDock.isDemoMode]);

  return (
    <AppShell
      isDemoMode={skillsDock.isDemoMode}
      loading={skillsDock.loading}
      onAddFolder={() => void skillsDock.addFolder()}
      onImportZip={() => void skillsDock.importFromZip()}
      onExportSelected={() => void skillsDock.exportSelectedSkills()}
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
      onBrowseSource={(source, log) => void skillsDock.browseSource(source, log)}
      appCounts={skillsDock.appCounts}
      batchBusy={skillsDock.batchBusy}
      search={skillsDock.search}
      selectedSkill={skillsDock.selectedSkill}
      selectedInstallationState={skillsDock.selectedInstallationState}
      selectedToolKind={skillsDock.selectedToolKind}
      selectedSourceId={skillsDock.selectedSourceId}
      selectedSkillIds={skillsDock.selectedSkillIds}
      exportSelectionCount={skillsDock.selectedSkillIds.length}
      skills={skillsDock.skills}
      sources={skillsDock.sources}
      usageMap={skillsDock.usageMap}
      installedApps={skillsDock.installedApps}
      aiSummary={skillsDock.selectedSkillAiSummary}
      selectedAiProvider={skillsDock.selectedAiProvider}
      onGenerateAiSummary={() => void skillsDock.generateAiSummary()}
      onGenerateAiSummaryWithProvider={(provider) =>
        void skillsDock.generateAiSummaryWithProvider(provider)
      }
    />
  );
}

export default App;
