<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { issues, labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import type { Label, Milestone } from '$lib/types/issue';
	import { onMount } from 'svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let title = $state('');
	let body = $state('');
	let submitting = $state(false);

	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);
	let selectedLabels = $state<number[]>([]);
	let selectedMilestone = $state<number | undefined>(undefined);
	let assignee = $state('');

	onMount(async () => {
		try {
			const [l, m] = await Promise.all([
				labelsApi.list(owner, repoName),
				milestonesApi.list(owner, repoName)
			]);
			repoLabels = l;
			repoMilestones = m.filter(ms => ms.state === 'open');
		} catch {
			// ignore
		}
	});

	function toggleLabel(id: number) {
		if (selectedLabels.includes(id)) {
			selectedLabels = selectedLabels.filter(l => l !== id);
		} else {
			selectedLabels = [...selectedLabels, id];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		submitting = true;
		try {
			const result = await issues.create(owner, repoName, {
				title: title.trim(),
				body,
				label_ids: selectedLabels.length > 0 ? selectedLabels : undefined,
				milestone_id: selectedMilestone || undefined,
				assignee_id: undefined
			});
			goto(`/${owner}/${repoName}/issues/${result.number}`);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<h2 class="text-[var(--color-text)] font-semibold">New issue</h2>

	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
		<!-- Main form -->
		<div class="flex flex-col gap-4">
			<div>
				<label for="issue-title" class="block text-sm font-medium text-[var(--color-text)] mb-2">Title</label>
				<input
					id="issue-title"
					type="text"
					bind:value={title}
					placeholder="Issue title"
					class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
					required
				/>
			</div>

			<div>
				<label for="issue-body" class="block text-sm font-medium text-[var(--color-text)] mb-2">
					Description <span class="opacity-40">(Markdown supported)</span>
				</label>
				<textarea
					id="issue-body"
					bind:value={body}
					placeholder="Describe the issue..."
					rows="8"
					class="w-full px-4 py-3 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 resize-y focus:border-[var(--color-primary)]"
				></textarea>
			</div>

			<div>
				<button
					type="submit"
					disabled={submitting || !title.trim()}
					class="px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
					style="background-color: var(--color-primary);"
				>
					{submitting ? 'Submitting...' : 'Submit new issue'}
				</button>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<!-- Labels -->
			{#if repoLabels.length > 0}
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Labels</h3>
					<div class="flex flex-col gap-1">
						{#each repoLabels as label}
							<button
								type="button"
								class="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg w-full text-left transition-colors"
								style="color: var(--color-text); background-color: {selectedLabels.includes(label.id) ? 'var(--color-surface-hover)' : 'transparent'};"
								onclick={() => toggleLabel(label.id)}
							>
								<span class="w-3 h-3 rounded-full shrink-0" style="background-color: {label.color};"></span>
								<span class="flex-1">{label.name}</span>
								{#if selectedLabels.includes(label.id)}
									<svg class="w-3.5 h-3.5 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Milestone -->
			{#if repoMilestones.length > 0}
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Milestone</h3>
					<select
						bind:value={selectedMilestone}
						class="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<option value={undefined}>None</option>
						{#each repoMilestones as m}
							<option value={m.id}>{m.title}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Assignee -->
			<div>
				<h3 class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--color-text-dim);">Assignee</h3>
				<input
					type="text"
					bind:value={assignee}
					placeholder="Username"
					class="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-transparent"
					style="border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
		</div>
	</form>
</div>
