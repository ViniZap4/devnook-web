import { createPersistedState } from './persisted.svelte';

const pins = createPersistedState<number[]>('devnook:pinned-convos', []);

export function pin(id: number) {
	if (!pins.value.includes(id)) {
		pins.value = [...pins.value, id];
	}
}

export function unpin(id: number) {
	pins.value = pins.value.filter((p) => p !== id);
}

export function isPinned(id: number): boolean {
	return pins.value.includes(id);
}

export function togglePin(id: number) {
	if (isPinned(id)) {
		unpin(id);
	} else {
		pin(id);
	}
}

export const pinnedIds = {
	get value() {
		return pins.value;
	}
};
