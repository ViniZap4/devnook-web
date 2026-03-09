<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { notifications } from '$lib/services/api';
	import Spinner from '$lib/components/Spinner.svelte';
	import type { Notification } from '$lib/types/notification';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let items = $state<Notification[]>([]);
	let loading = $state(true);
	let filter = $state<'unread' | 'all'>('unread');
	let visible = $state(false);
	let markingAll = $state(false);

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await load();
	});

	async function load() {
		loading = true;
		visible = false;
		try {
			items = await notifications.list(filter === 'unread' ? true : undefined);
		} catch {
			// ignore
		} finally {
			loading = false;
			requestAnimationFrame(() => { visible = true; });
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
		markingAll = true;
		try {
			await notifications.markAllRead();
			items = [];
		} catch {
			// ignore
		} finally {
			markingAll = false;
		}
	}

	function switchFilter(f: 'unread' | 'all') {
		filter = f;
		load();
	}

	function typeIcon(type: string): { color: string; label: string; svg: string } {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue', svg: '<circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>' };
		if (type === 'mention') return { color: 'var(--color-info)', label: 'Mention', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>' };
		return { color: 'var(--color-text-dim)', label: type, svg: '<circle cx="12" cy="12" r="3"/>' };
	}
</script>

<PageShell maxWidth="max-w-4xl">
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between animate-fade-up">
			<div class="flex items-center gap-3">
				<svg class="w-6 h-6" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
				</svg>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Notifications</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Stay up to date with your repositories</p>
				</div>
			</div>
			{#if items.length > 0 && filter === 'unread'}
				<button
					class="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 hover:bg-[var(--color-surface)] active:scale-[0.97]"
					style="border-color: var(--color-border); color: var(--color-primary);"
					onclick={markAllRead}
					disabled={markingAll}
				>
					{markingAll ? 'Marking...' : 'Mark all as read'}
				</button>
			{/if}
		</div>

		<div class="flex items-center gap-1 rounded-xl border p-1 self-start animate-fade-up stagger-1" style="border-color: var(--color-border);">
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200"
				style="{filter === 'unread' ? 'background-color: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => switchFilter('unread')}
			>Unread</button>
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200"
				style="{filter === 'all' ? 'background-color: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => switchFilter('all')}
			>All</button>
		</div>

		{#if loading}
			<div class="py-12 flex flex-col items-center gap-3">
				<Spinner size="md" />
				<span class="text-xs" style="color: var(--color-text-dim);">Loading notifications...</span>
			</div>
		{:else if items.length === 0}
			<div class="rounded-xl border p-16 text-center animate-fade-in" style="border-color: var(--color-border);">
				<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
				</svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">
					{filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
				</p>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">
					{filter === 'unread' ? 'You have no unread notifications.' : 'Notifications will appear here when you get them.'}
				</p>
			</div>
		{:else}
			<div class="rounded-xl border overflow-hidden divide-y animate-fade-up stagger-2" style="border-color: var(--color-border); divide-color: var(--color-border);">
				{#each items as item, i}
					{@const meta = typeIcon(item.type)}
					<div
						class="flex items-start gap-3 px-5 py-3.5 transition-all duration-200 group"
						style="
							opacity: {visible ? 1 : 0};
							transform: {visible ? 'translateX(0)' : 'translateX(12px)'};
							transition-delay: {i * 40}ms;
						"
						onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
						onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
					>
						<div class="mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110">
							<svg class="w-4 h-4" style="color: {meta.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								{@html meta.svg}
							</svg>
						</div>
						<div class="min-w-0 flex-1">
							<a href={item.link} class="text-sm font-medium block animated-link" style="color: var(--color-text);">{item.title}</a>
							{#if item.body}
								<p class="text-xs mt-0.5 leading-relaxed" style="color: var(--color-text-dim);">{item.body}</p>
							{/if}
							<div class="flex items-center gap-1.5 mt-0.5">
								<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium" style="background-color: color-mix(in srgb, {meta.color} 12%, transparent); color: {meta.color};">{meta.label}</span>
								{#if item.created_at}
									<span class="text-xs" style="color: var(--color-text-dim);"><RelativeTime date={item.created_at} /></span>
								{/if}
							</div>
						</div>
						{#if filter === 'unread'}
							<button
								class="text-xs shrink-0 px-2.5 py-1 rounded-lg border transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:border-[color-mix(in_srgb,var(--color-primary)_19%,transparent)] active:scale-[0.95] opacity-0 group-hover:opacity-100"
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
