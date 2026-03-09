<script lang="ts">
	import { page } from '$app/stores';
	import { pulls, repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { PullRequest, PRComment, PRReview } from '$lib/types/pull_request';
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
	let editingBody = $state(false);
	let editBodyText = $state('');

	let reviews = $state<PRReview[]>([]);
	let showReviewForm = $state(false);
	let reviewBody = $state('');
	let reviewState = $state<'approved' | 'changes_requested' | 'comment'>('comment');
	let submittingReview = $state(false);

	// Inline diff comment state
	let inlineCommentFile = $state<string | null>(null);
	let inlineCommentLine = $state<number | null>(null);
	let inlineCommentBody = $state('');
	let submittingInline = $state(false);

	onMount(async () => {
		try {
			[pr, comments, reviews] = await Promise.all([
				pulls.get(owner, repo, number),
				pulls.comments(owner, repo, number),
				pulls.reviews(owner, repo, number)
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

	// Separate general comments from inline comments
	const generalComments = $derived(comments.filter(c => !c.path));
	const inlineComments = $derived(comments.filter(c => c.path));

	function getInlineCommentsForLine(file: string, line: number): PRComment[] {
		return inlineComments.filter(c => c.path === file && c.line === line);
	}

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

	async function submitInlineComment() {
		if (!inlineCommentBody.trim() || !inlineCommentFile || !inlineCommentLine) return;
		submittingInline = true;
		try {
			await pulls.addComment(owner, repo, number, {
				body: inlineCommentBody,
				path: inlineCommentFile,
				line: inlineCommentLine
			});
			comments = await pulls.comments(owner, repo, number);
			inlineCommentBody = '';
			inlineCommentFile = null;
			inlineCommentLine = null;
		} catch {
			// ignore
		} finally {
			submittingInline = false;
		}
	}

	function openInlineComment(file: string, lineNum: number) {
		inlineCommentFile = file;
		inlineCommentLine = lineNum;
		inlineCommentBody = '';
	}

	function cancelInlineComment() {
		inlineCommentFile = null;
		inlineCommentLine = null;
		inlineCommentBody = '';
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

	async function saveBody() {
		if (!pr) return;
		try {
			await pulls.update(owner, repo, number, { body: editBodyText });
			pr = { ...pr, body: editBodyText };
			editingBody = false;
		} catch {
			// ignore
		}
	}

	async function submitReview() {
		if (!reviewBody.trim() && reviewState === 'comment') return;
		submittingReview = true;
		try {
			await pulls.addReview(owner, repo, number, { state: reviewState, body: reviewBody });
			reviews = await pulls.reviews(owner, repo, number);
			reviewBody = '';
			showReviewForm = false;
		} catch {
			// ignore
		} finally {
			submittingReview = false;
		}
	}

	const latestReviewByUser = $derived(() => {
		const byUser = new Map<string, PRReview>();
		for (const r of reviews) {
			if (r.state !== 'comment') byUser.set(r.author, r);
		}
		return byUser;
	});

	// Parse diff lines to compute actual line numbers
	function parseDiffLineNumber(hunkHeader: string, line: string, lineIndex: number, allLines: string[]): number | null {
		// Parse the @@ -a,b +c,d @@ header to get starting line numbers
		const match = hunkHeader.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
		if (!match) return null;
		let currentLine = parseInt(match[1]);

		// Walk through lines up to lineIndex to compute actual line number
		for (let i = 0; i < lineIndex; i++) {
			const l = allLines[i];
			if (l.startsWith('-')) continue; // deleted lines don't count for new file
			currentLine++;
		}
		// Current line
		if (line.startsWith('-')) return null; // deleted lines have no new-file number
		return currentLine;
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
				style="{activeTab === 'conversation' ? 'background-color: color-mix(in srgb, var(--color-primary) 6%, transparent); color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => { activeTab = 'conversation'; }}
			>Conversation</button>
			<button
				class="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
				style="{activeTab === 'diff' ? 'background-color: color-mix(in srgb, var(--color-primary) 6%, transparent); color: var(--color-primary);' : 'color: var(--color-text-dim);'}"
				onclick={() => { activeTab = 'diff'; }}
			>
				Files changed
				{#if diff}
					<span class="ml-1 text-xs px-1.5 py-0.5 rounded-full" style="background: var(--color-surface);">{diff.diff.length}</span>
				{/if}
			</button>
		</div>

		{#if activeTab === 'conversation'}
			{#if editingBody}
				<div class="card p-4 flex flex-col gap-2">
					<textarea
						bind:value={editBodyText}
						rows={8}
						class="w-full px-3 py-2 text-sm rounded-lg border resize-y"
						style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
					></textarea>
					<div class="flex items-center gap-2">
						<button onclick={saveBody} class="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style="background-color: var(--color-primary);">Save</button>
						<button onclick={() => { editingBody = false; }} class="px-3 py-1.5 text-xs rounded-lg" style="color: var(--color-text-dim);">Cancel</button>
					</div>
				</div>
			{:else if pr.body}
				<div class="card p-4 relative group">
					<MarkdownRenderer content={pr.body} />
					{#if isOwner}
						<button
							class="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
							style="background: var(--color-surface); color: var(--color-primary);"
							onclick={() => { editBodyText = pr!.body; editingBody = true; }}
						>Edit</button>
					{/if}
				</div>
			{:else if isOwner}
				<button
					class="text-xs hover:underline"
					style="color: var(--color-text-dim);"
					onclick={() => { editBodyText = ''; editingBody = true; }}
				>Add a description</button>
			{/if}

			<!-- Reviews -->
			{#if reviews.length > 0}
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">Reviews ({reviews.length})</h3>
					{#each reviews as review}
						<div class="card p-4 flex items-start gap-3">
							{#if review.state === 'approved'}
								<svg class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							{:else if review.state === 'changes_requested'}
								<svg class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
							{:else}
								<svg class="w-5 h-5 shrink-0 mt-0.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							{/if}
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 text-sm mb-1">
									<span class="font-medium" style="color: var(--color-text);">{review.author}</span>
									<span class="text-xs px-1.5 py-0.5 rounded-full font-medium"
										style="background: color-mix(in srgb, {review.state === 'approved' ? 'var(--color-success)' : review.state === 'changes_requested' ? 'var(--color-error)' : 'var(--color-text-dim)'} 8%, transparent); color: {review.state === 'approved' ? 'var(--color-success)' : review.state === 'changes_requested' ? 'var(--color-error)' : 'var(--color-text-dim)'};"
									>
										{review.state === 'approved' ? 'Approved' : review.state === 'changes_requested' ? 'Changes requested' : 'Commented'}
									</span>
									<span style="color: var(--color-text-dim);">· <RelativeTime date={review.created_at} /></span>
								</div>
								{#if review.body}
									<div class="text-sm" style="color: var(--color-text);"><MarkdownRenderer content={review.body} /></div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Submit review -->
			{#if userStore.isLoggedIn && pr.state === 'open'}
				{#if showReviewForm}
					<div class="card p-4 flex flex-col gap-3">
						<h3 class="text-sm font-semibold" style="color: var(--color-text);">Submit your review</h3>
						<textarea
							bind:value={reviewBody}
							placeholder="Leave a review comment..."
							rows={3}
							class="w-full px-3 py-2 text-sm rounded-lg border resize-y"
							style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
						></textarea>
						<div class="flex items-center gap-2 flex-wrap">
							<button
								onclick={() => { reviewState = 'approved'; submitReview(); }}
								disabled={submittingReview}
								class="px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40"
								style="background-color: var(--color-success);"
							>Approve</button>
							<button
								onclick={() => { reviewState = 'changes_requested'; submitReview(); }}
								disabled={submittingReview}
								class="px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40"
								style="background-color: var(--color-error);"
							>Request changes</button>
							<button
								onclick={() => { reviewState = 'comment'; submitReview(); }}
								disabled={submittingReview || !reviewBody.trim()}
								class="px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-40"
								style="border-color: var(--color-border); color: var(--color-text);"
							>Comment</button>
							<button
								onclick={() => { showReviewForm = false; }}
								class="px-3 py-1.5 text-xs rounded-lg"
								style="color: var(--color-text-dim);"
							>Cancel</button>
						</div>
					</div>
				{:else}
					<button
						onclick={() => { showReviewForm = true; }}
						class="self-start px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--color-surface)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>Add your review</button>
				{/if}
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
						style="border-color: color-mix(in srgb, var(--color-success) 19%, transparent); color: var(--color-success);"
						onclick={reopenPR}
					>Reopen pull request</button>
				</div>
			{/if}

			<!-- Comments -->
			{#if generalComments.length > 0}
				<div class="flex flex-col gap-4">
					<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">Comments ({generalComments.length})</h3>
					{#each generalComments as comment}
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

			<!-- Inline comments summary -->
			{#if inlineComments.length > 0}
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">
						Inline comments ({inlineComments.length})
						<button class="text-xs font-normal hover:underline ml-2" style="color: var(--color-primary);" onclick={() => { activeTab = 'diff'; }}>View in diff</button>
					</h3>
					{#each inlineComments as comment}
						<div class="card p-3">
							<div class="flex items-center gap-2 text-xs mb-1.5" style="color: var(--color-text-dim);">
								<span class="font-medium" style="color: var(--color-text);">{comment.author}</span>
								commented on
								<code class="px-1 py-0.5 rounded text-xs" style="background: var(--color-surface);">{comment.path}</code>
								line {comment.line}
								{#if comment.created_at}
									· <RelativeTime date={comment.created_at} />
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
			<!-- Diff view with inline comments -->
			{#if !diff}
				<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">Loading diff...</div>
			{:else if diff.diff.length === 0}
				<div class="py-8 text-center text-sm" style="color: var(--color-text-dim);">No file changes.</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each diff.diff as file}
						{@const fileName = file.to_file || file.from_file}
						<div class="rounded-lg border overflow-hidden" style="border-color: var(--color-border);">
							<div class="px-4 py-2 text-xs font-mono font-medium border-b flex items-center justify-between" style="background: var(--color-surface); border-color: var(--color-border); color: var(--color-text);">
								<span>{fileName}</span>
								{#if inlineComments.filter(c => c.path === fileName).length > 0}
									<span class="text-xs px-1.5 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{inlineComments.filter(c => c.path === fileName).length} comment{inlineComments.filter(c => c.path === fileName).length > 1 ? 's' : ''}</span>
								{/if}
							</div>
							{#each file.hunks as hunk}
								<div class="text-xs font-mono px-4 py-1 border-b" style="background: color-mix(in srgb, var(--color-primary) 3%, transparent); border-color: var(--color-border); color: var(--color-primary);">
									{hunk.header}
								</div>
								<div class="overflow-x-auto">
									{#each hunk.lines as line, lineIdx}
										{@const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx'}
										{@const lineNum = parseDiffLineNumber(hunk.header, line, lineIdx, hunk.lines)}
										<div
											class="group flex"
											style="background: {type === 'add' ? 'color-mix(in srgb, var(--color-success) 6%, transparent)' : type === 'del' ? 'color-mix(in srgb, var(--color-error) 6%, transparent)' : 'transparent'};"
										>
											<!-- Line number + comment button -->
											<div class="shrink-0 w-10 text-right pr-2 select-none relative" style="color: var(--color-text-dim); opacity: 0.4;">
												{#if lineNum && userStore.isLoggedIn}
													<button
														class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
														style="color: var(--color-primary);"
														title="Add comment on line {lineNum}"
														onclick={() => openInlineComment(fileName, lineNum!)}
													>
														<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
													</button>
												{/if}
											</div>
											<div
												class="flex-1 px-4 py-0 whitespace-pre font-mono text-xs"
												style="color: {type === 'add' ? 'var(--color-success)' : type === 'del' ? 'var(--color-error)' : 'var(--color-text)'};"
											>{line}</div>
										</div>

										<!-- Inline comments for this line -->
										{#if lineNum}
											{@const lineComments = getInlineCommentsForLine(fileName, lineNum)}
											{#each lineComments as lc}
												<div class="border-y px-4 py-3 flex flex-col gap-1" style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-primary) 3%, transparent);">
													<div class="flex items-center gap-2 text-xs">
														<span class="font-medium" style="color: var(--color-text);">{lc.author}</span>
														<span style="color: var(--color-text-dim);"><RelativeTime date={lc.created_at} /></span>
													</div>
													<div class="text-xs" style="color: var(--color-text);">
														<MarkdownRenderer content={lc.body} />
													</div>
												</div>
											{/each}

											<!-- Inline comment form -->
											{#if inlineCommentFile === fileName && inlineCommentLine === lineNum}
												<div class="border-y px-4 py-3 flex flex-col gap-2" style="border-color: color-mix(in srgb, var(--color-primary) 19%, transparent); background: color-mix(in srgb, var(--color-primary) 3%, transparent);">
													<textarea
														bind:value={inlineCommentBody}
														placeholder="Write a comment..."
														rows={3}
														class="w-full px-3 py-2 text-xs rounded-lg border resize-y"
														style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
													></textarea>
													<div class="flex items-center gap-2">
														<button
															disabled={submittingInline || !inlineCommentBody.trim()}
															onclick={submitInlineComment}
															class="px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40"
															style="background-color: var(--color-primary);"
														>{submittingInline ? 'Posting...' : 'Add comment'}</button>
														<button
															onclick={cancelInlineComment}
															class="px-3 py-1.5 text-xs rounded-lg border"
															style="border-color: var(--color-border); color: var(--color-text-dim);"
														>Cancel</button>
													</div>
												</div>
											{/if}
										{/if}
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
