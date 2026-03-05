<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { Branch } from '$lib/types/repository';
	import BranchList from '$lib/components/BranchList.svelte';

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);

	let branches = $state<Branch[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			branches = await repos.branches(owner, repoName);
		} catch {
			// keep current state
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex flex-col gap-4">
	<h2 class="text-[var(--color-text)] font-semibold">Branches</h2>

	{#if loading}
		<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
	{:else}
		<BranchList {branches} />
	{/if}
</div>
