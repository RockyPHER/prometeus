import {
  createEmptyWriterDocument,
  ensureWriterDocument,
  normalizeWriterDocument,
  type WriterDocument,
} from "@/features/write/document/writerDocument";
import { syncWriterReferences } from "@/features/write/document/writeReferences";

export const WRITE_STORAGE_KEY = "prometeus:write-document:v1";

export function loadWriterDocument() {
  if (typeof window === "undefined") {
    return createEmptyWriterDocument();
  }

  const rawValue = window.localStorage.getItem(WRITE_STORAGE_KEY);

  if (!rawValue) {
    return createEmptyWriterDocument();
  }

  try {
    const parsed = JSON.parse(rawValue);
    return hydrateWriterDocument(normalizeWriterDocument(parsed));
  } catch {
    return createEmptyWriterDocument();
  }
}

export function saveWriterDocument(document: WriterDocument) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WRITE_STORAGE_KEY, JSON.stringify(document));
}

export function hydrateWriterDocument(document: WriterDocument) {
  const ensuredDocument = ensureWriterDocument(document);

  return {
    ...ensuredDocument,
    references: syncWriterReferences(
      ensuredDocument.blocks,
      ensuredDocument.references,
    ),
  };
}
