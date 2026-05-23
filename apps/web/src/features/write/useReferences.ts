import { useEffect, useRef, useState } from "react";
import { listenReferenceFocus } from "@/lib/events/note-events";

export function useReferences() {
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [focusedReferenceId, setFocusedReferenceId] = useState<string | null>(
    null,
  );
  const referenceRefs = useRef(new Map<string, HTMLElement>());

  function focusReference(bibliographyId: string) {
    setIsReferencesOpen(true);
    setFocusedReferenceId(bibliographyId);

    window.setTimeout(() => {
      referenceRefs.current
        .get(bibliographyId)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  }

  useEffect(() => {
    return listenReferenceFocus((payload) => {
      const bibliographyId = payload.bibliographyId;

      if (!bibliographyId) {
        return;
      }

      focusReference(bibliographyId);
    });
  }, []);

  useEffect(() => {
    if (!focusedReferenceId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFocusedReferenceId(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusedReferenceId]);

  function registerReference(id: string, element: HTMLElement | null) {
    if (!element) {
      referenceRefs.current.delete(id);
      return;
    }

    referenceRefs.current.set(id, element);
  }

  return {
    focusReference,
    focusedReferenceId,
    isReferencesOpen,
    registerReference,
    setIsReferencesOpen,
  };
}
