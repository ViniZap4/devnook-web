import { createPersistedState } from './persisted.svelte';

const unread = createPersistedState<number[]>('devnook:marked-unread', []);

export function markUnread(id: number) {
	if (!unread.value.includes(id)) {
		unread.value = [...unread.value, id];
	}
}

export function clearUnread(id: number) {
	unread.value = unread.value.filter((u) => u !== id);
}

export function isMarkedUnread(id: number): boolean {
	return unread.value.includes(id);
}
