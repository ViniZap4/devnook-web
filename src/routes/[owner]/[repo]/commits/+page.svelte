<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { Commit, Branch } from '$lib/types/repository';
	import CommitList from '$lib/components/CommitList.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let commits = $state<Commit[]>([]);
	let branches = $state<Branch[]>([]);
	let selectedBranch = $state('');
	let loading = $state(true);
	let currentPage = $state(1);
	let fetchId = 0;

	async function loadBranches() {
		try {
			const data = await repos.branches(owner, repoName);
			branches = data;
			if (!selectedBranch) {
				const defaultBranch = data.find((b: Branch) => b.is_default);
				selectedBranch = defaultBranch ? defaultBranch.name : (data[0]?.name ?? '');
			}
		} catch {
			// keep current state
		}
	}

	async function loadPage(p: number) {
		loading = true;
		const id = ++fetchId;
		try {
			const data = await repos.commits(owner, repoName, selectedBranch || undefined, p);
			if (id !== fetchId) return;
			commits = data;
			currentPage = p;
		} catch {
			// keep current state
		} finally {
			if (id !== fetchId) return;
			loading = false;
		}
	}

	function handleBranchSelect(branch: string) {
		selectedBranch = branch;
		currentPage = 1;
		loadPage(1);
	}

	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		void _owner; void _repo;
		selectedBranch = '';
		currentPage = 1;
		loadBranches().then(() => loadPage(1));
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h2 class="text-[var(--color-text)] font-semibold">Commits</h2>
		{#if branches.length > 0}
			<BranchSelector {branches} currentRef={selectedBranch} onselect={handleBranchSelect} />
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
	{:else}
		<CommitList {commits} owner={owner} repo={repoName} />
		<Pagination page={currentPage} hasMore={commits.length >= 30} onPageChange={loadPage} />
	{/if}
</div>
