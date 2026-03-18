<script lang="ts">
	import { notifPanelStore } from '$lib/stores/notifPanel.svelte';
	import { notifications } from '$lib/services/api';
	import type { Notification } from '$lib/types/notification';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { onMount, onDestroy } from 'svelte';
	import RelativeTime from './RelativeTime.svelte';
	import Spinner from './Spinner.svelte';

	let items = $state<Notification[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let unsubNotif: (() => void) | null = null;

	$effect(() => {
		if (notifPanelStore.open && !loaded) {
			loadItems();
		}
	});

	onMount(() => {
		unsubNotif = wsStore.on('notification', (data: Notification) => {
			items = [data, ...items];
		});
	});

	onDestroy(() => {
		unsubNotif?.();
	});

	async function loadItems() {
		loading = true;
		try {
			items = await notifications.list(true);
			loaded = true;
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	}

	async function markRead(id: number) {
		try {
			await notifications.markRead(id);
			items = items.filter(n => n.id !== id);
		} catch {
			// ignore
		}
	}

	async function markAllRead() {
		try {
			await notifications.markAllRead();
			items = [];
		} catch {
			// ignore
		}
	}

	function typeColor(type: string): string {
		if (type === 'issue') return 'var(--color-success)';
		if (type === 'pull_request') return 'var(--color-secondary)';
		if (type === 'star') return 'var(--color-warning)';
		return 'var(--color-text-dim)';
	}
</script>

{#if notifPanelStore.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="notif-backdrop" onclick={() => notifPanelStore.close()} onkeydown={() => {}}></div>

	<div class="notif-panel">
		<div class="notif-header">
			<h2 class="text-sm font-semibold" style="color: var(--color-text);">Notifications</h2>
			<div class="flex items-center gap-2">
				{#if items.length > 0}
					<button
						class="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
						style="color: var(--color-primary);"
						onclick={markAllRead}
					>Mark all read</button>
				{/if}
				<button
					class="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
					style="color: var(--color-text-dim);"
					onclick={() => notifPanelStore.close()}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>

		<div class="notif-list">
			{#if loading}
				<div class="py-8 flex flex-col items-center gap-2">
					<Spinner size="xs" />
					<span class="text-xs" style="color: var(--color-text-dim);">Loading...</span>
				</div>
			{:else if items.length === 0}
				<div class="py-12 text-center">
					<svg class="w-10 h-10 mx-auto mb-3 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-sm" style="color: var(--color-text-dim);">All caught up!</p>
				</div>
			{:else}
				{#each items as item}
					<div class="notif-item group">
						<div class="w-2 h-2 rounded-full mt-1.5 shrink-0" style="background-color: {typeColor(item.type)};"></div>
						<div class="flex-1 min-w-0">
							<a
								href={item.link}
								class="text-sm font-medium block truncate hover:underline"
								style="color: var(--color-text);"
								onclick={() => notifPanelStore.close()}
							>{item.title}</a>
							<div class="flex items-center gap-1.5 mt-0.5">
								<span class="text-[0.625rem]" style="color: {typeColor(item.type)};">{item.type === 'pull_request' ? 'PR' : item.type}</span>
								{#if item.created_at}
									<span class="text-[0.625rem]" style="color: var(--color-text-dim);"><RelativeTime date={item.created_at} /></span>
								{/if}
							</div>
						</div>
						<button
							class="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(255,255,255,0.05)]"
							style="color: var(--color-text-dim);"
							onclick={() => markRead(item.id)}
							title="Mark as read"
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</button>
					</div>
				{/each}
			{/if}
		</div>

		<a
			href="/notifications"
			class="notif-footer-link"
			onclick={() => notifPanelStore.close()}
		>View all notifications</a>
	</div>
{/if}

<style>
	.notif-backdrop {
		position: fixed;
		inset: 0;
		z-index: 49;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(2px);
		animation: fadeIn 0.2s ease;
	}

	.notif-panel {
		position: fixed;
		top: 12px;
		right: 12px;
		bottom: 12px;
		width: 380px;
		max-width: calc(100vw - 24px);
		z-index: 50;
		display: flex;
		flex-direction: column;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}

	.notif-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--glass-border);
		flex-shrink: 0;
	}

	.notif-list {
		flex: 1;
		overflow-y: auto;
	}

	.notif-item {
		display: flex;
		align-items: start;
		gap: 12px;
		padding: 12px 20px;
		border-bottom: 1px solid var(--glass-border);
		transition: background 0.15s;
	}
	.notif-item:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.notif-footer-link {
		display: block;
		padding: 12px;
		text-align: center;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-primary);
		border-top: 1px solid var(--glass-border);
		transition: background 0.15s;
		flex-shrink: 0;
		text-decoration: none;
	}
	.notif-footer-link:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideIn {
		from { opacity: 0; transform: translateX(20px); }
		to { opacity: 1; transform: translateX(0); }
	}
</style>
