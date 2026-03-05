<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issuesStore } from '$lib/stores/issues.svelte';
	import IssueList from '$lib/components/IssueList.svelte';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let stateFilter = $state<'open' | 'closed'>('open');

	onMount(() => {
		issuesStore.load(owner, repoName, stateFilter);
	});

	function switchState(s: 'open' | 'closed') {
		stateFilter = s;
		issuesStore.load(owner, repoName, s);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button
				class="flex items-center gap-2 text-sm transition-colors {stateFilter === 'open' ? 'font-medium' : 'opacity-50 hover:opacity-80'}"
				style={stateFilter === 'open' ? 'color: var(--color-primary);' : 'color: var(--color-text);'}
				onclick={() => switchState('open')}
			>
				<IssueIcon size={14} state="open" color={stateFilter === 'open' ? '#3fb950' : 'currentColor'} />
				Open
			</button>
			<button
				class="flex items-center gap-2 text-sm transition-colors {stateFilter === 'closed' ? 'font-medium' : 'opacity-50 hover:opacity-80'}"
				style={stateFilter === 'closed' ? 'color: var(--color-primary);' : 'color: var(--color-text);'}
				onclick={() => switchState('closed')}
			>
				<IssueIcon size={14} state="closed" color={stateFilter === 'closed' ? '#8b949e' : 'currentColor'} />
				Closed
			</button>
		</div>
		<a
			href="/{owner}/{repoName}/issues/new"
			class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity"
			style="background-color: var(--color-primary);"
		>
			New issue
		</a>
	</div>

	{#if issuesStore.loading}
		<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
	{:else}
		<IssueList issues={issuesStore.issues} {owner} repo={repoName} />
	{/if}
</div>
