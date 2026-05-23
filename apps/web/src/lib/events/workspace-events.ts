export type UnsubscribeWorkspaceEvent = () => void;

export function onWindowEvent<K extends keyof WindowEventMap>(
  eventName: K,
  listener: (event: WindowEventMap[K]) => void,
): UnsubscribeWorkspaceEvent {
  window.addEventListener(eventName, listener);

  return () => {
    window.removeEventListener(eventName, listener);
  };
}
