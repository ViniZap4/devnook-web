<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issues as issuesApi, labels as labelsApi } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Issue, Label } from '$lib/types/issue';
	import type { IssueComment as IssueCommentType } from '$lib/types/issue';
	import IssueComment from '$lib/components/IssueComment.svelte';
	import CommentForm from '$lib/components/CommentForm.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const number = $derived(Number($page.params.number!));
	const isOwner = $derived(userStore.user?.username === owner);

	let issue = $state<Issue | null>(null);
	let comments = $state<IssueCommentType[]>([]);
	let repoLabels = $state<Label[]>([]);
	let loading = $state(true);
	let showLabelPicker = $state(false);

	onMount(async () => {
		try {
			const [issueData, commentsData, labelsData] = await Promise.all([
				issuesApi.get(owner, repoName, number),
				issuesApi.comments(owner, repoName, number),
				labelsApi.list(owner, repoName)
			]);
			issue = issueData;
			comments = commentsData;
			repoLabels = labelsData;
		} catch {
			// handled below
		} finally {
			loading = false;
		}
	});

	async function toggleState() {
		if (!issue) return;
		const newState = issue.state === 'open' ? 'closed' : 'open';
		await issuesApi.update(owner, repoName, number, { state: newState });
		issue = { ...issue, state: newState };
	}

	async function addComment(body: string) {
		await issuesApi.addComment(owner, repoName, number, { body });
		comments = await issuesApi.comments(owner, repoName, number);
	}

	async function addLabel(labelId: number) {
		try {
			await labelsApi.addToIssue(owner, repoName, number, labelId);
			issue = await issuesApi.get(owner, repoName, number);
		} catch {
			// ignore
		}
	}

	async function removeLabel(labelId: number) {
		try {
			await labelsApi.removeFromIssue(owner, repoName, number, labelId);
			issue = await issuesApi.get(owner, repoName, number);
		} catch {
			// ignore
		}
	}

	const issueLabels = $derived(issue?.labels ?? []);
	const issueLabelIds = $derived(new Set(issueLabels.map(l => l.id)));
	const availableLabels = $derived(repoLabels.filter(l => !issueLabelIds.has(l.id)));
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if issue}
	<div class="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
		<!-- Main content -->
		<div class="flex flex-col gap-6">
			<!-- Header -->
			<div class="flex flex-col gap-3">
				<h2 class="text-xl font-bold" style="color: var(--color-text);">
					{issue.title}
					<span class="font-normal" style="color: var(--color-text-dim);">#{issue.number}</span>
				</h2>
				<div class="flex items-center gap-2 text-sm">
					<span class="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
						style="background-color: {issue.state === 'open' ? 'var(--color-success)' : 'var(--color-text-dim)'};"
					>{issue.state}</span>
					<span style="color: var(--color-text-dim);">
						{issue.author} opened <RelativeTime date={issue.created_at} />
					</span>
				</div>
			</div>

			<!-- Body -->
			{#if issue.body}
				<div class="card p-4">
					<MarkdownRenderer content={issue.body} />
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex items-center gap-2">
				<button
					onclick={toggleState}
					class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
					style="border-color: {issue.state === 'open' ? 'var(--color-error)' : 'var(--color-success)'}30; color: {issue.state === 'open' ? 'var(--color-error)' : 'var(--color-success)'};"
				>
					{issue.state === 'open' ? 'Close issue' : 'Reopen issue'}
				</button>
			</div>

			<!-- Comments -->
			{#if comments.length > 0}
				<div class="flex flex-col gap-4">
					<h3 class="text-sm font-semibold" style="color: var(--color-text-dim);">Comments ({comments.length})</h3>
					{#each comments as comment}
						<IssueComment {comment} />
					{/each}
				</div>
			{/if}

			<CommentForm onSubmit={addComment} />
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<!-- Labels -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Labels</h3>
					{#if isOwner}
						<button
							class="text-xs hover:underline"
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
						<span class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
							style="background-color: {label.color}20; color: {label.color}; border: 1px solid {label.color}30;"
						>
							{label.name}
							{#if isOwner}
								<button onclick={() => removeLabel(label.id)} class="hover:opacity-70">&times;</button>
							{/if}
						</span>
					{/each}
				</div>
				{#if showLabelPicker && availableLabels.length > 0}
					<div class="mt-2 flex flex-col gap-1">
						{#each availableLabels as label}
							<button
								class="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg w-full text-left hover:bg-[var(--color-surface)] transition-colors"
								style="color: var(--color-text);"
								onclick={() => addLabel(label.id)}
							>
								<span class="w-3 h-3 rounded-full shrink-0" style="background-color: {label.color};"></span>
								{label.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Assignee -->
			{#if issue.assignee}
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Assignee</h3>
					<a href="/{issue.assignee}" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">
						{issue.assignee}
					</a>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Issue not found.</div>
{/if}
