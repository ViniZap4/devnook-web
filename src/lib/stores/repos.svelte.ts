import type { Repository } from '$lib/types/repository';
import { repos as api } from '$lib/services/api';

let reposList = $state<Repository[]>([]);
let loading = $state(false);

export const reposStore = {
	get repos() { return reposList; },
	get loading() { return loading; },

	async load() {
		loading = true;
		try {
			reposList = await api.list();
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	},

	async create(data: { name: string; description: string; is_private: boolean }) {
		const res = await api.create(data);
		await this.load();
		return res;
	},

	async remove(owner: string, name: string) {
		await api.remove(owner, name);
		reposList = reposList.filter((r) => !(r.owner === owner && r.name === name));
	}
};
