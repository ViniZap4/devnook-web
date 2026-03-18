import { createPersistedState } from './persisted.svelte';

export type SidebarMode = 'expanded' | 'compact' | 'auto' | 'hidden';

const stored = createPersistedState<SidebarMode>('devnook:sidebar-mode', 'expanded');

export const sidebarStore = {
	get mode() { return stored.value; },
	set mode(m: SidebarMode) { stored.value = m; },
};
