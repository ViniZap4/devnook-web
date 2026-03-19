<script lang="ts">
	import { page } from '$app/stores';
	import { issues as issuesApi, labels as labelsApi, milestones as milestonesApi, repos as reposApi } from '$lib/services/api';
	import type { Collaborator } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Issue, Label, Milestone } from '$lib/types/issue';
	import type { IssueComment as IssueCommentType } from '$lib/types/issue';
	import IssueComment from '$lib/components/IssueComment.svelte';
	import CommentForm from '$lib/components/CommentForm.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const issueNumber = $derived(Number($page.params.number!));

	let issue = $state<Issue | null>(null);
	let comments = $state<IssueCommentType[]>([]);
	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);
	let loading = $state(true);
	let notFound = $state(false);
	let showLabelPicker = $state(false);

	let editingTitle = $state(false);
	let editTitle = $state('');
	let editingBody = $state(false);
	let editBody = $state('');
	let editPreview = $state(false);

	let editingAssignee = $state(false);
	let collaboratorsList = $state<Collaborator[]>([]);

	// Close-with-comment state
	let closeWithCommentBody = $state('');
	let closingWithComment = $state(false);

	let fetchId = 0;

	// Permission: repo owner OR issue author OR collaborator
	const canEdit = $derived(
		userStore.user?.username === owner ||
		userStore.user?.username === issue?.author ||
		collaboratorsList.some(c => c.username === userStore.user?.username)
	);

	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		const _number = issueNumber;
		const id = ++fetchId;

		loading = true;
		notFound = false;
		issue = null;
		comments = [];

		Promise.all([
			issuesApi.get(_owner, _repo, _number),
			issuesApi.comments(_owner, _repo, _number),
			labelsApi.list(_owner, _repo),
			milestonesApi.list(_owner, _repo),
			reposApi.listCollaborators(_owner, _repo).catch(() => [] as Collaborator[])
		]).then(([issueData, commentsData, labelsData, milestonesData, collabsData]) => {
			if (id !== fetchId) return;
			issue = issueData;
			comments = commentsData;
			repoLabels = labelsData;
			repoMilestones = milestonesData;
			collaboratorsList = collabsData;
		}).catch(() => {
			if (id !== fetchId) return;
			notFound = true;
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	async function toggleState() {
		if (!issue) return;
		const newState = issue.state === 'open' ? 'closed' : 'open';
		try {
			await issuesApi.update(owner, repoName, issueNumber, { state: newState });
			issue = { ...issue, state: newState };
			toastStore.success(`Issue ${newState === 'closed' ? 'closed' : 'reopened'} successfully`);
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update issue state');
		}
	}

	async function closeWithComment() {
		if (!issue || !closeWithCommentBody.trim()) return;
		closingWithComment = true;
		try {
			// Add comment first, then close
			await issuesApi.addComment(owner, repoName, issueNumber, { body: closeWithCommentBody.trim() });
			await issuesApi.update(owner, repoName, issueNumber, { state: 'closed' });
			comments = await issuesApi.comments(owner, repoName, issueNumber);
			issue = { ...issue, state: 'closed' };
			closeWithCommentBody = '';
			toastStore.success('Comment added and issue closed');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to close with comment');
		} finally {
			closingWithComment = false;
		}
	}

	async function addComment(body: string) {
		try {
			await issuesApi.addComment(owner, repoName, issueNumber, { body });
			comments = await issuesApi.comments(owner, repoName, issueNumber);
			toastStore.success('Comment added');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add comment');
		}
	}

	async function editComment(id: number, body: string) {
		try {
			await issuesApi.updateComment(owner, repoName, issueNumber, id, { body });
			comments = await issuesApi.comments(owner, repoName, issueNumber);
			toastStore.success('Comment updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update comment');
		}
	}

	async function deleteComment(id: number) {
		try {
			await issuesApi.removeComment(owner, repoName, issueNumber, id);
			comments = comments.filter((c) => c.id !== id);
			toastStore.success('Comment deleted');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete comment');
		}
	}

	async function addLabel(labelId: number) {
		try {
			await labelsApi.addToIssue(owner, repoName, issueNumber, labelId);
			issue = await issuesApi.get(owner, repoName, issueNumber);
			toastStore.success('Label added');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add label');
		}
	}

	async function removeLabel(labelId: number) {
		try {
			await labelsApi.removeFromIssue(owner, repoName, issueNumber, labelId);
			issue = await issuesApi.get(owner, repoName, issueNumber);
			toastStore.success('Label removed');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to remove label');
		}
	}

	async function saveTitle() {
		if (!editTitle.trim() || !issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { title: editTitle.trim() });
			issue = { ...issue, title: editTitle.trim() };
			editingTitle = false;
			toastStore.success('Title updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update title');
		}
	}

	async function saveBody() {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { body: editBody });
			issue = { ...issue, body: editBody };
			editingBody = false;
			editPreview = false;
			toastStore.success('Description updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update description');
		}
	}

	function cancelEditBody() {
		const hasChanges = editBody !== (issue?.body ?? '');
		if (hasChanges) {
			if (!confirm('Discard changes to the description?')) return;
		}
		editingBody = false;
		editPreview = false;
	}

	function handleBodyKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			saveBody();
		}
	}

	async function setAssignee(userId: number) {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { assignee_id: userId });
			issue = await issuesApi.get(owner, repoName, issueNumber);
			editingAssignee = false;
			toastStore.success('Assignee updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update assignee');
		}
	}

	async function clearAssignee() {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { assignee_id: 0 });
			issue = await issuesApi.get(owner, repoName, issueNumber);
			toastStore.success('Assignee cleared');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to clear assignee');
		}
	}

	async function setMilestone(milestoneId: number) {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { milestone_id: milestoneId });
			issue = await issuesApi.get(owner, repoName, issueNumber);
			toastStore.success('Milestone updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update milestone');
		}
	}

	async function setDueDate(value: string) {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { due_date: value || undefined });
			issue = { ...issue, due_date: value || undefined };
			toastStore.success(value ? 'Due date set' : 'Due date cleared');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update due date');
		}
	}

	async function setStoryPoints(value: number) {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, issueNumber, { story_points: value });
			issue = { ...issue, story_points: value };
			toastStore.success('Story points updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update story points');
		}
	}

	// Format ISO date string to YYYY-MM-DD for date input value
	function toDateInputValue(dateStr: string | undefined): string {
		if (!dateStr) return '';
		return dateStr.slice(0, 10);
	}

	const issueLabels = $derived(issue?.labels ?? []);
	const issueLabelIds = $derived(new Set(issueLabels.map((l) => l.id)));
	const availableLabels = $derived(repoLabels.filter((l) => !issueLabelIds.has(l.id)));
	const currentMilestone = $derived(
		issue?.milestone_id ? repoMilestones.find((m) => m.id === issue!.milestone_id) : null
	);
</script>

{#if loading}
	<div class="py-16 text-center card-animate">
		<div class="inline-flex flex-col items-center gap-3">
			<Spinner size="lg" />
			<span class="text-sm" style="color: var(--color-text-dim);">Loading issue...</span>
		</div>
	</div>
{:else if notFound}
	<div class="py-16 text-center card-animate">
		<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: var(--color-error-subtle);">
			<svg class="w-8 h-8 opacity-40" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
		</div>
		<p class="text-lg font-medium mb-1" style="color: var(--color-text);">Issue not found</p>
		<p class="text-sm mb-4" style="color: var(--color-text-dim);">This issue may have been deleted or does not exist.</p>
		<a
			href="/{owner}/{repoName}/issues"
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl glass-subtle transition-all hover:scale-[1.02]"
			style="color: var(--color-primary);"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
			Back to Issues
		</a>
	</div>
{:else if issue}
	<div class="flex flex-col gap-6 content-reveal">
		<!-- Breadcrumb -->
		<div class="flex items-center gap-2 text-sm page-header">
			<a href="/{owner}/{repoName}/issues" class="animated-link font-medium" style="color: var(--color-primary);">Issues</a>
			<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
			<span class="font-medium truncate max-w-xs" style="color: var(--color-text);">#{issue.number} {issue.title}</span>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
			<!-- Main content -->
			<div class="flex flex-col gap-5 min-w-0">
				<!-- Header: title + state badge -->
				<div class="flex flex-col gap-3 card-animate stagger-1">
					{#if editingTitle}
						<div class="flex items-center gap-2">
							<input
								type="text"
								bind:value={editTitle}
								class="flex-1 text-xl font-bold px-3 py-2 rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
								style="border-color: var(--glass-border); color: var(--color-text);"
							/>
							<button
								class="btn-glow px-4 py-2 text-sm rounded-xl text-white font-medium"
								style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
								onclick={saveTitle}
							>Save</button>
							<button
								class="px-4 py-2 text-sm rounded-xl glass-subtle"
								style="color: var(--color-text-dim);"
								onclick={() => { editingTitle = false; }}
							>Cancel</button>
						</div>
					{:else}
						<div class="flex items-start gap-3">
							<h2 class="text-xl font-bold flex-1 min-w-0" style="color: var(--color-text);">
								{issue.title}
								<span class="font-normal text-lg" style="color: var(--color-text-dim);">&nbsp;#{issue.number}</span>
							</h2>
							{#if canEdit}
								<button
									class="text-xs animated-link shrink-0 mt-1"
									style="color: var(--color-primary);"
									onclick={() => { editTitle = issue!.title; editingTitle = true; }}
								>Edit</button>
							{/if}
						</div>
					{/if}

					<!-- State badge + meta -->
					<div class="flex items-center gap-3 flex-wrap text-sm">
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
							style="
								background: {issue.state === 'open' ? 'var(--color-success-subtle)' : 'rgba(255,255,255,0.06)'};
								color: {issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};
								border: 1px solid {issue.state === 'open' ? 'var(--color-success-subtle)' : 'rgba(255,255,255,0.08)'};
							"
						>
							{#if issue.state === 'open'}
								<span class="w-1.5 h-1.5 rounded-full live-dot" style="background: var(--color-success);"></span>
							{:else}
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" /></svg>
							{/if}
							{issue.state}
						</span>
						<span style="color: var(--color-text-dim);">
							<a href="/{issue.author}" class="font-medium animated-link" style="color: var(--color-text);">{issue.author}</a>
							opened <RelativeTime date={issue.created_at} />
						</span>
						{#if comments.length > 0}
							<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
								<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
								{comments.length} comment{comments.length !== 1 ? 's' : ''}
							</span>
						{/if}
					</div>
				</div>

				<!-- Body -->
				{#if editingBody}
					<div class="card p-5 flex flex-col gap-3 animate-fade-up-sm card-animate stagger-2">
						<div class="flex items-center justify-between mb-1">
							<span class="section-title">Edit description</span>
							<div class="flex items-center gap-1 glass-subtle rounded-lg p-0.5">
								<button
									type="button"
									class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
									style="
										color: {!editPreview ? 'var(--color-primary)' : 'var(--color-text-dim)'};
										background: {!editPreview ? 'var(--color-primary-subtle)' : 'transparent'};
										font-weight: {!editPreview ? '600' : '400'};
									"
									onclick={() => { editPreview = false; }}
								>Write</button>
								<button
									type="button"
									class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
									style="
										color: {editPreview ? 'var(--color-primary)' : 'var(--color-text-dim)'};
										background: {editPreview ? 'var(--color-primary-subtle)' : 'transparent'};
										font-weight: {editPreview ? '600' : '400'};
									"
									onclick={() => { editPreview = true; }}
								>Preview</button>
							</div>
						</div>
						{#if editPreview}
							<div class="card min-h-[200px] px-4 py-3 animate-fade-up-sm">
								{#if editBody.trim()}
									<MarkdownRenderer content={editBody} />
								{:else}
									<p class="text-sm italic" style="color: var(--color-text-dim);">Nothing to preview</p>
								{/if}
							</div>
						{:else}
							<textarea
								bind:value={editBody}
								rows={8}
								onkeydown={handleBodyKeydown}
								class="w-full px-4 py-3 text-sm rounded-xl border resize-y bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
								style="border-color: var(--glass-border); color: var(--color-text);"
							></textarea>
						{/if}
						<div class="flex items-center gap-2">
							<button
								onclick={saveBody}
								class="btn-glow px-4 py-2 text-xs font-semibold rounded-xl text-white"
								style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
							>Save changes</button>
							<button
								onclick={cancelEditBody}
								class="px-4 py-2 text-xs rounded-xl glass-subtle"
								style="color: var(--color-text-dim);"
							>Cancel</button>
							{#if !editPreview}
								<span class="ml-auto text-[0.625rem]" style="color: var(--color-text-dim);">
									{editBody.length} chars &middot; Ctrl+Enter to save
								</span>
							{/if}
						</div>
					</div>
				{:else}
					<div class="card p-5 relative group card-animate stagger-2">
						{#if issue.body}
							<MarkdownRenderer content={issue.body} />
						{:else}
							<p class="text-sm italic" style="color: var(--color-text-dim);">No description provided.</p>
						{/if}
						{#if canEdit}
							<button
								class="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 glass-subtle"
								style="color: var(--color-primary);"
								onclick={() => { editBody = issue!.body || ''; editingBody = true; }}
							>Edit</button>
						{/if}
					</div>
				{/if}

				<!-- Close / Reopen action -->
				<div class="flex items-center gap-3 card-animate stagger-3">
					<button
						onclick={toggleState}
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 press-scale"
						style="
							border: 1px solid {issue.state === 'open' ? 'var(--color-error-subtle)' : 'var(--color-success-subtle)'};
							color: {issue.state === 'open' ? 'var(--color-error)' : 'var(--color-success)'};
							background: {issue.state === 'open' ? 'var(--color-error-subtle)' : 'var(--color-success-subtle)'};
						"
					>
						{#if issue.state === 'open'}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							Close issue
						{:else}
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
							Reopen issue
						{/if}
					</button>
				</div>

				<!-- Comments -->
				{#if comments.length > 0}
					<div class="flex flex-col gap-4 card-animate stagger-4">
						<h3 class="section-title">
							{comments.length} comment{comments.length !== 1 ? 's' : ''}
						</h3>
						{#each comments as comment, i}
							<div class="row-animate" style="animation-delay: {0.05 + i * 0.04}s;">
								<IssueComment
									{comment}
									currentUser={userStore.user?.username ?? ''}
									onEdit={editComment}
									onDelete={deleteComment}
								/>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add comment form -->
				<div class="card p-5 card-animate stagger-5">
					<h3 class="section-title mb-4">Leave a comment</h3>
					<CommentForm onSubmit={addComment} />
				</div>

				<!-- Close with comment (only when open and user can edit) -->
				{#if issue.state === 'open' && canEdit}
					<div class="card p-5 card-animate stagger-6">
						<h3 class="section-title mb-3">Close with comment</h3>
						<p class="text-xs mb-3" style="color: var(--color-text-dim);">Add a final comment and close this issue in one action.</p>
						<textarea
							bind:value={closeWithCommentBody}
							rows={3}
							placeholder="Leave a closing comment..."
							class="w-full px-4 py-3 text-sm rounded-xl border resize-y bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none mb-3"
							style="border-color: var(--glass-border); color: var(--color-text);"
						></textarea>
						<button
							onclick={closeWithComment}
							disabled={!closeWithCommentBody.trim() || closingWithComment}
							class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 press-scale disabled:opacity-40 disabled:cursor-not-allowed"
							style="
								border: 1px solid var(--color-error-subtle);
								color: var(--color-error);
								background: var(--color-error-subtle);
							"
						>
							{#if closingWithComment}
								<Spinner size="sm" />
							{:else}
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							{/if}
							Close with comment
						</button>
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="flex flex-col gap-4">
				<!-- Labels -->
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.1s;">
					<div class="flex items-center justify-between mb-3">
						<h3 class="section-title">Labels</h3>
						{#if canEdit && repoLabels.length > 0}
							<button
								class="text-xs animated-link"
								style="color: var(--color-primary);"
								onclick={() => { showLabelPicker = !showLabelPicker; }}
							>{showLabelPicker ? 'Done' : 'Edit'}</button>
						{/if}
					</div>
					{#if issueLabels.length === 0 && !showLabelPicker}
						<p class="text-xs" style="color: var(--color-text-dim);">None yet</p>
					{/if}
					{#if issueLabels.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-2">
							{#each issueLabels as label}
								<span
									class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium transition-all duration-200 hover:scale-105"
									style="background-color: color-mix(in srgb, {label.color} 10%, var(--color-surface)); color: {label.color}; border: 1px solid color-mix(in srgb, {label.color} 19%, var(--color-surface));"
								>
									{label.name}
									{#if canEdit}
										<button
											onclick={() => removeLabel(label.id)}
											class="ml-0.5 hover:opacity-60 transition-opacity leading-none"
											title="Remove label"
										>&times;</button>
									{/if}
								</span>
							{/each}
						</div>
					{/if}
					{#if showLabelPicker && availableLabels.length > 0}
						<div class="flex flex-col gap-1 animate-fade-up-sm">
							{#each availableLabels as label}
								<button
									class="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg w-full text-left transition-all duration-200"
									style="color: var(--color-text);"
									onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-subtle)'; }}
									onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
									onclick={() => addLabel(label.id)}
								>
									<span class="w-3 h-3 rounded-full shrink-0" style="background-color: {label.color};"></span>
									{label.name}
								</button>
							{/each}
						</div>
					{:else if showLabelPicker && availableLabels.length === 0}
						<p class="text-xs mt-2" style="color: var(--color-text-dim);">All labels applied</p>
					{/if}
				</div>

				<!-- Milestone -->
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.2s;">
					<h3 class="section-title mb-3">Milestone</h3>
					{#if canEdit && repoMilestones.length > 0}
						<select
							value={issue.milestone_id ?? ''}
							onchange={(e) => setMilestone(Number((e.target as HTMLSelectElement).value))}
							class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
							style="border-color: var(--glass-border); color: var(--color-text);"
						>
							<option value="0">None</option>
							{#each repoMilestones as m}
								<option value={m.id}>{m.title}</option>
							{/each}
						</select>
					{:else if currentMilestone}
						<div class="flex flex-col gap-1.5">
							<p class="text-sm font-medium" style="color: var(--color-text);">{currentMilestone.title}</p>
							{#if currentMilestone.open_issues + currentMilestone.closed_issues > 0}
								{@const total = currentMilestone.open_issues + currentMilestone.closed_issues}
								{@const progress = Math.round((currentMilestone.closed_issues / total) * 100)}
								<div class="flex items-center gap-2">
									<div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--glass-border);">
										<div
											class="h-full rounded-full transition-all duration-500"
											style="width: {progress}%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent));"
										></div>
									</div>
									<span class="text-[0.6rem] shrink-0" style="color: var(--color-text-dim);">{progress}%</span>
								</div>
							{/if}
						</div>
					{:else}
						<p class="text-xs" style="color: var(--color-text-dim);">No milestone</p>
					{/if}
				</div>

				<!-- Assignee -->
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.3s;">
					<div class="flex items-center justify-between mb-3">
						<h3 class="section-title">Assignee</h3>
						{#if canEdit}
							<button
								class="text-xs animated-link"
								style="color: var(--color-primary);"
								onclick={() => { editingAssignee = !editingAssignee; }}
							>{editingAssignee ? 'Done' : 'Edit'}</button>
						{/if}
					</div>
					{#if issue.assignee}
						<div class="flex items-center justify-between">
							<a
								href="/{issue.assignee}"
								class="flex items-center gap-2 text-sm font-medium animated-link"
								style="color: var(--color-primary);"
							>
								<div
									class="w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold shrink-0"
									style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white;"
								>{issue.assignee.charAt(0).toUpperCase()}</div>
								<span class="truncate">{issue.assignee}</span>
							</a>
							{#if canEdit}
								<button
									class="text-sm opacity-40 hover:opacity-80 transition-opacity"
									style="color: var(--color-text-dim);"
									onclick={clearAssignee}
									title="Clear assignee"
								>&times;</button>
							{/if}
						</div>
					{:else if !editingAssignee}
						<p class="text-xs" style="color: var(--color-text-dim);">No assignee</p>
					{/if}
					{#if editingAssignee}
						<div class="mt-2 flex flex-col gap-1 animate-fade-up-sm">
							{#if collaboratorsList.length > 0}
								{#each collaboratorsList as collab}
									<button
										class="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg w-full text-left transition-all duration-200"
										style="color: var(--color-text); {issue.assignee === collab.username ? 'background: var(--color-primary-subtle);' : ''}"
										onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-subtle)'; }}
										onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background = issue?.assignee === collab.username ? 'var(--color-primary-subtle)' : 'transparent'; }}
										onclick={() => setAssignee(collab.id)}
									>
										<div
											class="w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-bold shrink-0"
											style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white;"
										>{collab.username.charAt(0).toUpperCase()}</div>
										<span class="truncate flex-1">{collab.username}</span>
										{#if issue.assignee === collab.username}
											<svg class="w-3 h-3 ml-auto shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
										{/if}
									</button>
								{/each}
							{:else}
								<p class="text-xs py-2" style="color: var(--color-text-dim);">No collaborators to assign.</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Type & Priority -->
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.4s;">
					<h3 class="section-title mb-3">Properties</h3>
					<div class="flex flex-col gap-3">
						{#if canEdit}
							<div>
								<label class="block text-[0.6875rem] mb-1" style="color: var(--color-text-dim);">Type</label>
								<select
									value={issue.type || 'task'}
									onchange={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										issuesApi.update(owner, repoName, issueNumber, { type: val }).then(() => {
											issue = { ...issue!, type: val as any };
											toastStore.success('Type updated');
										}).catch(() => toastStore.error('Failed to update type'));
									}}
									class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
									style="border-color: var(--glass-border); color: var(--color-text);"
								>
									<option value="task">Task</option>
									<option value="bug">Bug</option>
									<option value="feature">Feature</option>
									<option value="story">Story</option>
									<option value="epic">Epic</option>
								</select>
							</div>
							<div>
								<label class="block text-[0.6875rem] mb-1" style="color: var(--color-text-dim);">Priority</label>
								<select
									value={issue.priority || 'medium'}
									onchange={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										issuesApi.update(owner, repoName, issueNumber, { priority: val }).then(() => {
											issue = { ...issue!, priority: val as any };
											toastStore.success('Priority updated');
										}).catch(() => toastStore.error('Failed to update priority'));
									}}
									class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
									style="border-color: var(--glass-border); color: var(--color-text);"
								>
									<option value="critical">Critical</option>
									<option value="high">High</option>
									<option value="medium">Medium</option>
									<option value="low">Low</option>
									<option value="none">None</option>
								</select>
							</div>
						{:else}
							<div class="flex items-center justify-between text-xs">
								<span style="color: var(--color-text-dim);">Type</span>
								<span class="capitalize" style="color: var(--color-text);">{issue.type || 'task'}</span>
							</div>
							<div class="flex items-center justify-between text-xs">
								<span style="color: var(--color-text-dim);">Priority</span>
								<span class="capitalize" style="color: var(--color-text);">{issue.priority || 'medium'}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Metadata + editable due date & story points -->
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.5s;">
					<h3 class="section-title mb-3">Details</h3>
					<dl class="flex flex-col gap-2.5 text-xs">
						<div class="flex items-center justify-between">
							<dt style="color: var(--color-text-dim);">Created</dt>
							<dd style="color: var(--color-text);"><RelativeTime date={issue.created_at} /></dd>
						</div>
						<div class="flex items-center justify-between">
							<dt style="color: var(--color-text-dim);">Updated</dt>
							<dd style="color: var(--color-text);"><RelativeTime date={issue.updated_at} /></dd>
						</div>
						<div class="flex items-center justify-between">
							<dt style="color: var(--color-text-dim);">Author</dt>
							<dd>
								<a href="/{issue.author}" class="animated-link font-medium" style="color: var(--color-primary);">{issue.author}</a>
							</dd>
						</div>

						<!-- Story points -->
						<div class="flex items-center justify-between gap-2">
							<dt style="color: var(--color-text-dim);">Story Points</dt>
							{#if canEdit}
								<dd class="flex-shrink-0">
									<input
										type="number"
										min="0"
										max="999"
										value={issue.story_points || 0}
										onchange={(e) => {
											const val = Math.max(0, Number((e.target as HTMLInputElement).value));
											setStoryPoints(val);
										}}
										class="w-16 px-2 py-0.5 text-xs rounded-lg border bg-transparent text-right transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
										style="border-color: var(--glass-border); color: var(--color-text);"
									/>
								</dd>
							{:else if issue.story_points > 0}
								<dd style="color: var(--color-text);">{issue.story_points}</dd>
							{:else}
								<dd style="color: var(--color-text-dim);">—</dd>
							{/if}
						</div>

						<!-- Due date -->
						<div class="flex items-center justify-between gap-2">
							<dt style="color: var(--color-text-dim);">Due Date</dt>
							{#if canEdit}
								<dd class="flex-shrink-0">
									<input
										type="date"
										value={toDateInputValue(issue.due_date)}
										onchange={(e) => {
											const val = (e.target as HTMLInputElement).value;
											setDueDate(val);
										}}
										class="w-32 px-2 py-0.5 text-xs rounded-lg border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
										style="border-color: var(--glass-border); color: var(--color-text);"
									/>
								</dd>
							{:else if issue.due_date}
								<dd style="color: {issue.state === 'open' && new Date(issue.due_date) < new Date() ? 'var(--color-error)' : 'var(--color-text)'};">
									{new Date(issue.due_date).toLocaleDateString()}
								</dd>
							{:else}
								<dd style="color: var(--color-text-dim);">—</dd>
							{/if}
						</div>
					</dl>
				</div>
			</div>
		</div>
	</div>
{/if}
