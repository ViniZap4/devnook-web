<script lang="ts">
	import { reposStore } from '$lib/stores/repos.svelte';
	import { onMount } from 'svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import Skeleton from './Skeleton.svelte';

	let { limit = 0 }: { limit?: number } = $props();

	onMount(() => {
		reposStore.load();
	});

	const displayRepos = $derived(limit > 0 ? reposStore.repos.slice(0, limit) : reposStore.repos);
	const hasMore = $derived(limit > 0 && reposStore.repos.length > limit);

	let search = $state('');
	const filtered = $derived(
		search
			? displayRepos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase()))
			: displayRepos
	);
</script>

<section>
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70">Repositories</h2>
		<a href="/new" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
			+ New
		</a>
	</div>

	{#if !limit}
	<div class="mb-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Find a repository..."
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[#0f1629] text-[var(--color-text)] placeholder:opacity-20 focus:border-[var(--color-primary)] transition-all duration-200"
		/>
	</div>
	{/if}

	{#if reposStore.loading}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each Array(4) as _, i}
				<div class="card-glow p-5 flex flex-col gap-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 100}ms;">
					<div class="flex items-center gap-3">
						<Skeleton width="14px" height="14px" rounded="rounded-sm" />
						<Skeleton width="60%" height="14px" />
					</div>
					<Skeleton width="80%" height="10px" />
					<div class="flex items-center gap-4 mt-auto">
						<Skeleton width="40px" height="10px" />
						<Skeleton width="30px" height="10px" />
					</div>
				</div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="card p-8 text-center animate-fade-in">
			<RepoIcon size={24} color="var(--color-text)" />
			<p class="text-sm text-[var(--color-text)] opacity-50 mt-3">
				{search ? 'No repositories match your search.' : 'No repositories yet.'}
			</p>
			{#if !search}
			<a href="/new" class="inline-block mt-3 text-xs font-medium animated-link" style="color: var(--color-primary);">Create your first repository</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each filtered as repo, i}
				<a href="/{repo.owner}/{repo.name}" class="card-glow p-5 flex flex-col gap-3 animate-fade-up stagger-{Math.min(i + 1, 8)}">
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
						</svg>
						<span class="font-semibold text-sm truncate" style="color: var(--color-text);">
							{repo.name}
						</span>
						{#if repo.is_private}
							<span class="text-[10px] px-2 py-0.5 rounded-full font-medium" style="background: var(--color-warning-subtle); color: var(--color-warning);">Private</span>
						{:else}
							<span class="text-[10px] px-2 py-0.5 rounded-full font-medium" style="background: var(--color-success-subtle); color: var(--color-success);">Public</span>
						{/if}
					</div>
					{#if repo.description}
						<p class="text-xs line-clamp-2" style="color: var(--color-text-dim);">{repo.description}</p>
					{/if}
					<div class="flex items-center gap-4 mt-auto text-xs" style="color: var(--color-text-dim);">
						<span class="flex items-center gap-1">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
							</svg>
							{repo.stars_count ?? 0}
						</span>
						<span class="ml-auto">
							<RelativeTime date={repo.updated_at} />
						</span>
					</div>
				</a>
			{/each}
		</div>
		{#if hasMore}
			<p class="text-xs text-center mt-3">
				<a href="/dashboard" class="opacity-60 hover:opacity-80 text-[var(--color-text)] transition-opacity animated-link">View all {reposStore.repos.length} repositories</a>
			</p>
		{/if}
	{/if}
</section>
