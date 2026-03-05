<script lang="ts">
	import type { Repository } from '$lib/types/repository';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import CloneUrlBox from './CloneUrlBox.svelte';

	let { repo }: { repo: Repository } = $props();

	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
	const cloneUrl = $derived(`${BASE_URL}/${repo.owner}/${repo.name}.git`);

	let showClone = $state(false);
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-2 min-w-0">
			<div class="shrink-0 opacity-40">
				{#if repo.is_private}
					<LockIcon size={18} />
				{:else}
					<RepoIcon size={18} />
				{/if}
			</div>
			<a href="/{repo.owner}" class="text-lg hover:underline shrink-0" style="color: var(--color-primary);">
				{repo.owner}
			</a>
			<span class="text-[var(--color-text)] opacity-15 text-lg">/</span>
			<span class="text-[var(--color-text)] font-bold text-lg truncate">{repo.name}</span>
			<span class="text-[0.625rem] px-2 py-0.5 rounded-full border shrink-0 {repo.is_private ? 'border-yellow-500/20 text-yellow-500/60' : 'border-[var(--color-border)] text-[var(--color-text)] opacity-30'}">
				{repo.is_private ? 'Private' : 'Public'}
			</span>
		</div>

		<button
			class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors shrink-0"
			onclick={() => { showClone = !showClone; }}
		>
			<svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
			Clone
		</button>
	</div>
	{#if repo.description}
		<p class="text-[var(--color-text)] opacity-40 text-sm">{repo.description}</p>
	{/if}
	{#if showClone}
		<div class="max-w-md animate-fade-in">
			<CloneUrlBox url={cloneUrl} />
		</div>
	{/if}
</div>
