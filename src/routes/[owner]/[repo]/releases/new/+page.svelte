<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { releases, repos } from '$lib/services/api';
	import type { Tag } from '$lib/types/repository';
	import { onMount } from 'svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let tags = $state<Tag[]>([]);
	let tagName = $state('');
	let title = $state('');
	let body = $state('');
	let isDraft = $state(false);
	let isPrerelease = $state(false);
	let submitting = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			tags = await repos.tags(owner, repo);
		} catch {
			// ignore
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!tagName || !title) return;
		submitting = true;
		error = '';
		try {
			await releases.create(owner, repo, { tag_name: tagName, title, body, is_draft: isDraft, is_prerelease: isPrerelease });
			goto(`/${owner}/${repo}/releases`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create release';
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6 max-w-2xl">
	<h2 class="text-lg font-semibold" style="color: var(--color-text);">New Release</h2>

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<div>
			<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Tag</label>
			<select bind:value={tagName} class="w-full px-3 py-2 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);">
				<option value="">Select a tag</option>
				{#each tags as tag}
					<option value={tag.name}>{tag.name}</option>
				{/each}
			</select>
		</div>
		<input
			type="text"
			bind:value={title}
			placeholder="Release title"
			class="w-full px-4 py-2.5 text-sm rounded-lg border"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		/>
		<textarea
			bind:value={body}
			placeholder="Describe this release..."
			rows={8}
			class="w-full px-4 py-2.5 text-sm rounded-lg border resize-y"
			style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
		></textarea>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
				<input type="checkbox" bind:checked={isPrerelease} />
				Pre-release
			</label>
			<label class="flex items-center gap-2 text-sm" style="color: var(--color-text);">
				<input type="checkbox" bind:checked={isDraft} />
				Draft
			</label>
		</div>
		{#if error}
			<p class="text-sm" style="color: var(--color-error);">{error}</p>
		{/if}
		<button
			type="submit"
			disabled={submitting || !tagName || !title}
			class="self-start px-5 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
			style="background-color: var(--color-primary);"
		>{submitting ? 'Publishing...' : 'Publish Release'}</button>
	</form>
</div>
