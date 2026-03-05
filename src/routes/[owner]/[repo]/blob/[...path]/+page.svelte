<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { BlobContent } from '$lib/types/repository';
	import BlobViewer from '$lib/components/BlobViewer.svelte';

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);
	const fullPath = $derived($page.params.path);

	const ref = $derived(fullPath.split('/')[0]);
	const filePath = $derived(fullPath.split('/').slice(1).join('/'));

	let blob = $state<BlobContent | null>(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			blob = await repos.blob(owner, repoName, ref, filePath);
		} catch (err) {
			error = err instanceof Error ? err.message : 'File not found';
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if error}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">{error}</div>
{:else if blob}
	<BlobViewer {blob} {owner} repo={repoName} {ref} />
{/if}
