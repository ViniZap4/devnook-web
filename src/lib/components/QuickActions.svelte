<script lang="ts">
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import OrgIcon from '$lib/assets/icons/OrgIcon.svelte';
</script>

<div class="flex items-center gap-3">
	<a
		href="/new"
		class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-white/10 text-[var(--color-text)] hover:bg-white/5 transition-colors"
	>
		<RepoIcon size={14} />
		New Repository
	</a>
	<a
		href="/orgs/new"
		class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-white/10 text-[var(--color-text)] hover:bg-white/5 transition-colors"
	>
		<OrgIcon size={14} />
		New Organization
	</a>
</div>
