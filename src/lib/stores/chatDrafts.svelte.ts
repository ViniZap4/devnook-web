import { createPersistedState } from './persisted.svelte';

const drafts = createPersistedState<Record<number, string>>('devnook:chat-drafts', {});

export function getDraft(convoId: number): string {
	return drafts.value[convoId] ?? '';
}

export function setDraft(convoId: number, text: string) {
	if (text === '') {
		const next = { ...drafts.value };
		delete next[convoId];
		drafts.value = next;
	} else {
		drafts.value = { ...drafts.value, [convoId]: text };
	}
}

export function clearDraft(convoId: number) {
	const next = { ...drafts.value };
	delete next[convoId];
	drafts.value = next;
}

export function hasDraft(convoId: number): boolean {
	return convoId in drafts.value && drafts.value[convoId] !== '';
}
