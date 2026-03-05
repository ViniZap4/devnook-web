<script lang="ts">
	import { onMount } from 'svelte';
	import { explore } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import PageShell from '$lib/components/PageShell.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let repos = $state<Repository[]>([]);
	let loading = $state(true);
	let search = $state('');
	let sort = $state('updated');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalCount = $state(0);

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function loadRepos() {
		loading = true;
		try {
			const result = await explore.repos({ page: currentPage, q: search || undefined, sort });
			repos = result.repos;
			totalPages = result.total_pages;
			totalCount = result.total_count;
		} catch {
			repos = [];
		} finally {
			loading = false;
		}
	}

	function onSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			currentPage = 1;
			loadRepos();
		}, 300);
	}

	function changeSort(s: string) {
		sort = s;
		currentPage = 1;
		loadRepos();
	}

	onMount(loadRepos);
</script>

<PageShell>
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div>
			<h1 class="text-[var(--color-text)] text-2xl font-bold">Explore</h1>
			<p class="text-sm text-[var(--color-text)] opacity-40 mt-1">Discover public repositories</p>
		</div>

		<!-- Filters -->
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
			<div class="flex-1">
				<input
					type="text"
					bind:value={search}
					oninput={onSearchInput}
					placeholder="Search repositories..."
					class="w-full px-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-white/[0.03] text-[var(--color-text)] placeholder:opacity-20 focus:border-[var(--palette-0)] transition-colors"
				/>
			</div>
			<div class="flex items-center gap-1 rounded-xl border border-white/[0.08] p-1">
				{#each [['updated', 'Recently updated'], ['created', 'Newest'], ['name', 'Name']] as [val, label]}
					<button
						class="px-3 py-1.5 text-xs rounded-lg transition-colors {sort === val ? 'bg-white/[0.08] text-[var(--color-text)] font-medium' : 'text-[var(--color-text)] opacity-40 hover:opacity-70'}"
						onclick={() => changeSort(val)}
					>
						{label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Results count -->
		{#if !loading}
			<p class="text-xs text-[var(--color-text)] opacity-30">
				{totalCount} public {totalCount === 1 ? 'repository' : 'repositories'} found
			</p>
		{/if}

		<!-- List -->
		{#if loading}
			<div class="flex flex-col gap-4">
				{#each Array(5) as _}
					<div class="card p-5">
						<div class="flex flex-col gap-2">
							<Skeleton width="40%" height="16px" />
							<Skeleton width="70%" height="12px" />
						</div>
					</div>
				{/each}
			</div>
		{:else if repos.length === 0}
			<div class="card p-12 text-center">
				<RepoIcon size={32} color="var(--color-text)" />
				<p class="text-[var(--color-text)] opacity-30 mt-4">
					{search ? 'No repositories match your search.' : 'No public repositories yet.'}
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each repos as repo}
					<a href="/{repo.owner}/{repo.name}" class="card p-5 hover:border-white/[0.12] transition-colors group">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<RepoIcon size={16} color="var(--color-text)" />
									<span class="text-sm text-[var(--color-text)] opacity-50">{repo.owner}</span>
									<span class="text-[var(--color-text)] opacity-15">/</span>
									<span class="text-sm font-bold group-hover:underline" style="color: var(--palette-0);">{repo.name}</span>
								</div>
								{#if repo.description}
									<p class="text-sm text-[var(--color-text)] opacity-40 mt-2 line-clamp-2">{repo.description}</p>
								{/if}
								<div class="flex items-center gap-4 mt-3">
									<span class="text-xs text-[var(--color-text)] opacity-20">
										Updated <RelativeTime date={repo.updated_at} />
									</span>
									<span class="text-xs text-[var(--color-text)] opacity-20">
										{repo.default_branch}
									</span>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-3 mt-4">
					<button
						class="px-4 py-2 text-sm rounded-lg border border-white/10 text-[var(--color-text)] hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
						disabled={currentPage <= 1}
						onclick={() => { currentPage--; loadRepos(); }}
					>
						Previous
					</button>
					<span class="text-sm text-[var(--color-text)] opacity-30">
						{currentPage} / {totalPages}
					</span>
					<button
						class="px-4 py-2 text-sm rounded-lg border border-white/10 text-[var(--color-text)] hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
						disabled={currentPage >= totalPages}
						onclick={() => { currentPage++; loadRepos(); }}
					>
						Next
					</button>
				</div>
			{/if}
		{/if}
	</div>
</PageShell>
