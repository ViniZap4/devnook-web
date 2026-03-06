<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { BlobContent } from '$lib/types/repository';
	import BlobViewer from '$lib/components/BlobViewer.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const fullPath = $derived($page.params.path!);

	const ref = $derived(fullPath.split('/')[0]);
	const filePath = $derived(fullPath.split('/').slice(1).join('/'));

	let blob = $state<BlobContent | null>(null);
	let loading = $state(true);
	let error = $state('');
	let fetchId = 0;

	// Re-fetch when file path or ref changes
	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		const _ref = ref;
		const _path = filePath;
		const id = ++fetchId;

		loading = true;
		error = '';
		blob = null;

		repos.blob(_owner, _repo, _ref, _path).then(data => {
			if (id !== fetchId) return;
			blob = data;
		}).catch(err => {
			if (id !== fetchId) return;
			error = err instanceof Error ? err.message : 'File not found';
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if error}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">{error}</div>
{:else if blob}
	<BlobViewer {blob} {owner} repo={repoName} {ref} />
{/if}
