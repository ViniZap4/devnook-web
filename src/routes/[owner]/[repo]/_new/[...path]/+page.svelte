<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos } from '$lib/services/api';
	import type { Branch } from '$lib/types/repository';
	import { onMount } from 'svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const dirPath = $derived($page.params.path || '');

	let fileName = $state('');
	let content = $state('');
	let message = $state('');
	let branch = $state('main');
	let branches = $state<Branch[]>([]);
	let saving = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			branches = await repos.branches(owner, repoName);
			const def = branches.find(b => b.is_default);
			if (def) branch = def.name;
		} catch {
			// ignore
		}
	});

	const fullFilePath = $derived(dirPath ? `${dirPath}/${fileName}` : fileName);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!fileName.trim()) {
			error = 'File name is required';
			return;
		}
		saving = true;
		error = '';
		try {
			await repos.createFile(owner, repoName, fullFilePath, {
				content,
				message: message || `Create ${fullFilePath}`,
				branch
			});
			goto(`/${owner}/${repoName}/blob/${branch}/${fullFilePath}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create file';
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={handleCreate} class="flex flex-col gap-4">
	<div class="flex items-center gap-2 text-sm flex-wrap">
		<a href="/{owner}/{repoName}" class="hover:underline" style="color: var(--color-primary);">{owner}/{repoName}</a>
		<span style="color: var(--color-text-dim);">/</span>
		{#if dirPath}
			<span style="color: var(--color-text-dim);">{dirPath}/</span>
		{/if}
		<input
			type="text"
			bind:value={fileName}
			placeholder="name your file..."
			class="px-2 py-1 text-sm rounded border flex-1 min-w-[200px]"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		/>
		<span class="text-xs px-2 py-0.5 rounded" style="background: var(--color-surface); color: var(--color-text-dim);">
			on <code>{branch}</code>
		</span>
	</div>

	<textarea
		bind:value={content}
		rows={24}
		spellcheck={false}
		placeholder="Enter file contents..."
		class="w-full px-4 py-3 text-sm font-mono rounded-lg border resize-y"
		style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text); tab-size: 4;"
	></textarea>

	<div class="card p-4 flex flex-col gap-3">
		<h3 class="text-sm font-semibold" style="color: var(--color-text);">Commit new file</h3>
		<input
			type="text"
			bind:value={message}
			placeholder="Create {fullFilePath || 'new file'}"
			class="w-full px-3 py-2 text-sm rounded-lg border"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		/>
		{#if branches.length > 1}
			<select
				bind:value={branch}
				class="w-full px-3 py-2 text-sm rounded-lg border"
				style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
			>
				{#each branches as b}
					<option value={b.name}>{b.name}</option>
				{/each}
			</select>
		{/if}
	</div>

	{#if error}
		<p class="text-sm" style="color: var(--color-error);">{error}</p>
	{/if}

	<div class="flex items-center gap-3">
		<button
			type="submit"
			disabled={saving || !fileName.trim()}
			class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
			style="background-color: var(--color-success);"
		>{saving ? 'Committing...' : 'Commit new file'}</button>
		<a
			href="/{owner}/{repoName}"
			class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
			style="border-color: var(--color-border); color: var(--color-text);"
		>Cancel</a>
	</div>
</form>
