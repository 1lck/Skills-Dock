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
      onSelectSource={skillsDock.setSelectedSourceId}
      onSelectStatus={skillsDock.setSelectedStatus}
      onSelectToolKind={skillsDock.setSelectedToolKind}
      onToggleApp={(skillId, app, enabled) =>
        void skillsDock.toggleApp(skillId, app, enabled)
      }
      search={skillsDock.search}
      selectedSkill={skillsDock.selectedSkill}
      selectedSourceId={skillsDock.selectedSourceId}
      selectedStatus={skillsDock.selectedStatus}
      selectedToolKind={skillsDock.selectedToolKind}
      skills={skillsDock.skills}
      sources={skillsDock.sources}
    />
  );
}

export default App;
