<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { Branch, CompareResult } from '$lib/types/repository';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);

	let branches = $state<Branch[]>([]);
	let baseBranch = $state('');
	let headBranch = $state('');
	let result = $state<CompareResult | null>(null);
	let loading = $state(false);
	let error = $state('');

	onMount(async () => {
		try {
			branches = await repos.branches(owner, repo);
			const def = branches.find(b => b.is_default);
			if (def) baseBranch = def.name;
		} catch {
			// ignore
		}
	});

	async function compare() {
		if (!baseBranch || !headBranch) return;
		loading = true;
		error = '';
		try {
			result = await repos.compare(owner, repo, baseBranch, headBranch);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to compare';
			result = null;
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<h2 class="text-lg font-semibold" style="color: var(--color-text);">Compare Changes</h2>

	<div class="flex items-center gap-3 flex-wrap">
		<div class="flex flex-col gap-1">
			<label class="text-xs font-medium" style="color: var(--color-text-dim);">Base</label>
			<select bind:value={baseBranch} class="px-3 py-1.5 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);">
				{#each branches as b}
					<option value={b.name}>{b.name}</option>
				{/each}
			</select>
		</div>
		<span class="mt-4" style="color: var(--color-text-dim);">...</span>
		<div class="flex flex-col gap-1">
			<label class="text-xs font-medium" style="color: var(--color-text-dim);">Compare</label>
			<select bind:value={headBranch} class="px-3 py-1.5 text-sm rounded-lg border" style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);">
				<option value="">Select branch</option>
				{#each branches as b}
					<option value={b.name}>{b.name}</option>
				{/each}
			</select>
		</div>
		<button
			class="mt-4 px-4 py-1.5 text-sm font-medium rounded-lg text-white disabled:opacity-40"
			style="background-color: var(--color-primary);"
			onclick={compare}
			disabled={loading || !baseBranch || !headBranch}
		>{loading ? 'Comparing...' : 'Compare'}</button>
	</div>

	{#if error}
		<p class="text-sm" style="color: var(--color-error);">{error}</p>
	{/if}

	{#if result}
		{#if result.commits.length > 0}
			<div>
				<h3 class="text-sm font-semibold mb-3" style="color: var(--color-text-dim);">Commits ({result.commits.length})</h3>
				<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
					{#each result.commits as commit, i}
						<div class="flex items-center gap-3 px-4 py-2.5 {i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
							<code class="text-xs shrink-0" style="color: var(--color-primary);">{commit.short_hash}</code>
							<span class="text-sm truncate" style="color: var(--color-text);">{commit.message}</span>
							<span class="text-xs shrink-0 ml-auto" style="color: var(--color-text-dim);">{commit.author}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if result.diff && result.diff.length > 0}
			<div class="flex flex-col gap-4">
				<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">{result.diff.length} file{result.diff.length !== 1 ? 's' : ''} changed</h3>
				{#each result.diff as file}
					<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border);">
						<div class="px-4 py-2 text-sm font-mono border-b" style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">
							{file.to_file || file.from_file}
						</div>
						{#each file.hunks as hunk}
							<div class="px-4 py-1 text-xs font-mono" style="background-color: var(--color-surface); color: var(--color-text-dim);">
								{hunk.header}
							</div>
							<pre class="text-xs font-mono leading-5 overflow-x-auto">{#each hunk.lines as line}<span class="block px-4" style={line.startsWith('+') ? 'background-color: rgba(46,160,67,0.15); color: var(--color-success);' : line.startsWith('-') ? 'background-color: rgba(248,81,73,0.15); color: var(--color-error);' : 'color: var(--color-text);'}>{line}</span>{/each}</pre>
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-6 text-center text-sm" style="color: var(--color-text-dim);">No differences found</div>
		{/if}
	{/if}
</div>
