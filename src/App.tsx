import "./App.css";
import { AppShell } from "./components/layout/app-shell";
import { useSkillsDock } from "./hooks/use-skills-dock";

function App() {
  const skillsDock = useSkillsDock();

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
    />
  );
}

export default App;
