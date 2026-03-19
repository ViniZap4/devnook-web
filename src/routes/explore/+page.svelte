<script lang="ts">
	import { onMount } from 'svelte';
	import { explore } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import PageShell from '$lib/components/PageShell.svelte';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let repos = $state<Repository[]>([]);
	let loading = $state(true);
	let search = $state('');
	let sort = $state('updated');
	let language = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalCount = $state(0);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let fetchId = 0;

	const langColors: Record<string, string> = {
		Go: '#00add8',
		JavaScript: '#f1e05a',
		TypeScript: '#3178c6',
		Python: '#3572a5',
		Rust: '#dea584',
		Java: '#b07219',
		Ruby: '#701516',
		Swift: '#f05138',
		'C++': '#f34b7d',
		Other: '#8b8b8b'
	};

	const languages = ['Go', 'JavaScript', 'TypeScript', 'Python', 'Rust', 'Java', 'Ruby', 'Swift', 'C++', 'Other'];

	type CategoryTab = {
		id: string;
		label: string;
		sort: string;
	};

	const categoryTabs: CategoryTab[] = [
		{ id: 'all', label: 'All', sort: 'updated' },
		{ id: 'trending', label: 'Trending', sort: 'stars' },
		{ id: 'most-starred', label: 'Most Starred', sort: 'stars' },
		{ id: 'recently-created', label: 'Recently Created', sort: 'created' },
		{ id: 'recently-updated', label: 'Recently Updated', sort: 'updated' }
	];

	let activeTab = $state('all');

	const uniqueOwners = $derived(new Set(repos.map((r) => r.owner)).size);

	function getLangColor(lang?: string): string {
		if (!lang) return '#8b8b8b';
		return langColors[lang] || '#8b8b8b';
	}

	async function loadRepos() {
		loading = true;
		const id = ++fetchId;
		try {
			const result = await explore.repos({
				page: currentPage,
				q: search || undefined,
				sort,
				language: language || undefined
			});
			if (id !== fetchId) return;
			repos = result.repos;
			totalPages = result.total_pages;
			totalCount = result.total_count;
		} catch {
			if (id !== fetchId) return;
			repos = [];
		} finally {
			if (id !== fetchId) return;
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

	function selectTab(tab: CategoryTab) {
		activeTab = tab.id;
		sort = tab.sort;
		currentPage = 1;
		loadRepos();
	}

	function selectLanguage(lang: string) {
		if (language === lang) {
			language = '';
		} else {
			language = lang;
		}
		currentPage = 1;
		loadRepos();
	}

	onMount(loadRepos);
</script>

<PageShell>
	<div class="flex flex-col gap-6">
		<!-- Hero Section -->
		<div class="text-center py-8 animate-fade-up">
			<h1 class="text-3xl sm:text-4xl font-extrabold gradient-text tracking-tight">
				Explore Repositories
			</h1>
			<p class="text-sm mt-3" style="color: var(--color-text-dim);">
				{#if !loading}
					Discover {totalCount} public {totalCount === 1 ? 'repository' : 'repositories'} across
					the platform
				{:else}
					Discover public repositories across the platform
				{/if}
			</p>

			<!-- Search -->
			<div class="max-w-2xl mx-auto mt-6 relative group">
				<svg
					class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 group-focus-within:text-[var(--color-primary)]"
					style="color: var(--color-text-dim);"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					bind:value={search}
					oninput={onSearchInput}
					placeholder="Search repositories by name, description, or topic..."
					class="w-full pl-12 pr-4 py-3.5 text-sm rounded-xl border transition-all duration-200 focus:border-[var(--color-primary)]"
					style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
				/>
			</div>
		</div>

		<!-- Stats Banner -->
		{#if !loading}
			<div
				class="card flex items-center justify-center gap-3 text-xs py-2.5 px-4 animate-fade-up stagger-1"
				style="color: var(--color-text-dim);"
			>
				<span class="flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
					</svg>
					<strong style="color: var(--color-text);">{totalCount}</strong> total repositories
				</span>
				<span style="color: var(--glass-border);">&#183;</span>
				<span class="flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<strong style="color: var(--color-text);">{uniqueOwners}</strong> contributors
				</span>
			</div>
		{/if}

		<!-- Category Tabs -->
		<div class="card p-1 animate-fade-up stagger-2">
			<div
				class="flex items-center gap-1 overflow-x-auto"
				style="scrollbar-width: none;"
			>
				{#each categoryTabs as tab}
					<button
						class="px-4 py-2 text-xs rounded-lg transition-all duration-200 whitespace-nowrap"
						style="
							color: {activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							background: {activeTab === tab.id ? 'var(--color-primary-subtle)' : 'transparent'};
							font-weight: {activeTab === tab.id ? '600' : '400'};
						"
						onclick={() => selectTab(tab)}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Language Filter -->
		<div class="card p-3 animate-fade-up stagger-3">
			<div
				class="flex items-center gap-2 overflow-x-auto pb-0"
				style="scrollbar-width: none;"
			>
				{#each languages as lang}
					<button
						class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all duration-200 whitespace-nowrap shrink-0"
						style="
							border-color: {language === lang ? 'var(--color-primary)' : 'var(--glass-border)'};
							background: {language === lang ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.06)'};
							color: {language === lang ? '#fff' : 'var(--color-text-dim)'};
							font-weight: {language === lang ? '600' : '400'};
						"
						onclick={() => selectLanguage(lang)}
					>
						<span
							class="w-2 h-2 rounded-full shrink-0"
							style="background-color: {getLangColor(lang)};"
						></span>
						{lang}
					</button>
				{/each}
			</div>
		</div>

		<!-- List -->
		{#if loading}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
				{#each Array(6) as _, i}
					<div class="card p-5 skeleton-loading" style="animation-delay: {i * 80}ms;">
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-3">
								<Skeleton width="32px" height="32px" rounded="rounded-full" />
								<div class="flex-1">
									<Skeleton width="60%" height="14px" />
									<div class="mt-1.5"><Skeleton width="40%" height="10px" /></div>
								</div>
							</div>
							<Skeleton width="90%" height="12px" />
							<Skeleton width="50%" height="12px" />
						</div>
					</div>
				{/each}
			</div>
		{:else if repos.length === 0}
			<div class="card p-16 text-center animate-fade-in">
				<svg
					class="w-12 h-12 mx-auto mb-4 opacity-15"
					style="color: var(--color-text);"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
					/>
				</svg>
				<p class="text-sm" style="color: var(--color-text-dim);">
					{search
						? 'No repositories match your search.'
						: language
							? `No repositories found for ${language}.`
							: 'No public repositories yet.'}
				</p>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
				{#each repos as repo, i}
					<a
						href="/{repo.owner}/{repo.name}"
						class="card group flex flex-col gap-3 p-5 transition-all duration-200 hover:scale-[1.015] hover:border-[var(--color-primary-subtle)] animate-fade-up"
						style="animation-delay: {Math.min(i * 50, 400)}ms;"
					>
						<!-- Card Header -->
						<div class="flex items-center gap-3">
							<Avatar username={repo.owner} size={32} />
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-xs truncate" style="color: var(--color-text-dim);">
										{repo.owner}
									</span>
									<span style="color: var(--color-text); opacity: 0.15;">/</span>
									<span
										class="text-sm font-bold truncate group-hover:underline"
										style="color: var(--color-primary);"
									>
										{repo.name}
									</span>
								</div>
								<div class="flex items-center gap-1.5 mt-0.5">
									{#if repo.is_private}
										<span
											class="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-medium"
											style="background: var(--color-warning-subtle); border: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent); color: var(--color-warning);"
										>
											Private
										</span>
									{/if}
									{#if repo.is_fork}
										<span
											class="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-medium"
											style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); color: var(--color-text-dim);"
										>
											Fork
										</span>
									{/if}
								</div>
							</div>
							<div class="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity duration-200">
								{#if repo.is_private}
									<LockIcon size={16} />
								{:else}
									<RepoIcon size={16} />
								{/if}
							</div>
						</div>

						<!-- Description -->
						{#if repo.description}
							<p class="text-xs leading-relaxed line-clamp-2" style="color: var(--color-text-dim);">
								{repo.description}
							</p>
						{:else}
							<p class="text-xs italic" style="color: var(--color-text-dim); opacity: 0.5;">
								No description
							</p>
						{/if}

						<!-- Topics -->
						{#if repo.topics && repo.topics.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each repo.topics.slice(0, 4) as topic}
									<span
										class="text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
										style="background-color: var(--color-primary-subtle); color: var(--color-primary);"
									>
										{topic}
									</span>
								{/each}
								{#if repo.topics.length > 4}
									<span
										class="text-[0.625rem] px-2 py-0.5 rounded-full"
										style="color: var(--color-text-dim);"
									>
										+{repo.topics.length - 4}
									</span>
								{/if}
							</div>
						{/if}

						<!-- Footer Stats -->
						<div
							class="flex items-center gap-3 pt-2 mt-auto border-t text-xs"
							style="border-color: var(--glass-border); color: var(--color-text-dim);"
						>
							{#if repo.language}
								<span class="flex items-center gap-1.5">
									<span
										class="w-2.5 h-2.5 rounded-full shrink-0"
										style="background-color: {getLangColor(repo.language)};"
									></span>
									{repo.language}
								</span>
							{/if}
							{#if repo.stars_count}
								<span class="flex items-center gap-1">
									<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
										<path
											d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
										/>
									</svg>
									{repo.stars_count}
								</span>
							{/if}
							{#if repo.forks_count}
								<span class="flex items-center gap-1">
									<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
										<path
											d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
										/>
									</svg>
									{repo.forks_count}
								</span>
							{/if}
							<span class="ml-auto">
								<RelativeTime date={repo.updated_at} />
							</span>
						</div>
					</a>
				{/each}
			</div>

			<Pagination page={currentPage} {totalPages} onPageChange={(p) => { currentPage = p; loadRepos(); }} />
		{/if}
	</div>
</PageShell>
