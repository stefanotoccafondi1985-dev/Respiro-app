import { useEffect, useMemo, useState } from "react";
import { SafetyReminder } from "../components/Dialogs";
import { Stepper, Warning } from "../components/ui";
import { fmt } from "../lib/format";
import { defaultParams, generateTable, maxHoldRatio, totalSeconds, WARN_RATIO, type TableParams } from "../lib/tables";
import { useStore } from "../store";
import type { TableType } from "../types";
import { TableSession } from "./TableSession";
import { TestSession } from "./TestSession";

type View = { name: "menu" } | { name: "table"; type: TableType };

export function Apnea({ initialTable, onConsumed }: { initialTable?: TableType; onConsumed: () => void }) {
  const { profile } = useStore();
  const [view, setView] = useState<View>(initialTable ? { name: "table", type: initialTable } : { name: "menu" });
  const [testing, setTesting] = useState(false);
  const [confirmTest, setConfirmTest] = useState(false);

  useEffect(() => {
    if (initialTable) onConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (testing) return <TestSession onClose={() => setTesting(false)} />;

  if (view.name === "table") {
    return <TablePreview type={view.type} onBack={() => setView({ name: "menu" })} />;
  }

  return (
    <>
      <header>
        <h1>Apnea</h1>
        <p className="sub">Allenamento a secco con tabelle calcolate sul tuo personal best.</p>
      </header>
      <Warning>Solo seduti o sdraiati, a secco. Mai in acqua, alla guida o dopo iperventilazione.</Warning>
      <div className="list">
        <button className="item" onClick={() => setConfirmTest(true)}>
          <span>
            <b>Test del massimale</b>
            <small>Misura il tuo personal best</small>
          </span>
          <span className="pat">{profile.pb ? fmt(profile.pb) : "—"}</span>
        </button>
        <button className="item" disabled={!profile.pb} onClick={() => setView({ name: "table", type: "co2" })}>
          <span>
            <b>Tabella CO2</b>
            <small>Apnea costante, recuperi sempre più brevi</small>
          </span>
          <span className="pat">→</span>
        </button>
        <button className="item" disabled={!profile.pb} onClick={() => setView({ name: "table", type: "o2" })}>
          <span>
            <b>Tabella O2</b>
            <small>Recupero costante, apnee sempre più lunghe</small>
          </span>
          <span className="pat">→</span>
        </button>
      </div>
      {!profile.pb && <p className="hint">Le tabelle si sbloccano dopo il primo test del massimale, oppure inserendo il PB in Impostazioni.</p>}
      {confirmTest && <SafetyReminder onCancel={() => setConfirmTest(false)} onConfirm={() => (setConfirmTest(false), setTesting(true))} />}
    </>
  );
}

function TablePreview({ type, onBack }: { type: TableType; onBack: () => void }) {
  const { profile } = useStore();
  const pb = profile.pb ?? 0;
  const [params, setParams] = useState<TableParams>(() => defaultParams(profile.level));
  const [running, setRunning] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const rows = useMemo(() => generateTable(type, pb, profile.level, params), [type, pb, profile.level, params]);
  const ratio = maxHoldRatio(rows, pb);
  const set = (p: Partial<TableParams>) => setParams((x) => ({ ...x, ...p }));
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  if (running) return <TableSession type={type} rows={rows} onClose={() => (setRunning(false), onBack())} />;

  return (
    <>
      <header className="head">
        <div>
          <h1>Tabella {type === "co2" ? "CO2" : "O2"}</h1>
          <p className="sub">Calcolata su un PB di {fmt(pb)}.</p>
        </div>
        <button className="btn ghost small" onClick={onBack}>
          Indietro
        </button>
      </header>
      <div className="card">
        <div className="tblwrap">
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Recupero</th>
                <th>Apnea</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{fmt(r.rec)}</td>
                  <td className="hold">{fmt(r.hold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">Durata totale circa {Math.round(totalSeconds(rows) / 60)} min, con preparazione e defaticamento.</p>
      </div>
      {ratio > WARN_RATIO && <p className="note">Attenzione: almeno un'apnea supera l'85% del tuo PB. Riduci i valori se non ti senti pronto.</p>}
      <div className="card">
        <h2>Parametri</h2>
        <Stepper label="Round" value={params.rounds} min={4} max={10} step={1} onChange={(v) => set({ rounds: v })} />
        {type === "co2" ? (
          <>
            <Stepper label="Apnea (% del PB)" value={params.holdPct} min={0.3} max={0.8} step={0.05} format={pct} onChange={(v) => set({ holdPct: v })} />
            <Stepper label="Recupero iniziale" value={params.rec1} min={60} max={240} step={15} format={fmt} onChange={(v) => set({ rec1: v })} />
            <Stepper label="Riduzione a round" value={params.step} min={5} max={30} step={5} format={(v) => `${v} s`} onChange={(v) => set({ step: v })} />
          </>
        ) : (
          <>
            <Stepper label="Recupero fisso" value={params.o2rec} min={60} max={240} step={15} format={fmt} onChange={(v) => set({ o2rec: v })} />
            <Stepper label="Apnea iniziale (% PB)" value={params.o2s} min={0.3} max={0.7} step={0.05} format={pct} onChange={(v) => set({ o2s: v })} />
            <Stepper label="Apnea finale (% PB)" value={params.o2e} min={0.5} max={0.9} step={0.05} format={pct} onChange={(v) => set({ o2e: v })} />
          </>
        )}
        <button className="btn ghost small" onClick={() => setParams(defaultParams(profile.level))}>
          Ripristina i valori del livello
        </button>
      </div>
      <button className="btn full big" onClick={() => setConfirm(true)}>
        Avvia
      </button>
      {confirm && <SafetyReminder onCancel={() => setConfirm(false)} onConfirm={() => (setConfirm(false), setRunning(true))} />}
    </>
  );
}
