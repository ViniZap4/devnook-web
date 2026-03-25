<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { reposStore } from '$lib/stores/repos.svelte';
	import type { Repository } from '$lib/types/repository';
	import PageShell from '$lib/components/PageShell.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let searchQuery = $state('');
	let visibilityFilter = $state<'all' | 'public' | 'private'>('all');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await reposStore.load();
	});

	const filteredRepos = $derived(() => {
		let list: Repository[] = reposStore.repos;

		if (visibilityFilter === 'public') {
			list = list.filter((r) => !r.is_private);
		} else if (visibilityFilter === 'private') {
			list = list.filter((r) => r.is_private);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(r) =>
					r.name.toLowerCase().includes(q) ||
					(r.description && r.description.toLowerCase().includes(q))
			);
		}

		return list;
	});
</script>

<PageShell width="default">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between page-header">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center"
					style="background: var(--color-primary-subtle);"
				>
					<svg class="w-5 h-5" style="color: var(--color-primary);" viewBox="0 0 16 16" fill="currentColor">
						<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Repositories</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Your personal and organization repositories</p>
				</div>
			</div>

			<a
				href="/new"
				class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Repository
			</a>
		</div>

		<!-- Search / Filter bar -->
		<div class="flex flex-col sm:flex-row gap-3">
			<div class="flex-1 relative">
				<svg
					class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
					style="color: var(--color-text-dim);"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
				<input
					type="text"
					placeholder="Search repositories..."
					bind:value={searchQuery}
					class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border outline-none transition-colors duration-200"
					style="background: rgba(255,255,255,0.03); border-color: var(--glass-border); color: var(--color-text);"
				/>
			</div>

			<!-- Visibility filter -->
			<div class="flex items-center rounded-xl border overflow-hidden shrink-0" style="border-color: var(--glass-border);">
				{#each (['all', 'public', 'private'] as const) as option}
					<button
						onclick={() => (visibilityFilter = option)}
						class="px-4 py-2 text-sm font-medium capitalize transition-colors duration-200"
						style={visibilityFilter === option
							? 'background: var(--color-primary-subtle); color: var(--color-primary);'
							: 'background: rgba(255,255,255,0.03); color: var(--color-text-dim);'}
					>
						{option.charAt(0).toUpperCase() + option.slice(1)}
					</button>
				{/each}
			</div>
		</div>

		<!-- Content -->
		{#if reposStore.loading}
			<div class="py-16 flex flex-col items-center gap-3">
				<Spinner size="md" />
			</div>
		{:else if reposStore.repos.length === 0}
			<div class="card p-16 text-center">
				<svg class="w-16 h-16 mx-auto mb-4 opacity-10" style="color: var(--color-text);" viewBox="0 0 16 16" fill="currentColor">
					<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
				</svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">No repositories yet</p>
				<p class="text-xs mt-1 mb-5" style="color: var(--color-text-dim);">Create a repository to start hosting your code</p>
				<a
					href="/new"
					class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
					style="background: var(--color-primary);"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Create your first repository
				</a>
			</div>
		{:else if filteredRepos().length === 0}
			<div class="card p-12 text-center">
				<svg class="w-12 h-12 mx-auto mb-3 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
				</svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">No repositories match your search</p>
				<p class="text-xs mt-1" style="color: var(--color-text-dim);">Try a different name or clear the filters</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredRepos() as repo, i}
					<a
						href="/{repo.owner}/{repo.name}"
						class="card p-5 group transition-all duration-300 flex flex-col gap-3"
						style="animation: fade-up 0.3s {i * 0.05}s ease both;"
					>
						<!-- Name + badges row -->
						<div class="flex items-start justify-between gap-2">
							<h3
								class="text-sm font-semibold truncate transition-colors duration-200 group-hover:text-[var(--color-primary)]"
								style="color: var(--color-text);"
							>
								{repo.name}
							</h3>
							<div class="flex items-center gap-1.5 shrink-0">
								{#if repo.is_fork}
									<span
										class="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
										style="background: rgba(168,85,247,0.12); color: #c084fc;"
									>
										Fork
									</span>
								{/if}
								<span
									class="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
									style={repo.is_private
										? 'background: rgba(239,68,68,0.12); color: #f87171;'
										: 'background: rgba(34,197,94,0.12); color: #4ade80;'}
								>
									{repo.is_private ? 'Private' : 'Public'}
								</span>
							</div>
						</div>

						<!-- Description -->
						{#if repo.description}
							<p class="text-xs line-clamp-2 leading-relaxed" style="color: var(--color-text-dim);">
								{repo.description}
							</p>
						{/if}

						<!-- Topics -->
						{#if repo.topics && repo.topics.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each repo.topics.slice(0, 5) as topic}
									<span
										class="text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
										style="background: var(--color-primary-subtle); color: var(--color-primary);"
									>
										{topic}
									</span>
								{/each}
							</div>
						{/if}

						<!-- Footer -->
						<div class="flex items-center justify-between pt-2 border-t mt-auto" style="border-color: var(--glass-border);">
							<div class="flex items-center gap-3">
								<!-- Stars -->
								<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
									<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
										<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
									</svg>
									{repo.stars_count}
								</span>

								<!-- Forks -->
								<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
									<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
										<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
									</svg>
									{repo.forks_count}
								</span>

								<!-- Language -->
								{#if repo.language}
									<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
										<span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-primary);"></span>
										{repo.language}
									</span>
								{/if}
							</div>

							<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.6;">
								<RelativeTime date={repo.updated_at} />
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
