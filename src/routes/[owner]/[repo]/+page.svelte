<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Repository, TreeEntry, Branch, ReadmeContent, Tag, Commit } from '$lib/types/repository';
	import FileTree from '$lib/components/FileTree.svelte';
	import ReadmeViewer from '$lib/components/ReadmeViewer.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';
	import EmptyRepo from '$lib/components/EmptyRepo.svelte';
	import LanguageBar from '$lib/components/LanguageBar.svelte';
	import ContributorsList from '$lib/components/ContributorsList.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
	const isOwner = $derived(userStore.user?.username === owner);

	let repoData = $state<Repository | null>(null);
	let entries = $state<TreeEntry[]>([]);
	let branches = $state<Branch[]>([]);
	let tags = $state<Tag[]>([]);
	let latestCommit = $state<Commit | null>(null);
	let readme = $state<ReadmeContent | null>(null);
	let currentRef = $state('main');
	let loading = $state(true);
	let empty = $state(false);

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

			if (branches.length === 0) {
				empty = true;
				return;
			}

			const [tree, readmeData, commitsData] = await Promise.allSettled([
				repos.tree(owner, repoName, currentRef, ''),
				repos.readme(owner, repoName, currentRef),
				repos.commits(owner, repoName, currentRef)
			]);
			if (tree.status === 'fulfilled') entries = tree.value;
			else empty = true;
			if (readmeData.status === 'fulfilled') readme = readmeData.value;
			if (commitsData.status === 'fulfilled' && commitsData.value.length > 0) {
				latestCommit = commitsData.value[0];
			}
		} catch {
			empty = true;
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if empty}
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

			<!-- Latest commit bar -->
			{#if latestCommit}
				<div class="flex items-center gap-3 px-4 py-2.5 rounded-t-lg border border-b-0 text-xs" style="border-color: var(--color-border); background: var(--color-surface);">
					<span class="font-medium truncate" style="color: var(--color-text);">{latestCommit.author}</span>
					<a href="/{owner}/{repoName}/commits/{latestCommit.hash}" class="truncate flex-1 hover:underline" style="color: var(--color-text-dim);">
						{latestCommit.message.split('\n')[0]}
					</a>
					<span class="shrink-0 font-mono" style="color: var(--color-text-dim);">
						<a href="/{owner}/{repoName}/commits/{latestCommit.hash}" class="hover:underline">{latestCommit.short_hash}</a>
					</span>
					<span class="shrink-0" style="color: var(--color-text-dim); opacity: 0.6;">
						<RelativeTime date={latestCommit.date} />
					</span>
				</div>
			{/if}

			<div class="{latestCommit ? '-mt-4' : ''}">
				<FileTree {entries} {owner} repo={repoName} ref={currentRef} />
			</div>

			{#if readme}
				<ReadmeViewer name={readme.name} content={readme.content} />
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<!-- Quick stats -->
			<div class="flex flex-col gap-2">
				<a href="/{owner}/{repoName}/branches" class="flex items-center justify-between text-xs hover:underline" style="color: var(--color-text-dim);">
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
						Branches
					</span>
					<span class="font-medium" style="color: var(--color-text);">{branches.length}</span>
				</a>
				<a href="/{owner}/{repoName}/tags" class="flex items-center justify-between text-xs hover:underline" style="color: var(--color-text-dim);">
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
						Tags
					</span>
					<span class="font-medium" style="color: var(--color-text);">{tags.length}</span>
				</a>
				<a href="/{owner}/{repoName}/releases" class="flex items-center justify-between text-xs hover:underline" style="color: var(--color-text-dim);">
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
						Releases
					</span>
				</a>
			</div>

			<!-- Clone URL -->
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Clone</h3>
				<input
					type="text"
					readonly
					value="{BASE_URL}/{owner}/{repoName}.git"
					class="w-full px-2 py-1.5 text-xs rounded-lg border font-mono"
					style="border-color: var(--color-border); background: var(--color-surface); color: var(--color-text);"
					onclick={(e) => (e.target as HTMLInputElement).select()}
				/>
			</div>

			<LanguageBar {owner} repo={repoName} />
			<ContributorsList {owner} repo={repoName} />
		</div>
	</div>
{/if}
