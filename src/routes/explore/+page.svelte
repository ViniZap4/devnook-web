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
	let visible = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout>;

	async function loadRepos() {
		loading = true;
		visible = false;
		try {
			const result = await explore.repos({ page: currentPage, q: search || undefined, sort });
			repos = result.repos;
			totalPages = result.total_pages;
			totalCount = result.total_count;
		} catch {
			repos = [];
		} finally {
			loading = false;
			requestAnimationFrame(() => { visible = true; });
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

<PageShell maxWidth="max-w-6xl">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between animate-fade-up">
			<div>
				<h1 class="text-2xl font-bold gradient-text">Explore</h1>
				<p class="text-sm mt-1" style="color: var(--color-text-dim);">Discover public repositories</p>
			</div>
			{#if !loading}
				<span
					class="text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-300"
					style="background-color: var(--color-surface); color: var(--color-text-dim); border: 1px solid var(--color-border);"
				>
					{totalCount} {totalCount === 1 ? 'repository' : 'repositories'}
				</span>
			{/if}
		</div>

		<!-- Filters -->
		<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-up stagger-1">
			<div class="flex-1 relative group">
				<svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 group-focus-within:text-[var(--color-primary)]" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					bind:value={search}
					oninput={onSearchInput}
					placeholder="Search repositories..."
					class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-surface) 70%, transparent); backdrop-filter: blur(12px); color: var(--color-text);"
				/>
			</div>
			<div class="flex items-center gap-1 rounded-xl p-1 glass-subtle">
				{#each [['updated', 'Recent'], ['created', 'Newest'], ['name', 'Name']] as [val, label]}
					<button
						class="px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
						style="
							color: {sort === val ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							background: {sort === val ? 'var(--color-primary)10' : 'transparent'};
							font-weight: {sort === val ? '600' : '400'};
						"
						onclick={() => changeSort(val)}
					>
						{label}
					</button>
				{/each}
			</div>
		</div>

		<!-- List -->
		{#if loading}
			<div class="flex flex-col gap-3">
				{#each Array(5) as _, i}
					<div class="rounded-xl border p-5 skeleton-loading" style="border-color: var(--color-border); animation-delay: {i * 100}ms;">
						<div class="flex flex-col gap-2">
							<Skeleton width="40%" height="16px" />
							<Skeleton width="70%" height="12px" />
						</div>
					</div>
				{/each}
			</div>
		{:else if repos.length === 0}
			<div class="rounded-xl border p-16 text-center animate-fade-in" style="border-color: var(--color-border);">
				<svg class="w-12 h-12 mx-auto mb-4 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
				<p class="text-sm" style="color: var(--color-text-dim);">
					{search ? 'No repositories match your search.' : 'No public repositories yet.'}
				</p>
			</div>
		{:else}
			<div class="rounded-xl border overflow-hidden divide-y animate-fade-up stagger-2" style="border-color: var(--color-border); --tw-divide-opacity: 1; divide-color: var(--color-border);">
				{#each repos as repo, i}
					<a
						href="/{repo.owner}/{repo.name}"
						class="flex items-start gap-4 px-5 py-4 transition-all duration-200 group"
						style="
							opacity: {visible ? 1 : 0};
							transform: {visible ? 'translateY(0)' : 'translateY(8px)'};
							transition-delay: {i * 40}ms;
						"
						onmouseenter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
						onmouseleave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
					>
						<div class="shrink-0 mt-1 opacity-40 group-hover:opacity-70 transition-all duration-200 group-hover:scale-110">
							{#if repo.is_private}
								<LockIcon size={16} />
							{:else}
								<RepoIcon size={16} />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-sm" style="color: var(--color-text-dim);">{repo.owner}</span>
								<span style="color: var(--color-text); opacity: 0.15;">/</span>
								<span class="text-sm font-bold group-hover:underline" style="color: var(--color-primary);">{repo.name}</span>
								{#if repo.is_private}
									<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full border border-yellow-500/20 text-yellow-500/60">Private</span>
								{/if}
								{#if repo.is_fork}
									<span class="text-[0.5625rem] px-1.5 py-0.5 rounded-full border" style="border-color: var(--color-border); color: var(--color-text-dim);">Fork</span>
								{/if}
							</div>
							{#if repo.description}
								<p class="text-sm mt-1.5 line-clamp-2" style="color: var(--color-text-dim);">{repo.description}</p>
							{/if}
							{#if repo.topics && repo.topics.length > 0}
								<div class="flex flex-wrap gap-1.5 mt-2">
									{#each repo.topics.slice(0, 5) as topic}
										<span class="text-[0.625rem] px-2 py-0.5 rounded-full font-medium transition-colors duration-200" style="background-color: var(--color-primary)12; color: var(--color-primary);">{topic}</span>
									{/each}
								</div>
							{/if}
							<div class="flex items-center gap-4 mt-2.5">
								{#if repo.stars_count}
									<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
										<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
										{repo.stars_count}
									</span>
								{/if}
								{#if repo.forks_count}
									<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
										<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
										{repo.forks_count}
									</span>
								{/if}
								<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.6;">
									Updated <RelativeTime date={repo.updated_at} />
								</span>
								<span class="text-xs px-1.5 py-0.5 rounded" style="background-color: var(--color-surface-hover); color: var(--color-text-dim);">
									{repo.default_branch}
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-3 mt-2">
					<button
						class="px-4 py-2 text-sm rounded-xl border transition-all duration-200 hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)30] disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97]"
						style="border-color: var(--color-border); color: var(--color-text);"
						disabled={currentPage <= 1}
						onclick={() => { currentPage--; loadRepos(); }}
					>
						Previous
					</button>
					<span class="text-sm font-medium px-3 py-1 rounded-lg" style="color: var(--color-text-dim); background: var(--color-surface);">
						{currentPage} / {totalPages}
					</span>
					<button
						class="px-4 py-2 text-sm rounded-xl border transition-all duration-200 hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)30] disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.97]"
						style="border-color: var(--color-border); color: var(--color-text);"
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
