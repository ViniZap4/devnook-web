import type { Organization } from '$lib/types/organization';
import { orgs as api } from '$lib/services/api';

let orgsList = $state<Organization[]>([]);
let loading = $state(false);

export const orgsStore = {
	get orgs() { return orgsList; },
	get loading() { return loading; },

	async load() {
		loading = true;
		try {
			orgsList = await api.list();
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	},

	async create(data: { name: string; display_name: string; description: string }) {
		const res = await api.create(data);
		await this.load();
		return res;
	},

	async remove(name: string) {
		await api.remove(name);
		orgsList = orgsList.filter((o) => o.name !== name);
	},

	async addMember(orgName: string, username: string, role: string = 'member') {
		await api.addMember(orgName, { username, role });
	},

	async removeMember(orgName: string, username: string) {
		await api.removeMember(orgName, username);
	}
};
