<script lang="ts">
	import type { OrgMember } from '$lib/types/organization';
	import Avatar from './Avatar.svelte';
	import Badge from './Badge.svelte';

	let { members, onRemove }: {
		members: OrgMember[];
		onRemove?: (username: string) => void;
	} = $props();
</script>

{#if members.length === 0}
	<div class="card p-12 text-center">
		<div class="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-secondary) 8%, transparent);">
			<svg class="w-6 h-6 opacity-40" style="color: var(--color-secondary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
		</div>
		<p class="text-sm" style="color: var(--color-text-dim);">No members yet</p>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#each members as member, i}
			<div
				class="flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] group"
				style="border-color: var(--color-border); animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 40}ms;"
			>
				<div class="flex items-center gap-3">
					<Avatar username={member.username} size={36} />
					<div>
						<a href="/{member.username}" class="text-sm font-medium animated-link" style="color: var(--color-text);">{member.username}</a>
						{#if member.full_name}
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">{member.full_name}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Badge label={member.role} variant={member.role === 'owner' ? 'warning' : 'default'} />
					{#if onRemove && member.role !== 'owner'}
						<button
							onclick={() => onRemove?.(member.username)}
							class="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
							style="color: var(--color-error);"
						>Remove</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
