import { describe, expect, it } from "vitest";
import { parseFx, parseFxStrict } from "./fx";

describe("effetti delle lezioni", () => {
  it("legge campana, impulsi e immagini", () => {
    expect(parseFxStrict("bowl")).toEqual({ bowl: { every: null } });
    expect(parseFxStrict("bowl:20")).toEqual({ bowl: { every: 20 } });
    expect(parseFxStrict("pulse:5")).toEqual({ pulse: { every: 5 } });
    expect(parseFxStrict("view:dark")).toEqual({ view: "dark" });
  });

  it("combina più effetti con +", () => {
    expect(parseFxStrict("bowl+view:dark")).toEqual({ bowl: { every: null }, view: "dark" });
  });

  it("nessun effetto per testo vuoto o assente", () => {
    expect(parseFxStrict("")).toEqual({});
    expect(parseFxStrict(undefined)).toEqual({});
  });

  it("rifiuta effetti sconosciuti o numeri sbagliati", () => {
    expect(parseFxStrict("pulse")).toBeNull();
    expect(parseFxStrict("pulse:0")).toBeNull();
    expect(parseFxStrict("bowl:2")).toBeNull();
    expect(parseFxStrict("view:viola")).toBeNull();
    expect(parseFxStrict("boom")).toBeNull();
  });

  it("parseFx è tollerante: se non capisce, non fa nulla", () => {
    expect(parseFx("boom")).toEqual({});
  });
});
