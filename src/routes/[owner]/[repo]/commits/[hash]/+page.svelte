<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { CommitDetail } from '$lib/types/repository';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);
	const hash = $derived($page.params.hash!);

	let commit = $state<CommitDetail | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			commit = await repos.commitDetail(owner, repo, hash);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading commit...</div>
{:else if commit}
	<div class="flex flex-col gap-6">
		<div class="card p-4">
			<h2 class="text-base font-semibold" style="color: var(--color-text);">{commit.message}</h2>
			<div class="flex items-center gap-2 mt-2 text-sm" style="color: var(--color-text-dim);">
				<span class="font-medium" style="color: var(--color-text);">{commit.author}</span>
				<span>committed</span>
				{#if commit.date}
					<RelativeTime date={commit.date} />
				{/if}
			</div>
			<div class="mt-2 text-xs font-mono" style="color: var(--color-text-dim);">
				{commit.hash}
			</div>
		</div>

		{#if commit.diff && commit.diff.length > 0}
			<div class="flex flex-col gap-4">
				<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">
					{commit.diff.length} file{commit.diff.length !== 1 ? 's' : ''} changed
				</h3>
				{#each commit.diff as file}
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
		{/if}
	</div>
{:else}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Commit not found</div>
{/if}
