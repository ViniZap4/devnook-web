<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos } from '$lib/services/api';
	import type { TreeEntry, Branch } from '$lib/types/repository';
	import FileTree from '$lib/components/FileTree.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const fullPath = $derived($page.params.path!);

	// First segment of path is the ref, rest is the actual path
	const ref = $derived(fullPath.split('/')[0]);
	const treePath = $derived(fullPath.split('/').slice(1).join('/'));

	let entries = $state<TreeEntry[]>([]);
	let branches = $state<Branch[]>([]);
	let loading = $state(true);
	let fetchId = 0;

	// Re-fetch when path or ref changes (handles folder navigation)
	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		const _ref = ref;
		const _path = treePath;
		const id = ++fetchId;

		loading = true;
		entries = [];

		Promise.all([
			repos.tree(_owner, _repo, _ref, _path),
			repos.branches(_owner, _repo)
		]).then(([tree, branchList]) => {
			if (id !== fetchId) return;
			entries = tree;
			branches = branchList;
		}).catch(() => {
			// handled by empty state
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	function selectBranch(branch: string) {
		goto(`/${owner}/${repoName}/tree/${branch}/${treePath}`);
	}
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else}
	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-4">
			<BranchSelector {branches} currentRef={ref} onselect={selectBranch} />
			{#if treePath}
				<Breadcrumb {owner} repo={repoName} path={treePath} {ref} />
			{/if}
		</div>
		<FileTree {entries} {owner} repo={repoName} {ref} currentPath={treePath} />
	</div>
{/if}
