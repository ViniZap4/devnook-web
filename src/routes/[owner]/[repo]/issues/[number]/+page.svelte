<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { issues as issuesApi } from '$lib/services/api';
	import type { Issue } from '$lib/types/issue';
	import type { IssueComment as IssueCommentType } from '$lib/types/issue';
	import IssueDetail from '$lib/components/IssueDetail.svelte';
	import IssueComment from '$lib/components/IssueComment.svelte';
	import CommentForm from '$lib/components/CommentForm.svelte';

	const owner = $derived($page.params.owner);
	const repoName = $derived($page.params.repo);
	const number = $derived(Number($page.params.number));

	let issue = $state<Issue | null>(null);
	let comments = $state<IssueCommentType[]>([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			const [issueData, commentsData] = await Promise.all([
				issuesApi.get(owner, repoName, number),
				issuesApi.comments(owner, repoName, number)
			]);
			issue = issueData;
			comments = commentsData;
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
</script>

{#if loading}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Loading...</div>
{:else if issue}
	<div class="flex flex-col gap-6">
		<IssueDetail {issue} onToggleState={toggleState} />

		{#if comments.length > 0}
			<div class="flex flex-col gap-4">
				{#each comments as comment}
					<IssueComment {comment} />
				{/each}
			</div>
		{/if}

		<CommentForm onSubmit={addComment} />
	</div>
{:else}
	<div class="py-12 text-center text-[var(--color-text)] opacity-50">Issue not found.</div>
{/if}
