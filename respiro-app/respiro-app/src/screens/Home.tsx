import { fmt, fmtDateTime } from "../lib/format";
import { useStore } from "../store";
import type { TableType } from "../types";
import type { RespiraSub } from "./Respira";

export interface Nav {
  go: (tab: "home" | "apnea" | "respira" | "storico", opts?: { table?: TableType; sub?: RespiraSub }) => void;
  openSettings: () => void;
}

export function Home({ go, openSettings }: Nav) {
  const { profile, sessions } = useStore();
  const lastTable = sessions.find((s) => s.type === "co2" || s.type === "o2");
  const next: TableType = lastTable?.type === "co2" ? "o2" : "co2";
  const last = sessions[0];

  return (
    <>
      <header className="head">
        <div>
          <h1>Respiro</h1>
          <p className="sub">{profile.level === "beginner" ? "Livello principiante" : "Livello intermedio"}</p>
        </div>
        <button className="btn ghost small" onClick={openSettings}>
          Impostazioni
        </button>
      </header>

      <section className="card">
        <h2>Personal best</h2>
        {profile.pb ? (
          <div className="row between">
            <span className="pbbig">{fmt(profile.pb)}</span>
            <span className="hint">
              {profile.pbHistory.length ? `aggiornato il ${new Date(profile.pbHistory[profile.pbHistory.length - 1].date).toLocaleDateString("it-IT")}` : ""}
            </span>
          </div>
        ) : (
          <p className="hint">Non hai ancora un PB. Misuralo con il test del massimo.</p>
        )}
      </section>

      <section className="card">
        <h2>Sessione suggerita</h2>
        {profile.pb ? (
          <>
            <p>
              Oggi una tabella <b>{next === "co2" ? "CO2" : "O2"}</b>. Una sola al giorno, alternando CO2 e O2, con almeno un giorno di riposo a settimana.
            </p>
            <button className="btn" onClick={() => go("apnea", { table: next })}>
              Apri la tabella {next === "co2" ? "CO2" : "O2"}
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => go("apnea")}>
            Vai al test del massimo
          </button>
        )}
      </section>

      <div className="list" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <button className="item" onClick={() => go("apnea", { table: "co2" })} disabled={!profile.pb}>
          <b>CO2</b>
        </button>
        <button className="item" onClick={() => go("apnea", { table: "o2" })} disabled={!profile.pb}>
          <b>O2</b>
        </button>
        <button className="item" onClick={() => go("respira", { sub: "pranayama" })}>
          <b>Pranayama</b>
        </button>
        <button className="item" onClick={() => go("respira", { sub: "guided" })}>
          <b>Audiomeditazioni</b>
        </button>
      </div>

      {last && (
        <section className="card">
          <h2>Ultima sessione</h2>
          <div className="row between">
            <span>
              <b>{last.title}</b>
              <br />
              <span className="hint">{fmtDateTime(last.startedAt)}</span>
            </span>
            <span className="pat">{fmt(last.durationSec)}</span>
          </div>
        </section>
      )}
    </>
  );
}
