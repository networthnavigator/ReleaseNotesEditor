/** Domain service: generate a new unique id for a release note. */
export function generateNoteId(): string {
  return 'note-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}
