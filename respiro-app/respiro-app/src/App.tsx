import { useState } from "react";
import { Apnea } from "./screens/Apnea";
import { History } from "./screens/History";
import { Home, type Nav } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Respira, type RespiraSub } from "./screens/Respira";
import { Settings } from "./screens/Settings";
import { TestSession } from "./screens/TestSession";
import { useStore } from "./store";
import type { TableType } from "./types";

type Tab = "home" | "apnea" | "respira" | "storico";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "apnea", label: "Apnea" },
  { id: "respira", label: "Respira" },
  { id: "storico", label: "Storico" },
];

export default function App() {
  const { profile } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [table, setTable] = useState<TableType | undefined>();
  const [sub, setSub] = useState<RespiraSub | undefined>();
  const [settings, setSettings] = useState(false);
  const [onboardingTest, setOnboardingTest] = useState(false);

  if (!profile.onboarded) return <Onboarding onTest={() => setOnboardingTest(true)} />;
  if (onboardingTest) return <TestSession showCoach onClose={() => setOnboardingTest(false)} />;
  if (settings) return <Settings onClose={() => setSettings(false)} />;

  const go: Nav["go"] = (t, opts) => {
    setTable(opts?.table);
    setSub(opts?.sub);
    setTab(t);
  };

  return (
    <div className="app">
      <main className="page">
        {tab === "home" && <Home go={go} openSettings={() => setSettings(true)} />}
        {tab === "apnea" && <Apnea key={table ?? "menu"} initialTable={table} onConsumed={() => setTable(undefined)} />}
        {tab === "respira" && <Respira key={sub ?? "pranayama"} initial={sub} />}
        {tab === "storico" && <History />}
      </main>
      <nav className="tabbar" aria-label="Sezioni">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
