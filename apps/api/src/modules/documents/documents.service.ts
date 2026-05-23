import { Injectable } from "@nestjs/common";
import type { DocumentModel } from "./documents.model";

const documents: DocumentModel[] = [
  {
    id: "document-alpha",
    projectId: "project-alpha",
    title: "Rascunho inicial",
    markdown: "",
    createdAt: "2026-05-20T00:00:00.000Z",
  },
];

@Injectable()
export class DocumentsService {
  findAll(): DocumentModel[] {
    return documents;
  }
}
