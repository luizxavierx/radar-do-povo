export interface Politician {
  id: number;
  name: string;
  party: string;
  state: string;
  photo: string;
  amendments: number;
  totalValue: string;
  rank: number;
}

export const mockDeputados: Politician[] = [
  { id: 1, name: "ELCIONE BARBALHO", party: "MDB", state: "PA", photo: "https://www.camara.leg.br/internet/deputado/bandep/74075.jpg", amendments: 4, totalValue: "R$ 18.637.991,08", rank: 1 },
  { id: 2, name: "JOÃO CARLOS BACELAR", party: "PL", state: "BA", photo: "https://www.camara.leg.br/internet/deputado/bandep/141458.jpg", amendments: 7, totalValue: "R$ 18.637.990,08", rank: 2 },
  { id: 3, name: "GUILHERME UCHOA", party: "PSB", state: "PE", photo: "https://www.camara.leg.br/internet/deputado/bandep/220664.jpg", amendments: 13, totalValue: "R$ 18.637.983,91", rank: 3 },
  { id: 4, name: "JOSE PRIANTE", party: "MDB", state: "PA", photo: "https://www.camara.leg.br/internet/deputado/bandep/74079.jpg", amendments: 17, totalValue: "R$ 18.637.974,08", rank: 4 },
  { id: 5, name: "JULIO LOPES", party: "PP", state: "RJ", photo: "https://www.camara.leg.br/internet/deputado/bandep/74253.jpg", amendments: 9, totalValue: "R$ 18.637.962,19", rank: 5 },
  { id: 6, name: "RAIMUNDO SANTOS", party: "PSD", state: "PA", photo: "https://www.camara.leg.br/internet/deputado/bandep/74084.jpg", amendments: 17, totalValue: "R$ 18.632.990,83", rank: 6 },
  { id: 7, name: "DETINHA", party: "PL", state: "MA", photo: "https://www.camara.leg.br/internet/deputado/bandep/220689.jpg", amendments: 21, totalValue: "R$ 18.622.990,08", rank: 7 },
  { id: 8, name: "DOMINGOS NETO", party: "PSD", state: "CE", photo: "https://www.camara.leg.br/internet/deputado/bandep/178981.jpg", amendments: 15, totalValue: "R$ 18.600.000,00", rank: 8 },
];

export const mockSenadores: Politician[] = [
  { id: 101, name: "DAVI ALCOLUMBRE", party: "UNIÃO", state: "AP", photo: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5765.jpg", amendments: 12, totalValue: "R$ 32.500.000,00", rank: 1 },
  { id: 102, name: "ANGELO CORONEL", party: "PSD", state: "BA", photo: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5936.jpg", amendments: 8, totalValue: "R$ 29.800.000,00", rank: 2 },
  { id: 103, name: "MARCELO CASTRO", party: "MDB", state: "PI", photo: "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5540.jpg", amendments: 10, totalValue: "R$ 28.100.000,00", rank: 3 },
];
