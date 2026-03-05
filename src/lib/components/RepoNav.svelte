<script lang="ts">
	import { page } from '$app/stores';
	import FileIcon from '$lib/assets/icons/FileIcon.svelte';
	import IssueIcon from '$lib/assets/icons/IssueIcon.svelte';
	import CommitIcon from '$lib/assets/icons/CommitIcon.svelte';
	import BranchIcon from '$lib/assets/icons/BranchIcon.svelte';

	let { owner, repo }: { owner: string; repo: string } = $props();

	const tabs = $derived([
		{ label: 'Code', href: `/${owner}/${repo}`, icon: FileIcon, match: (p: string) => p === `/${owner}/${repo}` || p.startsWith(`/${owner}/${repo}/tree`) || p.startsWith(`/${owner}/${repo}/blob`) },
		{ label: 'Issues', href: `/${owner}/${repo}/issues`, icon: IssueIcon, match: (p: string) => p.startsWith(`/${owner}/${repo}/issues`) },
		{ label: 'Commits', href: `/${owner}/${repo}/commits`, icon: CommitIcon, match: (p: string) => p.startsWith(`/${owner}/${repo}/commits`) },
		{ label: 'Branches', href: `/${owner}/${repo}/branches`, icon: BranchIcon, match: (p: string) => p.startsWith(`/${owner}/${repo}/branches`) },
	]);
</script>

<nav class="flex items-center gap-1 border-b border-[var(--color-border)] overflow-x-auto">
	{#each tabs as tab}
		{@const active = tab.match($page.url.pathname)}
		<a
			href={tab.href}
			class="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap {active ? 'border-current font-medium' : 'border-transparent opacity-60 hover:opacity-100'}"
			style={active ? 'color: var(--color-primary);' : 'color: var(--color-text);'}
		>
			<tab.icon size={14} />
			{tab.label}
		</a>
	{/each}
	<a
		href="/{owner}/{repo}/settings"
		class="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap ml-auto {$page.url.pathname === `/${owner}/${repo}/settings` ? 'border-current font-medium' : 'border-transparent opacity-60 hover:opacity-100'}"
		style={$page.url.pathname === `/${owner}/${repo}/settings` ? 'color: var(--color-primary);' : 'color: var(--color-text);'}
	>
		Settings
	</a>
</nav>
