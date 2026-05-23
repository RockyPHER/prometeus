import type {
  Note,
  NoteInsertPayload,
  PrometeusEventPayloadMap,
  ReferenceNavigationPayload,
} from "@prometeus/core";

export const WRITE_INSERT_EVENT = "prometeus:write-insert-note";
export const REFERENCE_FOCUS_EVENT = "prometeus:reference-focus";
export const NOTE_EDIT_EVENT = "prometeus:note-edit";
export const NOTE_DRAG_MIME = "application/x-prometeus-note";

type PrometeusEventName = keyof PrometeusEventPayloadMap;
type PrometeusEventListener<TEventName extends PrometeusEventName> = (
  payload: PrometeusEventPayloadMap[TEventName],
) => void;

function dispatchPrometeusEvent<TEventName extends PrometeusEventName>(
  eventName: TEventName,
  payload: PrometeusEventPayloadMap[TEventName],
) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
}

function listenPrometeusEvent<TEventName extends PrometeusEventName>(
  eventName: TEventName,
  listener: PrometeusEventListener<TEventName>,
) {
  const eventListener = ((
    event: CustomEvent<PrometeusEventPayloadMap[TEventName]>,
  ) => {
    listener(event.detail);
  }) as EventListener;

  window.addEventListener(eventName, eventListener);

  return () => {
    window.removeEventListener(eventName, eventListener);
  };
}

export function dispatchWriteInsert(payload: NoteInsertPayload) {
  dispatchPrometeusEvent(WRITE_INSERT_EVENT, payload);
}

export function listenWriteInsert(
  listener: PrometeusEventListener<typeof WRITE_INSERT_EVENT>,
) {
  return listenPrometeusEvent(WRITE_INSERT_EVENT, listener);
}

export function dispatchReferenceFocus(payload: ReferenceNavigationPayload) {
  dispatchPrometeusEvent(REFERENCE_FOCUS_EVENT, payload);
}

export function listenReferenceFocus(
  listener: PrometeusEventListener<typeof REFERENCE_FOCUS_EVENT>,
) {
  return listenPrometeusEvent(REFERENCE_FOCUS_EVENT, listener);
}

export function dispatchNoteEdit(note: Note) {
  dispatchPrometeusEvent(NOTE_EDIT_EVENT, note);
}

export function buildInsertPayload(note: Note): NoteInsertPayload {
  if (note.type === "reference") {
    return {
      noteId: note.id,
      noteType: note.type,
      content: formatReferenceInsert(note.content, note.source.citation),
      citation: note.source.citation,
      bibliographyEntry: note.source.abntReference,
      bibliographyId: note.source.bibliographyId ?? note.id,
      sourceLabel: note.source.label,
      sourceUrl: note.source.href,
    };
  }

  return {
    noteId: note.id,
    noteType: note.type,
    content: note.content,
  };
}

export function buildReferenceNavigationPayload(
  note: Extract<Note, { type: "reference" }>,
): ReferenceNavigationPayload {
  return {
    noteId: note.id,
    bibliographyId: note.source.bibliographyId,
    citation: note.source.citation,
    href: note.source.href,
  };
}

function formatReferenceInsert(content: string, citation: string) {
  const text = content.trim().replace(/[.!?]+$/, "");

  return `${text} ${citation}.`;
}
