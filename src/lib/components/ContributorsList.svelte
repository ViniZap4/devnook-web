<script lang="ts">
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { Contributor } from '$lib/services/api';
	import Avatar from './Avatar.svelte';

	let { owner, repo }: { owner: string; repo: string } = $props();

	let contributors = $state<Contributor[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			contributors = await repos.contributors(owner, repo);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	const totalCommits = $derived(contributors.reduce((s, c) => s + c.commits, 0));
</script>

{#if !loading && contributors.length > 0}
	<div class="flex flex-col gap-3">
		<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">
			Contributors <span class="font-normal">({contributors.length})</span>
		</h3>
		<div class="flex flex-col gap-2">
			{#each contributors.slice(0, 10) as c}
				<div class="flex items-center gap-3">
					<Avatar username={c.name} size={28} />
					<div class="flex-1 min-w-0">
						<span class="text-sm font-medium truncate block" style="color: var(--color-text);">{c.name}</span>
					</div>
					<div class="flex items-center gap-2 text-xs shrink-0" style="color: var(--color-text-dim);">
						<span>{c.commits} commit{c.commits !== 1 ? 's' : ''}</span>
						<div class="w-16 h-1.5 rounded-full overflow-hidden" style="background-color: var(--color-border);">
							<div class="h-full rounded-full" style="width: {(c.commits / totalCommits * 100).toFixed(0)}%; background-color: var(--color-primary);"></div>
						</div>
					</div>
				</div>
			{/each}
			{#if contributors.length > 10}
				<p class="text-xs" style="color: var(--color-text-dim);">+ {contributors.length - 10} more contributors</p>
			{/if}
		</div>
	</div>
{/if}
