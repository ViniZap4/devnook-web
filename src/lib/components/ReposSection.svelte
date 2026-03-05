<script lang="ts">
	import { reposStore } from '$lib/stores/repos.svelte';
	import { onMount } from 'svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
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
		<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">Repositories</h2>
		<a href="/new" class="text-xs font-medium rounded-md px-2.5 py-1 border border-white/10 text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-white/5 transition-all">
			+ New
		</a>
	</div>

	{#if !limit}
	<div class="mb-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Find a repository..."
			class="w-full px-3 py-2 text-sm rounded-lg border border-white/[0.08] bg-white/[0.03] text-[var(--color-text)] placeholder:opacity-20 focus:border-[var(--palette-0)] transition-colors"
		/>
	</div>
	{/if}

	{#if reposStore.loading}
		<div class="flex flex-col gap-3">
			{#each Array(3) as _}
				<div class="flex items-center gap-3 py-3">
					<Skeleton width="14px" height="14px" rounded="rounded-sm" />
					<Skeleton width="60%" height="14px" />
				</div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="card p-8 text-center">
			<RepoIcon size={24} color="var(--color-text)" />
			<p class="text-sm text-[var(--color-text)] opacity-30 mt-3">
				{search ? 'No repositories match your search.' : 'No repositories yet.'}
			</p>
			{#if !search}
			<a href="/new" class="inline-block mt-3 text-xs font-medium" style="color: var(--palette-0);">Create your first repository</a>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
			{#each filtered as repo}
				<a href="/{repo.owner}/{repo.name}" class="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
					<div class="shrink-0 opacity-40 group-hover:opacity-70 transition-opacity">
						{#if repo.is_private}
							<LockIcon size={14} />
						{:else}
							<RepoIcon size={14} />
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-1.5">
							<span class="text-sm text-[var(--color-text)] opacity-50">{repo.owner}</span>
							<span class="text-[var(--color-text)] opacity-15">/</span>
							<span class="text-sm font-semibold group-hover:underline" style="color: var(--palette-0);">{repo.name}</span>
							{#if repo.is_private}
								<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500/60 border border-yellow-500/10 ml-1">Private</span>
							{/if}
						</div>
						{#if repo.description}
							<p class="text-xs text-[var(--color-text)] opacity-25 truncate mt-0.5">{repo.description}</p>
						{/if}
					</div>
					<span class="text-[0.6875rem] text-[var(--color-text)] opacity-15 shrink-0">
						<RelativeTime date={repo.updated_at} />
					</span>
				</a>
			{/each}
		</div>
		{#if hasMore}
			<p class="text-xs text-center mt-3">
				<a href="/dashboard" class="opacity-40 hover:opacity-70 text-[var(--color-text)] transition-opacity">View all {reposStore.repos.length} repositories</a>
			</p>
		{/if}
	{/if}
</section>
