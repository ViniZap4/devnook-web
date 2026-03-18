<script lang="ts">
	import type { Commit } from '$lib/types/repository';
	import Avatar from './Avatar.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';

	let {
		commit,
		owner = '',
		repo = '',
		showGraphDot = false
	}: {
		commit: Commit;
		owner?: string;
		repo?: string;
		showGraphDot?: boolean;
	} = $props();

	let copied = $state(false);

	async function handleCopy() {
		await copyTextToClipboard(commit.hash);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div class="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors">
	{#if showGraphDot}
		<!-- Graph dot -->
		<div class="shrink-0 flex items-center justify-center" style="width: 14px;">
			<div
				class="w-[10px] h-[10px] rounded-full border-2 shrink-0"
				style="border-color: var(--color-primary); background: var(--glass-bg, rgba(0,0,0,0.4));"
			></div>
		</div>
	{/if}

	<!-- Author avatar -->
	<Avatar username={commit.author} size={28} />

	<!-- Commit info -->
	<div class="min-w-0 flex-1">
		<p class="text-sm text-[var(--color-text)] font-medium truncate">{commit.message}</p>
		<p class="text-xs text-[var(--color-text)] opacity-40 mt-0.5">
			<span class="font-medium opacity-70">{commit.author}</span> committed <RelativeTime date={commit.date} />
		</p>
	</div>

	<!-- Hash badge -->
	<div class="flex items-center gap-1.5 shrink-0 ml-4">
		{#if owner && repo}
			<a
				href="/{owner}/{repo}/commits/{commit.hash}"
				class="text-xs px-2.5 py-1 rounded-md font-mono hover:underline border border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)]"
				style="color: var(--color-primary);"
			>
				{commit.short_hash}
			</a>
		{:else}
			<code class="text-xs px-2.5 py-1 rounded-md text-[var(--color-text)] opacity-60 font-mono border border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)]">
				{commit.short_hash}
			</code>
		{/if}

		<button
			onclick={handleCopy}
			class="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-colors"
			title={copied ? 'Copied!' : 'Copy full hash'}
		>
			{#if copied}
				<svg class="w-3.5 h-3.5" style="color: var(--color-success);" viewBox="0 0 16 16" fill="currentColor">
					<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
				</svg>
			{:else}
				<svg class="w-3.5 h-3.5 text-[var(--color-text)] opacity-40" viewBox="0 0 16 16" fill="currentColor">
					<path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
					<path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
				</svg>
			{/if}
		</button>
	</div>
</div>
