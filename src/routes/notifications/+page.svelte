<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { notifications } from '$lib/services/api';
	import type { Notification } from '$lib/types/notification';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let items = $state<Notification[]>([]);
	let loading = $state(true);
	let filter = $state<'unread' | 'all'>('unread');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await load();
	});

	async function load() {
		loading = true;
		try {
			items = await notifications.list(filter === 'unread' ? true : undefined);
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

	function switchFilter(f: 'unread' | 'all') {
		filter = f;
		load();
	}

	function typeIcon(type: string): { color: string; label: string } {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star' };
		return { color: 'var(--color-text-dim)', label: type };
	}
</script>

<PageShell maxWidth="max-w-4xl">
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-bold" style="color: var(--color-text);">Notifications</h1>
			{#if items.length > 0 && filter === 'unread'}
				<button
					class="text-xs font-medium hover:underline"
					style="color: var(--color-primary);"
					onclick={markAllRead}
				>Mark all as read</button>
			{/if}
		</div>

		<div class="flex items-center gap-1 rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="{filter === 'unread' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => switchFilter('unread')}
			>Unread</button>
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="{filter === 'all' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => switchFilter('all')}
			>All</button>
		</div>

		{#if loading}
			<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
		{:else if items.length === 0}
			<div class="rounded-xl border p-16 text-center" style="border-color: var(--color-border);">
				<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
				</svg>
				<p class="text-sm" style="color: var(--color-text-dim);">
					{filter === 'unread' ? 'No unread notifications' : 'No notifications'}
				</p>
			</div>
		{:else}
			<div class="rounded-xl border overflow-hidden divide-y" style="border-color: var(--color-border); divide-color: var(--color-border);">
				{#each items as item}
					{@const meta = typeIcon(item.type)}
					<div class="flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--color-surface)] transition-colors">
						<span class="mt-0.5 text-[0.625rem] px-1.5 py-0.5 rounded font-semibold shrink-0" style="background-color: {meta.color}20; color: {meta.color};">
							{meta.label}
						</span>
						<div class="min-w-0 flex-1">
							<a href={item.link} class="text-sm font-medium hover:underline block" style="color: var(--color-text);">{item.title}</a>
							{#if item.created_at}
								<span class="text-xs" style="color: var(--color-text-dim);"><RelativeTime date={item.created_at} /></span>
							{/if}
						</div>
						{#if filter === 'unread'}
							<button
								class="text-xs shrink-0 px-2 py-1 rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
								style="border-color: var(--color-border); color: var(--color-text-dim);"
								onclick={() => markRead(item.id)}
							>Done</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
