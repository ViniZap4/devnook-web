<script lang="ts">
	import type { OrgMember } from '$lib/types/organization';
	import OrgMemberRow from './OrgMemberRow.svelte';

	let { members, onRemove }: {
		members: OrgMember[];
		onRemove?: (username: string) => void;
	} = $props();
</script>

<div class="rounded-lg border border-[var(--color-border)] overflow-hidden divide-y divide-white/[0.04]">
	{#each members as member}
		<OrgMemberRow {member} {onRemove} />
	{:else}
		<div class="p-6 text-center text-[var(--color-text)] opacity-40">No members.</div>
	{/each}
</div>
