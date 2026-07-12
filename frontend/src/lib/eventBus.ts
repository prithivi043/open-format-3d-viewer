export const projectMemberBus = new EventTarget();

/**
 * Emit a project member update event.
 * @param member The updated member detail.
 */
export const emitProjectMemberUpdate = (member: any) => {
  projectMemberBus.dispatchEvent(new CustomEvent('member:update', { detail: member }));
};

/**
 * Subscribe to project member update events.
 * @param handler Callback invoked with the updated member detail.
 * @returns Unsubscribe function.
 */
export const onProjectMemberUpdate = (handler: (event: CustomEvent<any>) => void) => {
  const listener = (e: Event) => handler(e as CustomEvent<any>);
  projectMemberBus.addEventListener('member:update', listener);
  return () => projectMemberBus.removeEventListener('member:update', listener);
};
