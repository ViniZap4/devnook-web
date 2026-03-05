<script lang="ts">
	import { onMount } from 'svelte';
	import { admin, repos as reposApi } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let repos = $state<Repository[]>([]);
	let loading = $state(true);
	let search = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalCount = $state(0);
	let searchTimeout: ReturnType<typeof setTimeout>;

	async function loadRepos() {
		loading = true;
		try {
			const result = await admin.listRepos({ page: currentPage, q: search || undefined });
			repos = result.repos;
			totalPages = result.total_pages;
			totalCount = result.total_count;
		} catch {
			repos = [];
		} finally {
			loading = false;
		}
	}

	onMount(loadRepos);

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			currentPage = 1;
			loadRepos();
		}, 300);
	}

	async function deleteRepo(owner: string, name: string) {
		if (!confirm(`Delete repository "${owner}/${name}"? This action cannot be undone.`)) return;
		try {
			await reposApi.remove(owner, name);
			repos = repos.filter(r => !(r.owner === owner && r.name === name));
			totalCount--;
		} catch {
			// ignore
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-2xl font-bold" style="color: var(--color-text);">Repositories</h1>
			<p class="text-sm mt-1" style="color: var(--color-text-dim);">
				{totalCount} {totalCount === 1 ? 'repository' : 'repositories'} total
			</p>
		</div>
	</div>

	<!-- Search -->
	<div class="max-w-md">
		<input
			type="text"
			bind:value={search}
			oninput={handleSearchInput}
			placeholder="Search repositories..."
			class="w-full px-4 py-2.5 text-sm rounded-xl border bg-transparent transition-colors focus:border-[var(--color-primary)]"
			style="border-color: var(--color-border); color: var(--color-text);"
		/>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading repositories...</div>
	{:else if repos.length === 0}
		<div class="rounded-xl border p-12 text-center" style="border-color: var(--color-border);">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-20" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
			</svg>
			<p class="text-sm" style="color: var(--color-text-dim);">{search ? 'No repositories match your search.' : 'No repositories found.'}</p>
		</div>
	{:else}
		<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
			{#each repos as repo, i}
				<div
					class="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--color-surface)] {i > 0 ? 'border-t' : ''}"
					style="border-color: var(--color-border);"
				>
					<div class="shrink-0 opacity-40">
						{#if repo.is_private}
							<LockIcon size={16} />
						{:else}
							<RepoIcon size={16} />
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<a href="/{repo.owner}/{repo.name}" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">
								{repo.owner}/{repo.name}
							</a>
							{#if repo.is_private}
								<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full border border-yellow-500/20 text-yellow-500/60">Private</span>
							{/if}
							{#if repo.is_fork}
								<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full border" style="border-color: var(--color-border); color: var(--color-text-dim);">Fork</span>
							{/if}
						</div>
						{#if repo.description}
							<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{repo.description}</p>
						{/if}
					</div>
					<div class="flex items-center gap-3 shrink-0">
						{#if repo.stars_count}
							<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
								<svg class="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
								{repo.stars_count}
							</span>
						{/if}
						<span class="text-xs" style="color: var(--color-text-dim);">
							<RelativeTime date={repo.updated_at} />
						</span>
						<button
							class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10"
							style="border-color: var(--color-border); color: var(--color-error);"
							onclick={() => deleteRepo(repo.owner, repo.name)}
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-3">
				<button
					class="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-[var(--color-surface)] disabled:opacity-20"
					style="border-color: var(--color-border); color: var(--color-text);"
					disabled={currentPage <= 1}
					onclick={() => { currentPage--; loadRepos(); }}
				>Previous</button>
				<span class="text-sm" style="color: var(--color-text-dim);">{currentPage} / {totalPages}</span>
				<button
					class="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-[var(--color-surface)] disabled:opacity-20"
					style="border-color: var(--color-border); color: var(--color-text);"
					disabled={currentPage >= totalPages}
					onclick={() => { currentPage++; loadRepos(); }}
				>Next</button>
			</div>
		{/if}
	{/if}
</div>
