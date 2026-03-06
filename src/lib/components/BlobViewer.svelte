<script lang="ts">
	import type { BlobContent } from '$lib/types/repository';
	import { userStore } from '$lib/stores/user.svelte';
	import { repos } from '$lib/services/api';
	import { goto } from '$app/navigation';
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';
	import Breadcrumb from './Breadcrumb.svelte';
	import { page } from '$app/stores';

	let { blob, owner, repo, ref }: {
		blob: BlobContent;
		owner: string;
		repo: string;
		ref: string;
	} = $props();

	const lines = $derived(blob.content ? blob.content.split('\n') : []);
	const isOwner = $derived(userStore.user?.username === owner);
	let deleting = $state(false);
	let copied = $state(false);
	let selectedLine = $state<number | null>(null);

	// Parse initial line from URL hash
	$effect(() => {
		const hash = $page.url.hash;
		if (hash.startsWith('#L')) {
			const n = parseInt(hash.slice(2));
			if (!isNaN(n) && n > 0) selectedLine = n;
		}
	});

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function handleCopy() {
		await copyTextToClipboard(blob.content);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

	function handleLineClick(lineNum: number) {
		selectedLine = selectedLine === lineNum ? null : lineNum;
		const hash = selectedLine ? `#L${selectedLine}` : '';
		history.replaceState(null, '', `${$page.url.pathname}${hash}`);
	}

	async function handleDelete() {
		if (!confirm(`Delete ${blob.name}?`)) return;
		deleting = true;
		try {
			await repos.deleteFile(owner, repo, blob.path, { branch: ref });
			const dir = blob.path.split('/').slice(0, -1).join('/');
			goto(`/${owner}/${repo}/tree/${ref}/${dir}`);
		} catch {
			deleting = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<Breadcrumb {owner} {repo} path={blob.path} {ref} />

	<div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
		<div class="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
			<span class="text-xs text-[var(--color-text)] opacity-50">
				{lines.length} lines · {formatSize(blob.size)}
			</span>
			<div class="flex items-center gap-3">
				{#if !blob.binary}
					<button
						class="text-xs font-medium hover:underline transition-colors"
						style="color: {copied ? 'var(--color-success)' : 'var(--color-text-dim)'};"
						onclick={handleCopy}
					>{copied ? 'Copied!' : 'Copy'}</button>
					<button
						class="text-xs font-medium hover:underline"
						style="color: var(--color-text-dim);"
						onclick={() => {
							const b = new Blob([blob.content], { type: 'text/plain' });
							const url = URL.createObjectURL(b);
							const a = document.createElement('a');
							a.href = url; a.download = blob.name; a.click();
							URL.revokeObjectURL(url);
						}}
					>Raw</button>
					<a
						href="/{owner}/{repo}/blame/{ref}/{blob.path}"
						class="text-xs font-medium hover:underline"
						style="color: var(--color-primary);"
					>Blame</a>
				{/if}
				{#if isOwner && !blob.binary}
					<a
						href="/{owner}/{repo}/_edit/{ref}/{blob.path}"
						class="flex items-center gap-1 text-xs font-medium hover:underline"
						style="color: var(--color-primary);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
						Edit
					</a>
				{/if}
				{#if isOwner}
					<button
						onclick={handleDelete}
						disabled={deleting}
						class="flex items-center gap-1 text-xs font-medium hover:underline disabled:opacity-40"
						style="color: var(--color-error);"
					>
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
						{deleting ? 'Deleting...' : 'Delete'}
					</button>
				{/if}
			</div>
		</div>

		{#if blob.binary}
			<div class="p-8 text-center text-[var(--color-text)] opacity-50">
				Binary file not shown.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-xs font-mono">
					<tbody>
						{#each lines as line, i}
							{@const lineNum = i + 1}
							<tr
								class="hover:bg-[var(--color-surface)] transition-colors"
								style="{selectedLine === lineNum ? `background: color-mix(in srgb, var(--color-primary) 8%, transparent);` : ''}"
							>
								<td
									class="px-3 py-0.5 text-right select-none w-1 whitespace-nowrap border-r border-[var(--color-border)] cursor-pointer"
									style="color: {selectedLine === lineNum ? 'var(--color-primary)' : 'var(--color-text)'}; opacity: {selectedLine === lineNum ? 0.8 : 0.3};"
									id="L{lineNum}"
									onclick={() => handleLineClick(lineNum)}
								>
									{lineNum}
								</td>
								<td class="px-4 py-0.5 whitespace-pre text-[var(--color-text)]">
									{line}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
