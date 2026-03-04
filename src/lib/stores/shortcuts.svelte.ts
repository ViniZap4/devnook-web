import type { ShortCutProps } from '$lib/types/shortcuts';
import { shortcuts as api } from '$lib/services/api';

interface ContextMenuData {
	x: number;
	y: number;
	id: number;
	name: string;
	link: string;
}

let shortcutsList = $state<ShortCutProps[]>([]);
let editShortcutInfo = $state<ShortCutProps>({ id: 0, link: '', name: '' });
let contextMenu = $state<ContextMenuData | null>(null);
let loading = $state(false);

export const shortcutsStore = {
	get shortcuts() { return shortcutsList; },
	set shortcuts(v: ShortCutProps[]) { shortcutsList = v; },
	get loading() { return loading; },

	get editShortcutInfo() { return editShortcutInfo; },
	set editShortcutInfo(v: ShortCutProps) { editShortcutInfo = v; },

	get contextMenu() { return contextMenu; },
	set contextMenu(v: ContextMenuData | null) { contextMenu = v; },

	async load() {
		loading = true;
		try {
			const list = await api.list();
			shortcutsList = list.map((s) => ({ id: s.id, name: s.title, link: s.url }));
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	},

	async create(name: string, link: string) {
		const res = await api.create({ title: name, url: link });
		shortcutsList = [...shortcutsList, { id: res.id, name, link }];
	},

	async update(id: number, name: string, link: string) {
		await api.update(id, { title: name, url: link });
		shortcutsList = shortcutsList.map((s) =>
			s.id === id ? { ...s, name, link } : s
		);
	},

	async remove(id: number) {
		await api.remove(id);
		shortcutsList = shortcutsList.filter((s) => s.id !== id);
	}
};
