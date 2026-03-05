<script lang="ts">
	import { notifications } from '$lib/services/api';
	import type { Notification } from '$lib/types/notification';
	import { onMount } from 'svelte';

	let unreadCount = $state(0);
	let items = $state<Notification[]>([]);
	let open = $state(false);
	let loading = $state(false);

	onMount(() => {
		fetchCount();
		const interval = setInterval(fetchCount, 30000);
		return () => clearInterval(interval);
	});

	async function fetchCount() {
		try {
			const res = await notifications.unreadCount();
			unreadCount = res.count;
		} catch {
			// ignore
		}
	}

	async function toggle() {
		open = !open;
		if (open && items.length === 0) {
			loading = true;
			try {
				items = await notifications.list(true);
			} catch {
				// ignore
			} finally {
				loading = false;
			}
		}
	}

	async function markRead(id: number) {
		try {
			await notifications.markRead(id);
			items = items.filter(n => n.id !== id);
			unreadCount = Math.max(0, unreadCount - 1);
		} catch {
			// ignore
		}
	}

	async function markAllRead() {
		try {
			await notifications.markAllRead();
			items = [];
			unreadCount = 0;
		} catch {
			// ignore
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.notification-dropdown')) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative notification-dropdown">
	<button
		class="relative p-2 rounded-lg transition-colors hover:bg-[var(--color-surface)]"
		style="color: var(--color-text-dim);"
		onclick={toggle}
	>
		<svg class="w-4.5 h-4.5" viewBox="0 0 16 16" fill="currentColor">
			<path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Z"/>
		</svg>
		{#if unreadCount > 0}
			<span class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[0.5625rem] font-bold rounded-full text-white" style="background-color: var(--color-primary);">
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if open}
		<div class="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-xl z-50" style="background-color: var(--color-surface); border-color: var(--color-border);">
			<div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-border);">
				<a href="/notifications" class="text-sm font-semibold hover:underline" style="color: var(--color-text);" onclick={() => { open = false; }}>Notifications</a>
				{#if items.length > 0}
					<button
						class="text-xs hover:underline"
						style="color: var(--color-primary);"
						onclick={markAllRead}
					>Mark all read</button>
				{/if}
			</div>

			{#if loading}
				<div class="px-4 py-6 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
			{:else if items.length === 0}
				<div class="px-4 py-6 text-center text-sm" style="color: var(--color-text-dim);">No unread notifications</div>
			{:else}
				{#each items as item}
					<div class="flex items-start gap-3 px-4 py-3 border-b hover:bg-[var(--color-background)] transition-colors" style="border-color: var(--color-border);">
						<div class="flex-1 min-w-0">
							<a href={item.link} class="text-sm font-medium hover:underline block truncate" style="color: var(--color-text);" onclick={() => { open = false; }}>
								{item.title}
							</a>
							<span class="text-xs" style="color: var(--color-text-dim);">{item.type}</span>
						</div>
						<button
							class="text-xs shrink-0 opacity-40 hover:opacity-100"
							style="color: var(--color-text);"
							onclick={() => markRead(item.id)}
						>
							&times;
						</button>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
