import { Injectable } from "@nestjs/common";
import type { NoteModel } from "./notes.model";

const notes: NoteModel[] = [
  {
    id: "free-note-1",
    type: "free",
    title: "Hipotese de abertura do argumento",
    content:
      "Conectar a dor da fragmentacao ao custo cognitivo de alternar entre pesquisa, notas e escrita.",
    tags: ["rascunho", "introducao"],
    createdAt: "2026-05-09T12:10:00.000Z",
    updatedAt: "2026-05-11T09:20:00.000Z",
  },
  {
    id: "reference-note-1",
    type: "reference",
    title: "Rastreabilidade fortalece a escrita academica",
    content:
      "Usar notas vinculadas a fontes ajuda a sustentar o argumento e reduz retrabalho na fase de referencias.",
    tags: ["abnt", "metodologia", "citacao"],
    createdAt: "2026-05-09T12:00:00.000Z",
    updatedAt: "2026-05-12T16:45:00.000Z",
    source: {
      excerpt:
        "A rastreabilidade das informacoes utilizadas na escrita e condicao basica para verificacao, reproducao e legitimidade do texto academico.",
      label: "Revista Brasileira de Escrita Cientifica",
      href: "https://example.org/rastreabilidade-escrita-cientifica",
      citation: "(SILVA, 2023)",
      abntReference:
        "SILVA, Marina. Escrita cientifica e rastreabilidade documental. Revista Brasileira de Escrita Cientifica, Sao Paulo, v. 12, n. 3, p. 45-61, 2023.",
      bibliographyId: "ref-silva-2023",
      details: ["Artigo", "v. 12", "n. 3", "p. 45-61"],
    },
  },
  {
    id: "reference-note-2",
    type: "reference",
    title: "Nota de referencia para discussao teorica",
    content:
      "Este trecho pode entrar no desenvolvimento com apoio direto da citacao autor-data.",
    tags: ["teoria", "fonte-externa"],
    createdAt: "2026-05-10T14:30:00.000Z",
    source: {
      excerpt:
        "Ferramentas de escrita assistida precisam explicitar a proveniencia do conhecimento reutilizado para preservar confianca e auditabilidade.",
      label: "Anais do Simposio de Humanidades Digitais",
      href: "https://example.org/proveniencia-ferramentas-escrita",
      citation: "(ALMEIDA; COSTA, 2024)",
      abntReference:
        "ALMEIDA, Renata; COSTA, Bruno. Proveniencia e confianca em ferramentas de escrita assistida. In: SIMPOSIO DE HUMANIDADES DIGITAIS, 8., 2024, Recife. Anais... Recife: SHD, 2024. p. 88-102.",
      bibliographyId: "ref-almeida-costa-2024",
      details: ["Anais", "Recife", "p. 88-102"],
    },
  },
  {
    id: "free-note-2",
    type: "free",
    title: "Lembrete de fechamento",
    content:
      "Fechar a secao retomando que o drawer funciona como memoria de trabalho compartilhada entre Lab e Write.",
    tags: ["lembrete", "conclusao"],
    createdAt: "2026-05-12T08:15:00.000Z",
  },
];

@Injectable()
export class NotesService {
  findAll(): NoteModel[] {
    return notes;
  }
}
