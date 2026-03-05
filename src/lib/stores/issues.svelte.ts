import type { Issue } from '$lib/types/issue';
import { issues as api } from '$lib/services/api';

let issuesList = $state<Issue[]>([]);
let loading = $state(false);

export const issuesStore = {
	get issues() { return issuesList; },
	get loading() { return loading; },

	async load(owner: string, repo: string, state?: string) {
		loading = true;
		try {
			issuesList = await api.list(owner, repo, state);
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	},

	async create(owner: string, repo: string, data: { title: string; body: string }) {
		return await api.create(owner, repo, data);
	},

	async updateState(owner: string, repo: string, number: number, state: string) {
		await api.update(owner, repo, number, { state });
		issuesList = issuesList.map((i) =>
			i.number === number ? { ...i, state: state as 'open' | 'closed' } : i
		);
	},

	async addComment(owner: string, repo: string, number: number, body: string) {
		return await api.addComment(owner, repo, number, { body });
	}
};
