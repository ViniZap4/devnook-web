<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { users } from '$lib/services/api';
	import type { ActivityItem } from '$lib/services/api';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let items = $state<ActivityItem[]>([]);
	let loading = $state(true);
	let visible = $state(false);
	let filter = $state<'all' | 'issues' | 'prs' | 'releases' | 'stars'>('all');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadActivity();
	});

	async function loadActivity() {
		loading = true;
		visible = false;
		try {
			items = await users.activity();
		} catch {
			items = [];
		} finally {
			loading = false;
			requestAnimationFrame(() => { visible = true; });
		}
	}

	const filterMap: Record<string, string> = {
		issues: 'issue',
		prs: 'pull_request',
		releases: 'release',
		stars: 'star',
	};

	const filteredItems = $derived(
		filter === 'all' ? items : items.filter(i => i.type === filterMap[filter])
	);

	function icon(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue', svg: '<circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'Pull Request', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>' };
		if (type === 'release') return { color: 'var(--color-primary)', label: 'Release', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>' };
		if (type === 'push') return { color: 'var(--color-info)', label: 'Push', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/>' };
		if (type === 'comment') return { color: 'var(--color-accent)', label: 'Comment', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' };
		if (type === 'fork') return { color: 'var(--color-info)', label: 'Fork', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6"/>' };
		return { color: 'var(--color-text-dim)', label: type, svg: '<circle cx="12" cy="12" r="3"/>' };
	}

	function groupByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
		const groups: Map<string, ActivityItem[]> = new Map();
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		for (const item of items) {
			const d = new Date(item.created_at);
			let label: string;
			if (d.toDateString() === today.toDateString()) {
				label = 'Today';
			} else if (d.toDateString() === yesterday.toDateString()) {
				label = 'Yesterday';
			} else {
				label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
			}
			if (!groups.has(label)) groups.set(label, []);
			groups.get(label)!.push(item);
		}
		return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
	}

	const groupedItems = $derived(groupByDate(filteredItems));
</script>

<PageShell maxWidth="max-w-4xl">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between page-header">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: var(--color-primary)10;">
					<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Activity Feed</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">What's happening across your repositories</p>
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="flex items-center gap-1 glass-subtle rounded-xl p-1 self-start card-animate stagger-1">
			{#each [['all', 'All'], ['issues', 'Issues'], ['prs', 'PRs'], ['releases', 'Releases'], ['stars', 'Stars']] as [val, label]}
				<button
					class="px-3 py-1.5 text-xs rounded-lg transition-all duration-200 font-medium"
					style="
						color: {filter === val ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {filter === val ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
						font-weight: {filter === val ? '600' : '400'};
					"
					onclick={() => { filter = val as typeof filter; }}
				>{label}</button>
			{/each}
		</div>

		<!-- Feed content -->
		{#if loading}
			<div class="py-16 flex flex-col items-center gap-3">
				<div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
				<span class="text-xs" style="color: var(--color-text-dim);">Loading activity...</span>
			</div>
		{:else if filteredItems.length === 0}
			<div class="card p-16 text-center card-animate stagger-2">
				<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">No activity yet</p>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">
					{filter === 'all' ? 'Activity from your repositories will appear here.' : `No ${filter} activity found.`}
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-6 card-animate stagger-2">
				{#each groupedItems as group}
					<!-- Date group header -->
					<div class="flex items-center gap-3">
						<span class="text-xs font-semibold uppercase tracking-wider shrink-0" style="color: var(--color-text-dim);">{group.label}</span>
						<div class="flex-1 h-px" style="background: var(--color-separator);"></div>
					</div>

					<!-- Timeline items -->
					<div class="relative ml-4 pl-6 border-l" style="border-color: var(--color-border);">
						{#each group.items as item, i}
							{@const meta = icon(item.type)}
							<div
								class="relative pb-6 last:pb-0 group"
								style="
									opacity: {visible ? 1 : 0};
									transform: {visible ? 'translateX(0)' : 'translateX(16px)'};
									transition: opacity 0.4s ease, transform 0.4s ease;
									transition-delay: {i * 50}ms;
								"
							>
								<!-- Timeline dot -->
								<div
									class="absolute -left-[calc(1.5rem+5px)] w-2.5 h-2.5 rounded-full ring-4 transition-transform duration-200 group-hover:scale-125"
									style="background: {meta.color}; ring-color: var(--color-background);"
								></div>

								<div class="card p-4 transition-all duration-200 group-hover:border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]">
									<div class="flex items-start gap-3">
										<div class="shrink-0 mt-0.5">
											<svg class="w-4 h-4" style="color: {meta.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												{@html meta.svg}
											</svg>
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2 flex-wrap">
												<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full font-semibold" style="background: {meta.color}15; color: {meta.color};">{meta.label}</span>
												<span class="text-xs" style="color: var(--color-text-dim);">
													<RelativeTime date={item.created_at} />
												</span>
											</div>
											<a
												href="/{item.repo_owner}/{item.repo_name}{item.number ? (item.type === 'pull_request' ? '/pulls/' : '/issues/') + item.number : ''}"
												class="text-sm font-medium mt-1.5 block animated-link"
												style="color: var(--color-text);"
											>{item.title}</a>
											<div class="flex items-center gap-2 mt-2 text-xs" style="color: var(--color-text-dim);">
												<Avatar username={item.author} size={16} />
												<span>{item.author}</span>
												<span style="opacity: 0.3;">in</span>
												<a href="/{item.repo_owner}/{item.repo_name}" class="animated-link font-medium" style="color: var(--color-primary);">{item.repo_owner}/{item.repo_name}</a>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
