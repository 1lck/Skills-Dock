import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useEffectEvent, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";

import "./App.css";
import { AppShell } from "./components/layout/app-shell";
import { useSkillsDock } from "./hooks/use-skills-dock";
import packageJson from "../package.json";
import { performUpdateCheck } from "./lib/application/update-check";

function App() {
  const skillsDock = useSkillsDock();
  const [appVersion, setAppVersion] = useState(packageJson.version);
  const [updateBusy, setUpdateBusy] = useState(false);

  const runUpdateCheck = useEffectEvent(async (manual: boolean) => {
    setUpdateBusy(true);

    try {
      await performUpdateCheck({
        manual,
        isDemoMode: skillsDock.isDemoMode,
        isDev: import.meta.env.DEV,
        currentVersion: appVersion,
        checkForUpdate: () => check(),
        confirmUpdate: (content, title) =>
          ask(content, { title, kind: "info" }),
        notify: (content, title, kind = "info") =>
          message(content, { title, kind }),
        relaunch: async () => {
          const { relaunch } = await import("@tauri-apps/plugin-process");
          await relaunch();
        },
        onError: (error) => {
          console.warn("Update check skipped due to error:", error);
        },
      });
    } finally {
      setUpdateBusy(false);
    }
  });

  useEffect(() => {
    if (skillsDock.isDemoMode) {
      return;
    }

    let cancelled = false;

    async function loadVersion() {
      try {
        const version = await getVersion();
        if (!cancelled) {
          setAppVersion(version);
        }
      } catch (error) {
        console.warn("Falling back to package version:", error);
      }
    }

    void loadVersion();

    return () => {
      cancelled = true;
    };
  }, [skillsDock.isDemoMode]);

  // 启动时检查自动更新
  useEffect(() => {
    void runUpdateCheck(false);
  }, [skillsDock.isDemoMode]);

  return (
    <AppShell
      appVersion={appVersion}
      isDemoMode={skillsDock.isDemoMode}
      loading={skillsDock.loading}
      updateBusy={updateBusy}
      onAddFolder={() => void skillsDock.addFolder()}
      onCheckForUpdates={() => void runUpdateCheck(true)}
      onImportZip={() => void skillsDock.importFromZip()}
      onExportSelected={() => void skillsDock.exportSelectedSkills()}
      onOpenPath={(path) => void skillsDock.openPath(path)}
      onRefresh={() => void skillsDock.refresh()}
      onRefreshUsage={() => void skillsDock.refreshUsage()}
      onSearchChange={skillsDock.setSearch}
      onSelectSkill={skillsDock.setSelectedSkillId}
      onSelectInstallationState={skillsDock.setSelectedInstallationState}
      onSelectToolKind={skillsDock.setSelectedToolKind}
      onSelectSource={skillsDock.setSelectedSourceId}
      onToggleSkillSelection={skillsDock.toggleSkillSelection}
      onToggleSelectAllVisible={skillsDock.toggleSelectAllVisible}
      onCreateBundle={skillsDock.createLocalBundle}
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
      availableSkills={skillsDock.availableMemberSkills}
      sources={skillsDock.sources}
      usageMap={skillsDock.usageMap}
      installedApps={skillsDock.installedApps}
      aiSummary={skillsDock.selectedSkillAiSummary}
      selectedAiProvider={skillsDock.selectedAiProvider}
      onGenerateAiSummary={() => void skillsDock.generateAiSummary()}
      onGenerateAiSummaryWithProvider={(provider) =>
        void skillsDock.generateAiSummaryWithProvider(provider)
      }
      onRenameBundle={skillsDock.renameLocalBundle}
      onDeleteBundle={skillsDock.deleteLocalBundle}
      onToggleBundleMember={skillsDock.toggleBundleMember}
      onSetBundleDesiredApp={skillsDock.setBundleDesiredApp}
      onSyncBundle={(bundleId) => void skillsDock.syncBundle(bundleId)}
      onRepairBundle={(bundleId) => void skillsDock.repairBundle(bundleId)}
    />
  );
}

export default App;
