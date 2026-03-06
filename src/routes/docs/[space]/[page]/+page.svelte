<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { docs } from '$lib/services/api';
	import type { DocPage } from '$lib/types/doc';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import { marked } from 'marked';

	const spaceSlug = $derived($page.params.space!);
	const pageSlug = $derived($page.params.page!);

	let docPage = $state<DocPage | null>(null);
	let loading = $state(true);
	let editing = $state(false);
	let editContent = $state('');
	let editTitle = $state('');
	let saving = $state(false);
	let vimMode = $state<'normal' | 'insert'>('normal');
	let fetchId = 0;

	$effect(() => {
		const _space = spaceSlug;
		const _page = pageSlug;
		const id = ++fetchId;

		loading = true;
		docPage = null;

		docs.getPage(_space, _page).then(data => {
			if (id !== fetchId) return;
			docPage = data;
			editContent = data.content;
			editTitle = data.title;
		}).catch(() => {
			// ignore
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	function startEditing() {
		if (!docPage) return;
		editing = true;
		editContent = docPage.content;
		editTitle = docPage.title;
		vimMode = 'normal';
	}

	async function save() {
		if (!docPage || saving) return;
		saving = true;
		try {
			await docs.updatePage(spaceSlug, pageSlug, {
				title: editTitle,
				content: editContent,
			});
			docPage = { ...docPage, title: editTitle, content: editContent };
			editing = false;
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

	function handleEditorKeydown(e: KeyboardEvent) {
		if (!editing) return;

		if (e.key === 'Escape') {
			if (vimMode === 'insert') {
				vimMode = 'normal';
				e.preventDefault();
			} else {
				editing = false;
			}
			return;
		}

		if (vimMode === 'normal') {
			if (e.key === 'i') {
				vimMode = 'insert';
				e.preventDefault();
			} else if (e.key === 'a') {
				vimMode = 'insert';
				// don't prevent — let cursor advance
			} else if (e.key === ':') {
				e.preventDefault();
				// Could implement :w (save), :q (quit)
			}
			// In normal mode, prevent typing into textarea
			if (vimMode === 'normal' && !e.ctrlKey && !e.metaKey) {
				if (e.key.length === 1 && e.key !== 'i' && e.key !== 'a') {
					e.preventDefault();
				}
			}
		}

		// Ctrl+S / Cmd+S to save
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			save();
		}
	}

	const renderedContent = $derived(docPage?.content ? marked(docPage.content) : '');
</script>

<PageShell maxWidth="max-w-4xl">
	{#if loading}
		<div class="py-16 flex flex-col items-center gap-3">
			<div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
		</div>
	{:else if docPage}
		<div class="flex flex-col gap-6">
			<!-- Breadcrumb -->
			<div class="flex items-center gap-2 text-sm page-header">
				<a href="/docs" class="animated-link" style="color: var(--color-primary);">Docs</a>
				<span style="color: var(--color-text-dim); opacity: 0.3;">/</span>
				<a href="/docs/{spaceSlug}" class="animated-link" style="color: var(--color-primary);">{spaceSlug}</a>
				<span style="color: var(--color-text-dim); opacity: 0.3;">/</span>
				<span style="color: var(--color-text);">{docPage.title}</span>
			</div>

			{#if editing}
				<!-- Editor -->
				<div class="card overflow-hidden">
					<!-- Editor toolbar -->
					<div class="flex items-center justify-between px-4 py-2 border-b" style="border-color: var(--color-border); background: var(--color-surface);">
						<div class="flex items-center gap-3">
							<span class="text-[0.625rem] px-2 py-0.5 rounded font-mono font-bold" style="background: {vimMode === 'insert' ? 'var(--color-success)20' : 'var(--color-primary)20'}; color: {vimMode === 'insert' ? 'var(--color-success)' : 'var(--color-primary)'};">
								{vimMode === 'insert' ? 'INSERT' : 'NORMAL'}
							</span>
							<span class="text-[0.625rem]" style="color: var(--color-text-dim);">
								{vimMode === 'normal' ? 'Press i to edit, Esc to exit' : 'Press Esc for normal mode'}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<button class="text-xs px-3 py-1 rounded-lg" style="color: var(--color-text-dim);" onclick={() => { editing = false; }}>Cancel</button>
							<button
								class="text-xs px-3 py-1 rounded-lg font-medium text-white disabled:opacity-40"
								style="background: var(--color-primary);"
								disabled={saving}
								onclick={save}
							>{saving ? 'Saving...' : 'Save'}</button>
						</div>
					</div>

					<!-- Title -->
					<input
						type="text"
						bind:value={editTitle}
						class="w-full px-6 py-4 text-2xl font-bold bg-transparent border-b"
						style="border-color: var(--color-separator); color: var(--color-text);"
						placeholder="Page title..."
					/>

					<!-- Content editor -->
					<textarea
						bind:value={editContent}
						onkeydown={handleEditorKeydown}
						class="w-full px-6 py-4 text-sm font-mono bg-transparent resize-none leading-relaxed"
						style="color: var(--color-text); min-height: 500px; {vimMode === 'normal' ? 'caret-color: var(--color-primary); caret-shape: block;' : ''}"
						placeholder="Write in Markdown... (vim keybindings supported)"
						spellcheck={vimMode === 'insert'}
					></textarea>
				</div>
			{:else}
				<!-- View mode -->
				<div class="card overflow-hidden">
					<div class="flex items-center justify-between px-6 py-3 border-b" style="border-color: var(--color-border); background: var(--color-surface);">
						<div class="flex items-center gap-3 text-xs" style="color: var(--color-text-dim);">
							<span>by {docPage.author_username}</span>
							<span style="opacity: 0.3;">&middot;</span>
							<span><RelativeTime date={docPage.updated_at} /></span>
							{#if docPage.last_edited_by && docPage.last_edited_by !== docPage.author_username}
								<span style="opacity: 0.3;">&middot;</span>
								<span>edited by {docPage.last_edited_by}</span>
							{/if}
						</div>
						<button
							class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-[1.02]"
							style="color: var(--color-primary); background: var(--color-primary)10;"
							onclick={startEditing}
						>
							<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
							Edit
						</button>
					</div>

					<div class="px-6 py-6">
						<h1 class="text-3xl font-bold mb-6" style="color: var(--color-text);">
							{#if docPage.icon}<span class="mr-2">{docPage.icon}</span>{/if}
							{docPage.title}
						</h1>
						<div class="doc-content prose prose-invert max-w-none">
							{@html renderedContent}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="py-20 text-center">
			<p style="color: var(--color-text-dim);">Page not found</p>
			<a href="/docs/{spaceSlug}" class="text-sm animated-link mt-2 block" style="color: var(--color-primary);">Back to space</a>
		</div>
	{/if}
</PageShell>

<style>
	.doc-content :global(h1) { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: var(--color-text); }
	.doc-content :global(h2) { font-size: 1.375rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.5rem; color: var(--color-text); }
	.doc-content :global(h3) { font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--color-text); }
	.doc-content :global(p) { margin-bottom: 1rem; line-height: 1.75; color: var(--color-text); }
	.doc-content :global(a) { color: var(--color-primary); text-decoration: underline; }
	.doc-content :global(code) { font-family: 'JetBrains Mono', monospace; font-size: 0.85em; padding: 2px 6px; border-radius: 4px; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); }
	.doc-content :global(pre) { padding: 1rem; border-radius: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); overflow-x: auto; margin-bottom: 1rem; }
	.doc-content :global(pre code) { padding: 0; border: none; background: transparent; }
	.doc-content :global(ul), .doc-content :global(ol) { padding-left: 1.5rem; margin-bottom: 1rem; color: var(--color-text); }
	.doc-content :global(li) { margin-bottom: 0.25rem; }
	.doc-content :global(blockquote) { border-left: 3px solid var(--color-primary); padding-left: 1rem; margin-bottom: 1rem; color: var(--color-text-dim); font-style: italic; }
	.doc-content :global(hr) { border: none; border-top: 1px solid var(--color-separator); margin: 2rem 0; }
	.doc-content :global(table) { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	.doc-content :global(th), .doc-content :global(td) { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); text-align: left; font-size: 0.875rem; }
	.doc-content :global(th) { background: var(--color-surface); font-weight: 600; }
	.doc-content :global(img) { max-width: 100%; border-radius: 0.5rem; }
</style>
