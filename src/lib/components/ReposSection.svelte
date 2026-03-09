<script lang="ts">
	import { reposStore } from '$lib/stores/repos.svelte';
	import { onMount } from 'svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import Skeleton from './Skeleton.svelte';

	let { limit = 0 }: { limit?: number } = $props();

	let visible = $state(false);

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

	$effect(() => {
		if (!reposStore.loading && filtered.length > 0) {
			requestAnimationFrame(() => { visible = true; });
		}
	});
</script>

<section>
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-50">Repositories</h2>
		<a href="/new" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--color-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[var(--color-surface)] hover:border-[color-mix(in_srgb,var(--color-primary)_19%,transparent)] transition-all duration-200">
			+ New
		</a>
	</div>

	{#if !limit}
	<div class="mb-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Find a repository..."
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-20 focus:border-[var(--color-primary)] transition-all duration-200"
		/>
	</div>
	{/if}

	{#if reposStore.loading}
		<div class="flex flex-col gap-3">
			{#each Array(3) as _, i}
				<div class="flex items-center gap-3 py-3" style="animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 100}ms;">
					<Skeleton width="14px" height="14px" rounded="rounded-sm" />
					<Skeleton width="60%" height="14px" />
				</div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="card p-8 text-center animate-fade-in">
			<RepoIcon size={24} color="var(--color-text)" />
			<p class="text-sm text-[var(--color-text)] opacity-30 mt-3">
				{search ? 'No repositories match your search.' : 'No repositories yet.'}
			</p>
			{#if !search}
			<a href="/new" class="inline-block mt-3 text-xs font-medium animated-link" style="color: var(--color-primary);">Create your first repository</a>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl border border-[var(--color-border)] overflow-hidden divide-y divide-white/[0.04]">
			{#each filtered as repo, i}
				<a
					href="/{repo.owner}/{repo.name}"
					class="flex items-center gap-3 px-4 py-3 transition-all duration-200 group"
					style="
						opacity: {visible ? 1 : 0};
						transform: {visible ? 'translateY(0)' : 'translateY(8px)'};
						transition-delay: {i * 40}ms;
					"
					onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
					onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
				>
					<div class="shrink-0 opacity-40 group-hover:opacity-70 transition-all duration-200 group-hover:scale-110">
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
							<span class="text-sm font-semibold group-hover:underline transition-colors" style="color: var(--color-primary);">{repo.name}</span>
							{#if repo.is_private}
								<span class="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500/60 border border-yellow-500/10 ml-1">Private</span>
							{/if}
						</div>
						{#if repo.description}
							<p class="text-xs text-[var(--color-text)] opacity-25 truncate mt-0.5">{repo.description}</p>
						{/if}
					</div>
					<span class="text-[0.6875rem] text-[var(--color-text)] opacity-15 shrink-0 group-hover:opacity-30 transition-opacity">
						<RelativeTime date={repo.updated_at} />
					</span>
				</a>
			{/each}
		</div>
		{#if hasMore}
			<p class="text-xs text-center mt-3">
				<a href="/dashboard" class="opacity-40 hover:opacity-70 text-[var(--color-text)] transition-opacity animated-link">View all {reposStore.repos.length} repositories</a>
			</p>
		{/if}
	{/if}
</section>
