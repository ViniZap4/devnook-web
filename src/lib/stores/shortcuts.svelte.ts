import type { Shortcut } from '$lib/types/shortcuts';
import { shortcuts as api } from '$lib/services/api';
import { toastStore } from '$lib/stores/toast.svelte';

interface ContextMenuData {
	x: number;
	y: number;
	shortcut: Shortcut;
}

let shortcutsList = $state<Shortcut[]>([]);
let editShortcut = $state<Shortcut | null>(null);
let contextMenu = $state<ContextMenuData | null>(null);
let loading = $state(false);

export const shortcutsStore = {
	get shortcuts() { return shortcutsList; },
	set shortcuts(v: Shortcut[]) { shortcutsList = v; },
	get loading() { return loading; },

	get editShortcut() { return editShortcut; },
	set editShortcut(v: Shortcut | null) { editShortcut = v; },

	get contextMenu() { return contextMenu; },
	set contextMenu(v: ContextMenuData | null) { contextMenu = v; },

	async load() {
		loading = true;
		try {
			shortcutsList = await api.list();
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	},

	async create(title: string, url: string) {
		try {
			const res = await api.create({ title, url });
			shortcutsList = [...shortcutsList, { id: res.id, title, url }];
			toastStore.success('Shortcut created');
		} catch (e) {
			toastStore.error(e instanceof Error ? e.message : 'Failed to create shortcut');
			throw e;
		}
	},

	async update(id: number, title: string, url: string) {
		try {
			await api.update(id, { title, url });
			shortcutsList = shortcutsList.map((s) =>
				s.id === id ? { ...s, title, url } : s
			);
			toastStore.success('Shortcut updated');
		} catch (e) {
			toastStore.error(e instanceof Error ? e.message : 'Failed to update shortcut');
			throw e;
		}
	},

	async remove(id: number) {
		try {
			await api.remove(id);
			shortcutsList = shortcutsList.filter((s) => s.id !== id);
			toastStore.success('Shortcut deleted');
		} catch (e) {
			toastStore.error(e instanceof Error ? e.message : 'Failed to delete shortcut');
			throw e;
		}
	}
};
