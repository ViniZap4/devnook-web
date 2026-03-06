<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issues as issuesApi, labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Issue, Label, Milestone } from '$lib/types/issue';
	import type { IssueComment as IssueCommentType } from '$lib/types/issue';
	import IssueComment from '$lib/components/IssueComment.svelte';
	import CommentForm from '$lib/components/CommentForm.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const number = $derived(Number($page.params.number!));
	const isOwner = $derived(userStore.user?.username === owner);

	let issue = $state<Issue | null>(null);
	let comments = $state<IssueCommentType[]>([]);
	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);
	let loading = $state(true);
	let showLabelPicker = $state(false);

	let editingTitle = $state(false);
	let editTitle = $state('');
	let editingBody = $state(false);
	let editBody = $state('');

	let editingAssignee = $state(false);
	let assigneeInput = $state('');
	let editPreview = $state(false);

	onMount(async () => {
		try {
			const [issueData, commentsData, labelsData, milestonesData] = await Promise.all([
				issuesApi.get(owner, repoName, number),
				issuesApi.comments(owner, repoName, number),
				labelsApi.list(owner, repoName),
				milestonesApi.list(owner, repoName)
			]);
			issue = issueData;
			comments = commentsData;
			repoLabels = labelsData;
			repoMilestones = milestonesData;
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function toggleState() {
		if (!issue) return;
		const newState = issue.state === 'open' ? 'closed' : 'open';
		try {
			await issuesApi.update(owner, repoName, number, { state: newState });
			issue = { ...issue, state: newState };
			toastStore.success(`Issue ${newState === 'closed' ? 'closed' : 'reopened'} successfully`);
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update issue state');
		}
	}

	async function addComment(body: string) {
		try {
			await issuesApi.addComment(owner, repoName, number, { body });
			comments = await issuesApi.comments(owner, repoName, number);
			toastStore.success('Comment added');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add comment');
		}
	}

	async function editComment(id: number, body: string) {
		try {
			await issuesApi.updateComment(owner, repoName, number, id, { body });
			comments = await issuesApi.comments(owner, repoName, number);
			toastStore.success('Comment updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update comment');
		}
	}

	async function deleteComment(id: number) {
		try {
			await issuesApi.removeComment(owner, repoName, number, id);
			comments = comments.filter(c => c.id !== id);
			toastStore.success('Comment deleted');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to delete comment');
		}
	}

	async function addLabel(labelId: number) {
		try {
			await labelsApi.addToIssue(owner, repoName, number, labelId);
			issue = await issuesApi.get(owner, repoName, number);
			toastStore.success('Label added');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to add label');
		}
	}

	async function removeLabel(labelId: number) {
		try {
			await labelsApi.removeFromIssue(owner, repoName, number, labelId);
			issue = await issuesApi.get(owner, repoName, number);
			toastStore.success('Label removed');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to remove label');
		}
	}

	async function saveTitle() {
		if (!editTitle.trim() || !issue) return;
		try {
			await issuesApi.update(owner, repoName, number, { title: editTitle.trim() });
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
			await issuesApi.update(owner, repoName, number, { body: editBody });
			issue = { ...issue, body: editBody };
			editingBody = false;
			toastStore.success('Description updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update description');
		}
	}

	async function setAssignee() {
		if (!issue) return;
		if (!assigneeInput.trim()) {
			try {
				await issuesApi.update(owner, repoName, number, { assignee_id: 0 });
				issue = await issuesApi.get(owner, repoName, number);
				toastStore.success('Assignee updated');
			} catch (err) {
				toastStore.error(err instanceof Error ? err.message : 'Failed to update assignee');
			}
		}
		editingAssignee = false;
	}

	async function clearAssignee() {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, number, { assignee_id: 0 });
			issue = await issuesApi.get(owner, repoName, number);
			toastStore.success('Assignee cleared');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to clear assignee');
		}
	}

	async function setMilestone(milestoneId: number) {
		if (!issue) return;
		try {
			await issuesApi.update(owner, repoName, number, { milestone_id: milestoneId });
			issue = await issuesApi.get(owner, repoName, number);
			toastStore.success('Milestone updated');
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to update milestone');
		}
	}

	const issueLabels = $derived(issue?.labels ?? []);
	const issueLabelIds = $derived(new Set(issueLabels.map(l => l.id)));
	const availableLabels = $derived(repoLabels.filter(l => !issueLabelIds.has(l.id)));
	const currentMilestone = $derived(
		issue?.milestone_id ? repoMilestones.find(m => m.id === issue!.milestone_id) : null
	);
</script>

{#if loading}
	<div class="py-16 text-center card-animate">
		<div class="inline-flex flex-col items-center gap-3">
			<div class="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style="border-color: var(--color-primary); border-top-color: transparent;"></div>
			<span class="text-sm" style="color: var(--color-text-dim);">Loading issue...</span>
		</div>
	</div>
{:else if issue}
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 content-reveal">
		<!-- Main content -->
		<div class="flex flex-col gap-6">
			<!-- Header -->
			<div class="flex flex-col gap-3 page-header">
				{#if editingTitle}
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={editTitle}
							class="flex-1 text-xl font-bold px-3 py-2 rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
							style="border-color: var(--color-border); color: var(--color-text);"
						/>
						<button class="btn-glow px-4 py-2 text-sm rounded-xl text-white font-medium" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));" onclick={saveTitle}>Save</button>
						<button class="px-4 py-2 text-sm rounded-xl glass-subtle" style="color: var(--color-text-dim);" onclick={() => { editingTitle = false; }}>Cancel</button>
					</div>
				{:else}
					<div class="flex items-center gap-2">
						<h2 class="text-xl font-bold" style="color: var(--color-text);">
							{issue.title}
							<span class="font-normal" style="color: var(--color-text-dim);">#{issue.number}</span>
						</h2>
						{#if isOwner}
							<button class="text-xs animated-link shrink-0" style="color: var(--color-primary);" onclick={() => { editTitle = issue!.title; editingTitle = true; }}>Edit</button>
						{/if}
					</div>
				{/if}
				<div class="flex items-center gap-3 text-sm">
					<span
						class="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300"
						style="
							background: {issue.state === 'open'
								? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
								: 'color-mix(in srgb, var(--color-text-dim) 15%, transparent)'};
							color: {issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};
							border: 1px solid {issue.state === 'open'
								? 'color-mix(in srgb, var(--color-success) 25%, transparent)'
								: 'color-mix(in srgb, var(--color-text-dim) 20%, transparent)'};
						"
					>
						<span class="inline-block w-1.5 h-1.5 rounded-full mr-1.5 {issue.state === 'open' ? 'live-dot' : ''}" style="background: {issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};"></span>
						{issue.state}
					</span>
					<span style="color: var(--color-text-dim);">
						<span class="font-medium" style="color: var(--color-text);">{issue.author}</span> opened <RelativeTime date={issue.created_at} />
					</span>
				</div>
			</div>

			<!-- Body -->
			{#if editingBody}
				<div class="card p-5 flex flex-col gap-3 animate-fade-up-sm">
					<div class="flex items-center justify-between mb-1">
						<span class="section-title">Edit description</span>
						<div class="flex items-center gap-1 glass-subtle rounded-lg p-0.5">
							<button
								type="button"
								class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
								style="
									color: {!editPreview ? 'var(--color-primary)' : 'var(--color-text-dim)'};
									background: {!editPreview ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
									font-weight: {!editPreview ? '600' : '400'};
								"
								onclick={() => { editPreview = false; }}
							>Write</button>
							<button
								type="button"
								class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
								style="
									color: {editPreview ? 'var(--color-primary)' : 'var(--color-text-dim)'};
									background: {editPreview ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
									font-weight: {editPreview ? '600' : '400'};
								"
								onclick={() => { editPreview = true; }}
							>Preview</button>
						</div>
					</div>
					{#if editPreview}
						<div class="min-h-[200px] px-4 py-3 rounded-xl animate-fade-up-sm" style="border: 1px solid var(--color-border);">
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
							class="w-full px-4 py-3 text-sm rounded-xl border resize-y bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)]"
							style="border-color: var(--color-border); color: var(--color-text);"
						></textarea>
					{/if}
					<div class="flex items-center gap-2">
						<button onclick={saveBody} class="btn-glow px-4 py-2 text-xs font-semibold rounded-xl text-white" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));">Save</button>
						<button onclick={() => { editingBody = false; editPreview = false; }} class="px-4 py-2 text-xs rounded-xl glass-subtle" style="color: var(--color-text-dim);">Cancel</button>
					</div>
				</div>
			{:else if issue.body}
				<div class="card p-5 relative group card-animate stagger-1">
					<MarkdownRenderer content={issue.body} />
					{#if isOwner}
						<button
							class="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 glass-subtle"
							style="color: var(--color-primary);"
							onclick={() => { editBody = issue!.body; editingBody = true; }}
						>Edit</button>
					{/if}
				</div>
			{:else if isOwner}
				<button
					class="text-xs animated-link"
					style="color: var(--color-text-dim);"
					onclick={() => { editBody = ''; editingBody = true; }}
				>Add a description</button>
			{/if}

			<!-- Actions -->
			<div class="flex items-center gap-2 card-animate stagger-2">
				<button
					onclick={toggleState}
					class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 press-scale"
					style="
						border: 1px solid {issue.state === 'open'
							? 'color-mix(in srgb, var(--color-error) 30%, transparent)'
							: 'color-mix(in srgb, var(--color-success) 30%, transparent)'};
						color: {issue.state === 'open' ? 'var(--color-error)' : 'var(--color-success)'};
						background: {issue.state === 'open'
							? 'color-mix(in srgb, var(--color-error) 5%, transparent)'
							: 'color-mix(in srgb, var(--color-success) 5%, transparent)'};
					"
				>
					{issue.state === 'open' ? 'Close issue' : 'Reopen issue'}
				</button>
			</div>

			<!-- Comments -->
			{#if comments.length > 0}
				<div class="flex flex-col gap-4 card-animate stagger-3">
					<h3 class="section-title">Comments ({comments.length})</h3>
					{#each comments as comment, i}
						<div class="row-animate" style="animation-delay: {0.1 + i * 0.05}s;">
							<IssueComment {comment} currentUser={userStore.user?.username ?? ''} onEdit={editComment} onDelete={deleteComment} />
						</div>
					{/each}
				</div>
			{/if}

			<div class="card-animate stagger-4">
				<CommentForm onSubmit={addComment} />
			</div>
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<!-- Labels -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.15s;">
				<div class="flex items-center justify-between mb-3">
					<h3 class="section-title">Labels</h3>
					{#if isOwner}
						<button
							class="text-xs animated-link"
							style="color: var(--color-primary);"
							onclick={() => { showLabelPicker = !showLabelPicker; }}
						>
							{showLabelPicker ? 'Done' : 'Edit'}
						</button>
					{/if}
				</div>
				{#if issueLabels.length === 0 && !showLabelPicker}
					<p class="text-xs" style="color: var(--color-text-dim);">No labels</p>
				{/if}
				<div class="flex flex-wrap gap-1.5">
					{#each issueLabels as label}
						<span class="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium transition-all duration-200 hover:scale-105"
							style="background-color: {label.color}18; color: {label.color}; border: 1px solid {label.color}30;"
						>
							{label.name}
							{#if isOwner}
								<button onclick={() => removeLabel(label.id)} class="hover:opacity-70 transition-opacity">&times;</button>
							{/if}
						</span>
					{/each}
				</div>
				{#if showLabelPicker && availableLabels.length > 0}
					<div class="mt-3 flex flex-col gap-1 animate-fade-up-sm">
						{#each availableLabels as label}
							<button
								class="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg w-full text-left hover-slide transition-all duration-200"
								style="color: var(--color-text);"
								onmouseenter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 6%, transparent)'; }}
								onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
								onclick={() => addLabel(label.id)}
							>
								<span class="w-3 h-3 rounded-full shrink-0 transition-transform duration-200 hover:scale-125" style="background-color: {label.color};"></span>
								{label.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Milestone -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.25s;">
				<h3 class="section-title mb-3">Milestone</h3>
				{#if isOwner && repoMilestones.length > 0}
					<select
						value={issue.milestone_id ?? ''}
						onchange={(e) => setMilestone(Number((e.target as HTMLSelectElement).value))}
						class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<option value="0">None</option>
						{#each repoMilestones as m}
							<option value={m.id}>{m.title}</option>
						{/each}
					</select>
				{:else if currentMilestone}
					<p class="text-sm font-medium" style="color: var(--color-text);">{currentMilestone.title}</p>
				{:else}
					<p class="text-xs" style="color: var(--color-text-dim);">No milestone</p>
				{/if}
			</div>

			<!-- Assignee -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.35s;">
				<div class="flex items-center justify-between mb-3">
					<h3 class="section-title">Assignee</h3>
					{#if isOwner && issue.assignee}
						<button class="text-xs animated-link" style="color: var(--color-text-dim);" onclick={clearAssignee}>Clear</button>
					{/if}
				</div>
				{#if issue.assignee}
					<a href="/{issue.assignee}" class="text-sm font-medium animated-link" style="color: var(--color-primary);">
						{issue.assignee}
					</a>
				{:else}
					<p class="text-xs" style="color: var(--color-text-dim);">No assignee</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="py-16 text-center card-animate">
		<div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-error) 8%, transparent);">
			<svg class="w-8 h-8 opacity-40" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
		</div>
		<p class="text-lg font-medium" style="color: var(--color-text);">Issue not found</p>
	</div>
{/if}
