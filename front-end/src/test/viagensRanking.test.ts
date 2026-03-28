import { describe, expect, it } from "vitest";

import {
  filterVisibleTravelerRankings,
  isOpaqueTravelerName,
} from "@/lib/viagens";

describe("viagens ranking presentation", () => {
  it("detects masked or redacted traveler names", () => {
    expect(isOpaqueTravelerName("Sem Informacao")).toBe(true);
    expect(isOpaqueTravelerName("Informacoes protegidas por sigilo")).toBe(true);
    expect(isOpaqueTravelerName("Nao informado")).toBe(true);
    expect(isOpaqueTravelerName("OTO FERNANDO IFANGER")).toBe(false);
  });

  it("keeps only visible traveler rows in the top cards", () => {
    expect(
      filterVisibleTravelerRankings([
        { nomeViajante: "Sem Informacao" },
        { nomeViajante: "Informacoes protegidas por sigilo" },
        { nomeViajante: "OTO FERNANDO IFANGER" },
      ])
    ).toEqual([{ nomeViajante: "OTO FERNANDO IFANGER" }]);
  });
});
