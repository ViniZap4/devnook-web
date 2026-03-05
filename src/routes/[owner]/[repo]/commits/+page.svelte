<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { Commit } from '$lib/types/repository';
	import CommitList from '$lib/components/CommitList.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let commits = $state<Commit[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);

	async function loadPage(p: number) {
		loading = true;
		try {
			commits = await repos.commits(owner, repoName, undefined, p);
			currentPage = p;
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	}

	onMount(() => loadPage(1));
</script>

<div class="flex flex-col gap-4">
	<h2 class="text-[var(--color-text)] font-semibold">Commits</h2>

	{#if loading}
		<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
	{:else}
		<CommitList {commits} owner={owner} repo={repoName} />
		<Pagination page={currentPage} hasMore={commits.length >= 30} onPageChange={loadPage} />
	{/if}
</div>
