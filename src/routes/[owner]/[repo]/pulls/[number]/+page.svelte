<script lang="ts">
	import { page } from '$app/stores';
	import { pulls, repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { PullRequest, PRComment } from '$lib/types/pull_request';
	import type { CompareResult } from '$lib/types/repository';
	import { onMount } from 'svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);
	const number = $derived(parseInt($page.params.number!));
	const isOwner = $derived(userStore.user?.username === owner);

	let pr = $state<PullRequest | null>(null);
	let comments = $state<PRComment[]>([]);
	let diff = $state<CompareResult | null>(null);
	let loading = $state(true);
	let commentBody = $state('');
	let submittingComment = $state(false);
	let merging = $state(false);
	let activeTab = $state<'conversation' | 'diff'>('conversation');
	let editingTitle = $state(false);
	let editTitle = $state('');

	onMount(async () => {
		try {
			[pr, comments] = await Promise.all([
				pulls.get(owner, repo, number),
				pulls.comments(owner, repo, number)
			]);
			if (pr) {
				repos.compare(owner, repo, pr.base_branch, pr.head_branch)
					.then(d => { diff = d; })
					.catch(() => {});
			}
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	});

	async function addComment(e: Event) {
		e.preventDefault();
		if (!commentBody.trim()) return;
		submittingComment = true;
		try {
			await pulls.addComment(owner, repo, number, { body: commentBody });
			comments = await pulls.comments(owner, repo, number);
			commentBody = '';
		} catch {
			// ignore
		} finally {
			submittingComment = false;
		}
	}

	async function handleMerge() {
		merging = true;
		try {
			await pulls.merge(owner, repo, number);
			pr = await pulls.get(owner, repo, number);
		} catch {
			// ignore
		} finally {
			merging = false;
		}
	}

	async function closePR() {
		try {
			await pulls.update(owner, repo, number, { state: 'closed' });
			pr = await pulls.get(owner, repo, number);
		} catch {
			// ignore
		}
	}

	async function reopenPR() {
		try {
			await pulls.update(owner, repo, number, { state: 'open' });
			pr = await pulls.get(owner, repo, number);
		} catch {
			// ignore
		}
	}

	async function saveTitle() {
		if (!editTitle.trim() || !pr) return;
		try {
			await pulls.update(owner, repo, number, { title: editTitle.trim() });
			pr = { ...pr, title: editTitle.trim() };
			editingTitle = false;
		} catch {
			// ignore
		}
	}
</script>

{#if loading}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
{:else if pr}
	<div class="flex flex-col gap-6">
		<div>
			{#if editingTitle}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={editTitle}
						class="flex-1 text-xl font-bold px-2 py-1 rounded-lg border"
						style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
					/>
					<button class="px-3 py-1 text-sm rounded-lg text-white" style="background-color: var(--color-primary);" onclick={saveTitle}>Save</button>
					<button class="px-3 py-1 text-sm rounded-lg border" style="border-color: var(--color-border); color: var(--color-text-dim);" onclick={() => { editingTitle = false; }}>Cancel</button>
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<h2 class="text-xl font-bold" style="color: var(--color-text);">{pr.title} <span class="font-normal" style="color: var(--color-text-dim);">#{pr.number}</span></h2>
					{#if isOwner}
						<button class="text-xs hover:underline" style="color: var(--color-primary);" onclick={() => { editTitle = pr!.title; editingTitle = true; }}>Edit</button>
					{/if}
				</div>
			{/if}
			<div class="flex items-center gap-2 mt-2 text-sm">
				<span class="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
					style="background-color: {pr.state === 'merged' ? 'var(--color-secondary)' : pr.state === 'open' ? 'var(--color-success)' : 'var(--color-error)'};"
				>{pr.state}</span>
				<span style="color: var(--color-text-dim);">
					{pr.author} wants to merge <code class="px-1.5 py-0.5 rounded text-xs" style="background: var(--color-surface); color: var(--color-primary);">{pr.head_branch}</code> into <code class="px-1.5 py-0.5 rounded text-xs" style="background: var(--color-surface); color: var(--color-primary);">{pr.base_branch}</code>
				</span>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex items-center gap-1 rounded-xl border p-1 self-start" style="border-color: var(--color-border);">
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="{activeTab === 'conversation' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => { activeTab = 'conversation'; }}
			>Conversation</button>
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="{activeTab === 'diff' ? 'background-color: var(--color-primary)10; color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => { activeTab = 'diff'; }}
			>
				Files changed
				{#if diff}
					<span class="ml-1 text-xs px-1.5 py-0.5 rounded-full" style="background: var(--color-surface);">{diff.diff.length}</span>
				{/if}
			</button>
		</div>

		{#if activeTab === 'conversation'}
			{#if pr.body}
				<div class="card p-4">
					<MarkdownRenderer content={pr.body} />
				</div>
			{/if}

			{#if pr.state === 'open'}
				<div class="flex items-center gap-3">
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-40"
						style="background-color: var(--color-success);"
						onclick={handleMerge}
						disabled={merging}
					>{merging ? 'Merging...' : 'Merge Pull Request'}</button>
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
						style="border-color: var(--color-border); color: var(--color-error);"
						onclick={closePR}
					>Close</button>
				</div>
			{:else if pr.state === 'closed'}
				<div class="flex items-center gap-3">
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
						style="border-color: var(--color-success)30; color: var(--color-success);"
						onclick={reopenPR}
					>Reopen pull request</button>
				</div>
			{/if}

			<!-- Comments -->
			{#if comments.length > 0}
				<div class="flex flex-col gap-4">
					<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">Comments ({comments.length})</h3>
					{#each comments as comment}
						<div class="card p-4">
							<div class="flex items-center gap-2 mb-2 text-sm">
								<span class="font-medium" style="color: var(--color-text);">{comment.author}</span>
								{#if comment.created_at}
									<span style="color: var(--color-text-dim);">· <RelativeTime date={comment.created_at} /></span>
								{/if}
							</div>
							<MarkdownRenderer content={comment.body} />
						</div>
					{/each}
				</div>
			{/if}

			<form onsubmit={addComment} class="flex flex-col gap-3">
				<textarea
					bind:value={commentBody}
					placeholder="Leave a comment..."
					rows={4}
					class="w-full px-4 py-2.5 text-sm rounded-lg border resize-y"
					style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
				></textarea>
				<button
					type="submit"
					disabled={submittingComment || !commentBody.trim()}
					class="self-start px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
					style="background-color: var(--color-primary);"
				>{submittingComment ? 'Posting...' : 'Comment'}</button>
			</form>
		{:else}
			<!-- Diff view -->
			{#if !diff}
				<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">Loading diff...</div>
			{:else if diff.diff.length === 0}
				<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">No file changes.</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each diff.diff as file}
						<div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border);">
							<div class="px-4 py-2 text-xs font-mono font-medium border-b" style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">
								{file.to_file || file.from_file}
							</div>
							{#each file.hunks as hunk}
								<div class="text-xs font-mono px-4 py-1 border-b" style="background: var(--color-primary)08; border-color: var(--color-border); color: var(--color-primary);">
									{hunk.header}
								</div>
								<div class="overflow-x-auto">
									{#each hunk.lines as line}
										{@const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx'}
										<div
											class="px-4 py-0 whitespace-pre font-mono text-xs"
											style="background: {type === 'add' ? 'var(--color-success)10' : type === 'del' ? 'var(--color-error)10' : 'transparent'}; color: {type === 'add' ? 'var(--color-success)' : type === 'del' ? 'var(--color-error)' : 'var(--color-text)'};"
										>{line}</div>
									{/each}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}
