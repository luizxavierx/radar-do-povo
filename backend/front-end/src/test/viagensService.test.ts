import { describe, expect, it } from "vitest";

import {
  applyRecorteToViagensFilter,
  normalizeViagensFilter,
} from "@/services/viagensService";

describe("viagensService filters", () => {
  it("defaults the general dashboard to apenasParlamentares false", () => {
    expect(normalizeViagensFilter()).toEqual({ apenasParlamentares: false });
  });

  it("keeps the general recorte without cargoParlamentar", () => {
    expect(
      applyRecorteToViagensFilter("geral", {
        anoInicio: 2025,
        anoFim: 2025,
      })
    ).toEqual({
      anoInicio: 2025,
      anoFim: 2025,
      apenasParlamentares: false,
      cargoParlamentar: undefined,
    });
  });

  it("applies deputado recorte with parlamentar filtering enabled", () => {
    expect(
      applyRecorteToViagensFilter("deputados", {
        anoInicio: 2025,
        anoFim: 2025,
      })
    ).toEqual({
      anoInicio: 2025,
      anoFim: 2025,
      apenasParlamentares: true,
      cargoParlamentar: "DEPUTADO",
    });
  });

  it("applies senador recorte with parlamentar filtering enabled", () => {
    expect(
      applyRecorteToViagensFilter("senadores", {
        anoInicio: 2025,
        anoFim: 2025,
      })
    ).toEqual({
      anoInicio: 2025,
      anoFim: 2025,
      apenasParlamentares: true,
      cargoParlamentar: "SENADOR",
    });
  });

  it("preserves cargoParlamentar only when apenasParlamentares is true", () => {
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
      apenasParlamentares: true,
      cargoParlamentar: "DEPUTADO",
    });

    expect(
      normalizeViagensFilter({
        anoInicio: 2025,
        anoFim: 2025,
        apenasParlamentares: false,
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
