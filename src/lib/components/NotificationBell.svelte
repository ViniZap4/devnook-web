<script lang="ts">
	import { notifications } from '$lib/services/api';
	import type { Notification } from '$lib/types/notification';
	import { onMount } from 'svelte';
	import RelativeTime from './RelativeTime.svelte';

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

	function typeColor(type: string): string {
		if (type === 'issue') return 'var(--color-success)';
		if (type === 'pull_request') return 'var(--color-secondary)';
		if (type === 'star') return 'var(--color-warning)';
		return 'var(--color-text-dim)';
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative notification-dropdown">
	<button
		class="relative p-2 rounded-lg transition-all duration-200 hover:bg-[var(--color-surface)]"
		style="color: var(--color-text-dim);"
		onclick={toggle}
	>
		<svg class="w-4.5 h-4.5 transition-transform duration-200" style="transform: {open ? 'rotate(15deg)' : 'rotate(0)'};" viewBox="0 0 16 16" fill="currentColor">
			<path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Z"/>
		</svg>
		{#if unreadCount > 0}
			<span class="absolute -top-0.5 -right-0.5 min-w-4 h-4 flex items-center justify-center text-[0.5625rem] font-bold rounded-full text-white animate-pop-in" style="background-color: var(--color-primary);">
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if open}
		<div class="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-xl z-50 animate-scale-in-center" style="background-color: var(--color-surface); border-color: var(--color-border);">
			<div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: var(--color-border);">
				<a href="/notifications" class="text-sm font-semibold animated-link" style="color: var(--color-text);" onclick={() => { open = false; }}>Notifications</a>
				{#if items.length > 0}
					<button
						class="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
						style="color: var(--color-primary);"
						onclick={markAllRead}
					>Mark all read</button>
				{/if}
			</div>

			{#if loading}
				<div class="px-4 py-6 flex flex-col items-center gap-2">
					<div class="w-4 h-4 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
					<span class="text-xs" style="color: var(--color-text-dim);">Loading...</span>
				</div>
			{:else if items.length === 0}
				<div class="px-4 py-6 text-center">
					<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-xs" style="color: var(--color-text-dim);">All caught up!</p>
				</div>
			{:else}
				{#each items as item, i}
					<div
						class="flex items-start gap-3 px-4 py-3 border-b transition-all duration-200 group"
						style="border-color: var(--color-border); animation: fade-slide-in-sm 0.2s ease both; animation-delay: {i * 30}ms;"
						onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-background)'; }}
						onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
					>
						<div class="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style="background-color: {typeColor(item.type)};"></div>
						<div class="flex-1 min-w-0">
							<a href={item.link} class="text-sm font-medium block truncate animated-link" style="color: var(--color-text);" onclick={() => { open = false; }}>
								{item.title}
							</a>
							<div class="flex items-center gap-1.5 mt-0.5">
								<span class="text-[0.625rem]" style="color: {typeColor(item.type)};">{item.type === 'pull_request' ? 'PR' : item.type}</span>
								{#if item.created_at}
									<span class="text-[0.625rem]" style="color: var(--color-text-dim);"><RelativeTime date={item.created_at} /></span>
								{/if}
							</div>
						</div>
						<button
							class="text-xs shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded transition-all duration-200 hover:bg-[var(--color-surface-hover)]"
							style="color: var(--color-text-dim);"
							onclick={() => markRead(item.id)}
						>
							<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						</button>
					</div>
				{/each}
				<a
					href="/notifications"
					class="block px-4 py-2.5 text-center text-xs font-medium transition-colors hover:bg-[var(--color-background)]"
					style="color: var(--color-primary);"
					onclick={() => { open = false; }}
				>View all notifications</a>
			{/if}
		</div>
	{/if}
</div>
