<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { issues } from '$lib/services/api';
	import IssueForm from '$lib/components/IssueForm.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	async function handleSubmit(title: string, body: string) {
		const result = await issues.create(owner, repoName, { title, body });
		goto(`/${owner}/${repoName}/issues/${result.number}`);
	}
</script>

<div class="flex flex-col gap-4">
	<h2 class="text-[var(--color-text)] font-semibold">New issue</h2>
	<IssueForm onSubmit={handleSubmit} />
</div>
