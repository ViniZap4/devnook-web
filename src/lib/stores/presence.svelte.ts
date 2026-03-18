import { browser } from '$app/environment';
import { wsStore } from '$lib/stores/websocket.svelte';

let onlineSet = $state<Set<string>>(new Set());

if (browser) {
	$effect.root(() => {
		// presence_list: full replacement of online user list
		const offList = wsStore.on('presence_list', (data: { usernames: string[] }) => {
			if (Array.isArray(data?.usernames)) {
				onlineSet = new Set(data.usernames);
			}
		});

		// presence_update: individual user coming online or going offline
		const offUpdate = wsStore.on(
			'presence_update',
			(data: { username: string; online: boolean }) => {
				if (typeof data?.username !== 'string') return;
				const next = new Set(onlineSet);
				if (data.online) {
					next.add(data.username);
				} else {
					next.delete(data.username);
				}
				onlineSet = next;
			}
		);

		return () => {
			offList();
			offUpdate();
		};
	});
}

export function isOnline(username: string): boolean {
	return onlineSet.has(username);
}

export const onlineUsers = {
	get value(): Set<string> {
		return onlineSet;
	}
};

export function resetPresence() {
	onlineSet = new Set();
}
