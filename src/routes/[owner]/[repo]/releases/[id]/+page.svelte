<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { releases, repos } from '$lib/services/api';
	import type { Release } from '$lib/types/release';
	import { userStore } from '$lib/stores/user.svelte';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);
	const releaseId = $derived(Number($page.params.id!));
	const isOwner = $derived(userStore.user?.username === owner);

	let release = $state<Release | null>(null);
	let loading = $state(true);
	let editing = $state(false);
	let editTitle = $state('');
	let editBody = $state('');
	let editDraft = $state(false);
	let editPrerelease = $state(false);
	let saving = $state(false);
	let deleting = $state(false);

	onMount(async () => {
		try {
			release = await releases.get(owner, repo, releaseId);
			editTitle = release.title;
			editBody = release.body;
			editDraft = release.is_draft;
			editPrerelease = release.is_prerelease;
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function handleSave() {
		if (!release) return;
		saving = true;
		try {
			await releases.update(owner, repo, releaseId, {
				title: editTitle,
				body: editBody,
				is_draft: editDraft,
				is_prerelease: editPrerelease
			});
			release = { ...release, title: editTitle, body: editBody, is_draft: editDraft, is_prerelease: editPrerelease };
			editing = false;
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this release? This action cannot be undone.')) return;
		deleting = true;
		try {
			await releases.remove(owner, repo, releaseId);
			goto(`/${owner}/${repo}/releases`);
		} catch {
			deleting = false;
		}
	}

	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if release}
	<div class="flex flex-col gap-6 max-w-3xl">
		{#if editing}
			<!-- Edit mode -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold" style="color: var(--color-text);">Edit Release</h2>
					<button
						class="text-sm hover:underline"
						style="color: var(--color-text-dim);"
						onclick={() => { editing = false; editTitle = release!.title; editBody = release!.body; editDraft = release!.is_draft; editPrerelease = release!.is_prerelease; }}
					>Cancel</button>
				</div>
				<div>
					<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Title</label>
					<input
						type="text"
						bind:value={editTitle}
						class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)]"
						style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium mb-2" style="color: var(--color-text-dim);">Release notes (Markdown)</label>
					<textarea
						bind:value={editBody}
						rows={10}
						class="w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:border-[var(--color-primary)] resize-y"
						style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
					></textarea>
				</div>
				<div class="flex items-center gap-4">
					<label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-text);">
						<input type="checkbox" bind:checked={editPrerelease} class="rounded" />
						Pre-release
					</label>
					<label class="flex items-center gap-2 text-sm cursor-pointer" style="color: var(--color-text);">
						<input type="checkbox" bind:checked={editDraft} class="rounded" />
						Draft
					</label>
				</div>
				<button
					onclick={handleSave}
					disabled={saving || !editTitle.trim()}
					class="self-start px-5 py-2.5 text-sm font-medium rounded-xl text-white disabled:opacity-40 transition-all hover:brightness-110"
					style="background-color: var(--color-primary);"
				>
					{saving ? 'Saving...' : 'Update release'}
				</button>
			</div>
		{:else}
			<!-- View mode -->
			<div class="flex items-start justify-between gap-4">
				<div>
					<div class="flex items-center gap-3 flex-wrap">
						<h2 class="text-xl font-bold" style="color: var(--color-text);">{release.title}</h2>
						<code class="text-xs px-2 py-0.5 rounded-lg" style="background: var(--color-surface-hover); color: var(--color-primary);">{release.tag_name}</code>
						{#if release.is_prerelease}
							<span class="text-[0.625rem] px-2 py-0.5 rounded-full border" style="border-color: var(--color-warning); color: var(--color-warning);">Pre-release</span>
						{/if}
						{#if release.is_draft}
							<span class="text-[0.625rem] px-2 py-0.5 rounded-full border" style="border-color: var(--color-text-dim); color: var(--color-text-dim);">Draft</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 mt-2 text-xs" style="color: var(--color-text-dim);">
						<span>{release.author}</span>
						<span>&middot;</span>
						<RelativeTime date={release.created_at} />
					</div>
				</div>
				{#if isOwner}
					<div class="flex items-center gap-2 shrink-0">
						<button
							class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
							style="border-color: var(--color-border); color: var(--color-text);"
							onclick={() => { editing = true; }}
						>Edit</button>
						<button
							class="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10"
							style="border-color: var(--color-border); color: var(--color-error);"
							onclick={handleDelete}
							disabled={deleting}
						>{deleting ? 'Deleting...' : 'Delete'}</button>
					</div>
				{/if}
			</div>

			{#if release.body}
				<div class="card p-6">
					<MarkdownRenderer content={release.body} />
				</div>
			{/if}

			<!-- Download links -->
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-text-dim);">Downloads</h3>
				<div class="flex flex-col gap-1.5">
					<a
						href={repos.archiveUrl(owner, repo, release.tag_name, 'zip')}
						class="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors hover:bg-[var(--color-surface)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						Source code (zip)
					</a>
					<a
						href={repos.archiveUrl(owner, repo, release.tag_name, 'tar.gz')}
						class="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors hover:bg-[var(--color-surface)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						Source code (tar.gz)
					</a>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Release not found.</div>
{/if}
