<script lang="ts">
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import type { LanguageStat } from '$lib/services/api';

	let { owner, repo }: { owner: string; repo: string } = $props();

	let languages = $state<LanguageStat[]>([]);
	let showAll = $state(false);

	onMount(async () => {
		try {
			languages = await repos.languages(owner, repo);
		} catch {
			// ignore
		}
	});

	const displayed = $derived(showAll ? languages : languages.slice(0, 6));
</script>

{#if languages.length > 0}
	<div class="flex flex-col gap-3">
		<!-- Bar -->
		<div class="flex h-2 rounded-full overflow-hidden gap-0.5">
			{#each languages as lang}
				<div
					class="h-full transition-all"
					style="width: {Math.max(lang.percentage, 0.5)}%; background-color: {lang.color};"
					title="{lang.name} {lang.percentage.toFixed(1)}%"
				></div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-x-4 gap-y-1">
			{#each displayed as lang}
				<div class="flex items-center gap-1.5 text-xs">
					<span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: {lang.color};"></span>
					<span style="color: var(--color-text);" class="font-medium">{lang.name}</span>
					<span style="color: var(--color-text-dim);">{lang.percentage.toFixed(1)}%</span>
				</div>
			{/each}
			{#if languages.length > 6 && !showAll}
				<button
					class="text-xs font-medium hover:underline"
					style="color: var(--color-primary);"
					onclick={() => { showAll = true; }}
				>+{languages.length - 6} more</button>
			{/if}
		</div>
	</div>
{/if}
