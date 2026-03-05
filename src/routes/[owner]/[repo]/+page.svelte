<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Repository, TreeEntry, Branch, ReadmeContent, Tag } from '$lib/types/repository';
	import FileTree from '$lib/components/FileTree.svelte';
	import ReadmeViewer from '$lib/components/ReadmeViewer.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';
	import EmptyRepo from '$lib/components/EmptyRepo.svelte';
	import LanguageBar from '$lib/components/LanguageBar.svelte';
	import ContributorsList from '$lib/components/ContributorsList.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
	const isOwner = $derived(userStore.user?.username === owner);

	let repoData = $state<Repository | null>(null);
	let entries = $state<TreeEntry[]>([]);
	let branches = $state<Branch[]>([]);
	let tags = $state<Tag[]>([]);
	let readme = $state<ReadmeContent | null>(null);
	let currentRef = $state('main');
	let loading = $state(true);
	let empty = $state(false);
	let starred = $state(false);
	let starCount = $state(0);

	onMount(async () => {
		try {
			const [branchList, repo, tagList] = await Promise.all([
				repos.branches(owner, repoName),
				repos.get(owner, repoName),
				repos.tags(owner, repoName).catch(() => [] as Tag[])
			]);
			branches = branchList;
			repoData = repo;
			tags = tagList;
			currentRef = repo.default_branch || 'main';
			starCount = repo.stars_count || 0;

			if (userStore.isLoggedIn) {
				repos.isStarred(owner, repoName)
					.then(r => { starred = r.starred; })
					.catch(() => {});
			}

			if (branches.length === 0) {
				empty = true;
				return;
			}

			const [tree, readmeData] = await Promise.allSettled([
				repos.tree(owner, repoName, currentRef, ''),
				repos.readme(owner, repoName, currentRef)
			]);
			if (tree.status === 'fulfilled') entries = tree.value;
			else empty = true;
			if (readmeData.status === 'fulfilled') readme = readmeData.value;
		} catch {
			empty = true;
		} finally {
			loading = false;
		}
	});

	async function toggleStar() {
		if (!userStore.isLoggedIn) return;
		try {
			if (starred) {
				await repos.unstar(owner, repoName);
				starred = false;
				starCount = Math.max(0, starCount - 1);
			} else {
				await repos.star(owner, repoName);
				starred = true;
				starCount++;
			}
		} catch {
			// ignore
		}
	}
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if empty && !repoData}
	<EmptyRepo cloneUrl="{BASE_URL}/{owner}/{repoName}.git" />
{:else}
	<!-- Repo header -->
	{#if repoData}
		<div class="flex flex-col gap-3 mb-6 pb-5 border-b" style="border-color: var(--color-border);">
			<div class="flex items-center justify-between gap-4 flex-wrap">
				<div class="flex items-center gap-2 min-w-0">
					{#if repoData.is_private}
						<span class="shrink-0 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border" style="border-color: var(--color-border); color: var(--color-text-dim);">Private</span>
					{/if}
					{#if repoData.is_fork}
						<svg class="w-4 h-4 shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7V3m10 4V3M7 7H5a2 2 0 00-2 2v1m4-3h10m0 0h2a2 2 0 012 2v1M7 21v-4m0 0a3 3 0 003 3h4a3 3 0 003-3m-10 0H5a2 2 0 01-2-2v-4m14 6v-4m0 0h2a2 2 0 002-2v-4" /></svg>
					{/if}
				</div>
				<div class="flex items-center gap-2 shrink-0">
					{#if userStore.isLoggedIn}
						<button
							onclick={toggleStar}
							class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
							style="border-color: var(--color-border); color: {starred ? 'var(--color-warning, #eab308)' : 'var(--color-text-dim)'};"
						>
							<svg class="w-4 h-4" fill="{starred ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
							{starred ? 'Starred' : 'Star'}
						</button>
					{/if}
					<span class="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border" style="border-color: var(--color-border); color: var(--color-text-dim);">
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
						{starCount}
					</span>
					<span class="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border" style="border-color: var(--color-border); color: var(--color-text-dim);">
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
						{repoData.forks_count || 0}
					</span>
				</div>
			</div>
			{#if repoData.description}
				<p class="text-sm" style="color: var(--color-text-dim);">{repoData.description}</p>
			{/if}
			{#if repoData.website || (repoData.topics && repoData.topics.length > 0)}
				<div class="flex items-center gap-3 flex-wrap">
					{#if repoData.website}
						<a href={repoData.website} target="_blank" rel="noopener" class="flex items-center gap-1 text-xs hover:underline" style="color: var(--color-primary);">
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" /></svg>
							{repoData.website}
						</a>
					{/if}
					{#if repoData.topics?.length}
						{#each repoData.topics as topic}
							<span class="text-xs px-2 py-0.5 rounded-full" style="background: var(--color-primary)10; color: var(--color-primary);">{topic}</span>
						{/each}
					{/if}
				</div>
			{/if}
			<!-- Quick stats -->
			<div class="flex items-center gap-4 text-xs" style="color: var(--color-text-dim);">
				<a href="/{owner}/{repoName}/commits" class="flex items-center gap-1 hover:underline">
					<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v6m0 8v6" /></svg>
					Commits
				</a>
				<a href="/{owner}/{repoName}/branches" class="flex items-center gap-1 hover:underline">
					<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
					{branches.length} branch{branches.length !== 1 ? 'es' : ''}
				</a>
				<a href="/{owner}/{repoName}/tags" class="flex items-center gap-1 hover:underline">
					<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
					{tags.length} tag{tags.length !== 1 ? 's' : ''}
				</a>
				{#if isOwner}
					<a href="/{owner}/{repoName}/settings" class="flex items-center gap-1 hover:underline">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
						Settings
					</a>
				{/if}
			</div>
		</div>
	{/if}

	{#if empty}
		<EmptyRepo cloneUrl="{BASE_URL}/{owner}/{repoName}.git" />
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Main content -->
			<div class="lg:col-span-3 flex flex-col gap-4">
				{#if branches.length > 0}
					<div class="flex items-center justify-between gap-4">
						<BranchSelector {branches} {currentRef} {owner} repo={repoName} />
						{#if isOwner}
							<a
								href="/{owner}/{repoName}/_new/{currentRef}"
								class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors shrink-0"
							>
								<svg class="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
								New file
							</a>
						{/if}
					</div>
				{/if}

				<FileTree {entries} {owner} repo={repoName} ref={currentRef} />

				{#if readme}
					<ReadmeViewer name={readme.name} content={readme.content} />
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="flex flex-col gap-5">
				<!-- Clone URL -->
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Clone</h3>
					<div class="flex items-center gap-1">
						<input
							type="text"
							readonly
							value="{BASE_URL}/{owner}/{repoName}.git"
							class="flex-1 px-2 py-1.5 text-xs rounded-lg border font-mono"
							style="border-color: var(--color-border); background: var(--color-surface); color: var(--color-text);"
							onclick={(e) => (e.target as HTMLInputElement).select()}
						/>
					</div>
				</div>

				<LanguageBar {owner} repo={repoName} />
				<ContributorsList {owner} repo={repoName} />
			</div>
		</div>
	{/if}
{/if}
