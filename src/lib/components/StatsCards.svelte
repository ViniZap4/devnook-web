<script lang="ts">
	import { onMount } from 'svelte';
	import { users } from '$lib/services/api';
	import type { DashboardStats } from '$lib/services/api';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';

	let stats = $state<DashboardStats | null>(null);

	onMount(async () => {
		try {
			stats = await users.dashboardStats();
		} catch {
			// ignore
		}
	});
</script>

{#if stats}
<div class="grid grid-cols-3 gap-3">
	<div class="card p-4 flex items-center gap-3">
		<div class="w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center">
			<RepoIcon size={16} color="var(--color-text)" />
		</div>
		<div>
			<p class="text-lg font-bold text-[var(--color-text)]">{stats.total_repos}</p>
			<p class="text-xs text-[var(--color-text)] opacity-30">Repositories</p>
		</div>
	</div>
	<div class="card p-4 flex items-center gap-3">
		<div class="w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center">
			<OrgIcon size={16} color="var(--color-text)" />
		</div>
		<div>
			<p class="text-lg font-bold text-[var(--color-text)]">{stats.total_orgs}</p>
			<p class="text-xs text-[var(--color-text)] opacity-30">Organizations</p>
		</div>
	</div>
	<div class="card p-4 flex items-center gap-3">
		<div class="w-9 h-9 rounded-lg bg-[var(--color-surface)] flex items-center justify-center">
			<IssueIcon size={16} color="#3fb950" state="open" />
		</div>
		<div>
			<p class="text-lg font-bold text-[var(--color-text)]">{stats.open_issues}</p>
			<p class="text-xs text-[var(--color-text)] opacity-30">Open issues</p>
		</div>
	</div>
</div>
{/if}
