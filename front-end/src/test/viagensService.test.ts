import { describe, expect, it } from "vitest";

import { normalizeViagensFilter } from "@/services/viagensService";

describe("viagensService filters", () => {
  it("defaults the general dashboard to apenasParlamentares false", () => {
    expect(normalizeViagensFilter()).toEqual({ apenasParlamentares: false });
  });

  it("always clears parliamentary-only flags in the viagens dashboard", () => {
    expect(
      normalizeViagensFilter({
        anoInicio: 2025,
        anoFim: 2025,
        apenasParlamentares: true,
        cargoParlamentar: "DEPUTADO",
      })
    ).toEqual({
      anoInicio: 2025,
      anoFim: 2025,
      orgaoSuperiorCodigo: undefined,
      orgaoSolicitanteCodigo: undefined,
      search: undefined,
      situacao: undefined,
      processoId: undefined,
      pcdp: undefined,
      cpfViajante: undefined,
      nomeViajante: undefined,
      cargo: undefined,
      funcao: undefined,
      destino: undefined,
      motivo: undefined,
      apenasParlamentares: false,
      cargoParlamentar: undefined,
    });
  });
});
