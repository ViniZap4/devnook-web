<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { TreeEntry, Branch, ReadmeContent } from '$lib/types/repository';
	import FileTree from '$lib/components/FileTree.svelte';
	import ReadmeViewer from '$lib/components/ReadmeViewer.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';
	import EmptyRepo from '$lib/components/EmptyRepo.svelte';

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);
	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';

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
	<div class="flex flex-col gap-4">
		{#if branches.length > 0}
			<div class="flex items-center gap-4">
				<BranchSelector {branches} {currentRef} {owner} repo={repoName} />
			</div>
		{/if}

		<FileTree {entries} {owner} repo={repoName} ref={currentRef} />

		{#if readme}
			<ReadmeViewer name={readme.name} content={readme.content} />
		{/if}
	</div>
{/if}
