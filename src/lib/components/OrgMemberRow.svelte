<script lang="ts">
	import type { OrgMember } from '$lib/types/organization';
	import Badge from './Badge.svelte';

	let { member, onRemove }: {
		member: OrgMember;
		onRemove?: (username: string) => void;
	} = $props();
</script>

<div class="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
	<div class="flex items-center gap-3">
		<div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[var(--color-text)] font-medium">
			{member.username.substring(0, 2).toUpperCase()}
		</div>
		<span class="text-sm text-[var(--color-text)] font-medium">{member.username}</span>
		<Badge label={member.role} variant={member.role === 'owner' ? 'warning' : 'default'} />
	</div>
	{#if onRemove && member.role !== 'owner'}
		<button
			onclick={() => onRemove?.(member.username)}
			class="text-xs text-red-400 opacity-50 hover:opacity-100 transition-opacity"
		>
			Remove
		</button>
	{/if}
</div>
