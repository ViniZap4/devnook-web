<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { TreeEntry, Branch, ReadmeContent } from '$lib/types/repository';
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

	let entries = $state<TreeEntry[]>([]);
	let branches = $state<Branch[]>([]);
	let readme = $state<ReadmeContent | null>(null);
	let currentRef = $state('main');
	let loading = $state(true);
	let empty = $state(false);

	onMount(async () => {
		try {
			const [branchList, repoData] = await Promise.all([
				repos.branches(owner, repoName),
				repos.get(owner, repoName)
			]);
			branches = branchList;
			currentRef = repoData.default_branch || 'main';

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

			<FileTree {entries} {owner} repo={repoName} ref={currentRef} />

			{#if readme}
				<ReadmeViewer name={readme.name} content={readme.content} />
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<LanguageBar {owner} repo={repoName} />
			<ContributorsList {owner} repo={repoName} />
		</div>
	</div>
{/if}
