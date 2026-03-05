<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { BlobContent } from '$lib/types/repository';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const fullPath = $derived($page.params.path!);
	const ref = $derived(fullPath.split('/')[0]);
	const filePath = $derived(fullPath.split('/').slice(1).join('/'));
	const fileName = $derived(filePath.split('/').pop() || '');

	let content = $state('');
	let message = $state('');
	let branch = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			const blob = await repos.blob(owner, repoName, ref, filePath);
			content = blob.content;
			branch = ref;
		} catch (err) {
			error = err instanceof Error ? err.message : 'File not found';
		} finally {
			loading = false;
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		error = '';
		try {
			await repos.updateFile(owner, repoName, filePath, {
				content,
				message: message || `Update ${fileName}`,
				branch
			});
			goto(`/${owner}/${repoName}/blob/${ref}/${filePath}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			saving = false;
		}
	}
</script>

{#if loading}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
{:else if error && !content}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">{error}</div>
{:else}
	<form onsubmit={handleSave} class="flex flex-col gap-4">
		<div class="flex items-center gap-2 text-sm">
			<a href="/{owner}/{repoName}" class="hover:underline" style="color: var(--color-primary);">{owner}/{repoName}</a>
			<span style="color: var(--color-text-dim);">/</span>
			<span style="color: var(--color-text);" class="font-medium">{filePath}</span>
			<span class="px-2 py-0.5 rounded text-xs" style="background: var(--color-surface); color: var(--color-text-dim);">editing</span>
		</div>

		<textarea
			bind:value={content}
			rows={24}
			spellcheck={false}
			class="w-full px-4 py-3 text-sm font-mono rounded-lg border resize-y"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text); tab-size: 4;"
		></textarea>

		<div class="card p-4 flex flex-col gap-3">
			<h3 class="text-sm font-semibold" style="color: var(--color-text);">Commit changes</h3>
			<input
				type="text"
				bind:value={message}
				placeholder="Update {fileName}"
				class="w-full px-3 py-2 text-sm rounded-lg border"
				style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
			/>
			<div class="flex items-center gap-2 text-xs" style="color: var(--color-text-dim);">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
				Commit to <code class="px-1 py-0.5 rounded" style="background: var(--color-surface);">{branch}</code>
			</div>
		</div>

		{#if error}
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
		{/if}

		<div class="flex items-center gap-3">
			<button
				type="submit"
				disabled={saving}
				class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
				style="background-color: var(--color-success);"
			>{saving ? 'Committing...' : 'Commit changes'}</button>
			<a
				href="/{owner}/{repoName}/blob/{ref}/{filePath}"
				class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
				style="border-color: var(--color-border); color: var(--color-text);"
			>Cancel</a>
		</div>
	</form>
{/if}
