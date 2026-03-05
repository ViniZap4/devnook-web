<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { BlameLine } from '$lib/types/repository';
	import { onMount } from 'svelte';
	import type { Repository } from '$lib/types/repository';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const path = $derived($page.params.path!);

	let lines = $state<BlameLine[]>([]);
	let loading = $state(true);
	let repoData = $state<Repository | null>(null);

	onMount(async () => {
		try {
			repoData = await repos.get(owner, repoName);
			const ref = repoData?.default_branch || 'HEAD';
			lines = await repos.blame(owner, repoName, ref, path);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	function isNewGroup(i: number): boolean {
		if (i === 0) return true;
		return lines[i].hash !== lines[i - 1].hash;
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2 text-sm">
		<a href="/{owner}/{repoName}/blob/{repoData?.default_branch || 'HEAD'}/{path}" class="hover:underline" style="color: var(--color-primary);">Normal view</a>
		<span style="color: var(--color-text-dim);">·</span>
		<span class="font-medium" style="color: var(--color-text);">Blame: {path}</span>
	</div>

	{#if loading}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading blame...</div>
	{:else if lines.length === 0}
		<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">No blame data</div>
	{:else}
		<div class="rounded-xl border overflow-x-auto" style="border-color: var(--color-border);">
			<table class="w-full text-xs font-mono">
				<tbody>
					{#each lines as line, i}
						<tr class="{isNewGroup(i) && i > 0 ? 'border-t' : ''}" style="border-color: var(--color-border);">
							{#if isNewGroup(i)}
								<td class="px-3 py-0.5 whitespace-nowrap align-top" style="color: var(--color-text-dim);">
									<a href="/{owner}/{repoName}/commits/{line.hash}" class="hover:underline" style="color: var(--color-primary);">{line.hash.slice(0, 7)}</a>
								</td>
								<td class="px-2 py-0.5 whitespace-nowrap align-top" style="color: var(--color-text-dim);">{line.author}</td>
							{:else}
								<td class="px-3 py-0.5"></td>
								<td class="px-2 py-0.5"></td>
							{/if}
							<td class="px-3 py-0.5 text-right select-none" style="color: var(--color-text-dim); opacity: 0.4;">{line.line_number}</td>
							<td class="px-3 py-0.5 whitespace-pre" style="color: var(--color-text);">{line.content}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
