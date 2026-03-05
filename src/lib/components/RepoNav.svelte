<script lang="ts">
	import { page } from '$app/stores';

	let { owner, repo }: { owner: string; repo: string } = $props();

	const tabs = $derived([
		{ label: 'Code', href: `/${owner}/${repo}`, icon: 'code', match: (p: string) => p === `/${owner}/${repo}` || p.startsWith(`/${owner}/${repo}/tree`) || p.startsWith(`/${owner}/${repo}/blob`) || p.startsWith(`/${owner}/${repo}/blame`) },
		{ label: 'Issues', href: `/${owner}/${repo}/issues`, icon: 'issue', match: (p: string) => p.startsWith(`/${owner}/${repo}/issues`) },
		{ label: 'Pull Requests', href: `/${owner}/${repo}/pulls`, icon: 'pr', match: (p: string) => p.startsWith(`/${owner}/${repo}/pulls`) },
		{ label: 'Commits', href: `/${owner}/${repo}/commits`, icon: 'commit', match: (p: string) => p.startsWith(`/${owner}/${repo}/commits`) },
		{ label: 'Branches', href: `/${owner}/${repo}/branches`, icon: 'branch', match: (p: string) => p.startsWith(`/${owner}/${repo}/branches`) || p.startsWith(`/${owner}/${repo}/tags`) },
		{ label: 'Releases', href: `/${owner}/${repo}/releases`, icon: 'release', match: (p: string) => p.startsWith(`/${owner}/${repo}/releases`) },
	]);
</script>

<nav class="flex items-center gap-0.5 border-b overflow-x-auto" style="border-color: var(--color-border);">
	{#each tabs as tab}
		{@const active = tab.match($page.url.pathname)}
		<a
			href={tab.href}
			class="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap"
			style="
				color: {active ? 'var(--color-primary)' : 'var(--color-text-dim)'};
				border-color: {active ? 'var(--color-primary)' : 'transparent'};
				font-weight: {active ? '600' : '400'};
			"
			onmouseenter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
			onmouseleave={(e) => { if (!active) e.currentTarget.style.color = active ? 'var(--color-primary)' : 'var(--color-text-dim)'; }}
		>
			{#if tab.icon === 'code'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
			{:else if tab.icon === 'issue'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
			{:else if tab.icon === 'pr'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
			{:else if tab.icon === 'commit'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path stroke-linecap="round" d="M12 3v6m0 6v6" /></svg>
			{:else if tab.icon === 'branch'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
			{:else if tab.icon === 'release'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
			{/if}
			{tab.label}
		</a>
	{/each}
	<a
		href="/{owner}/{repo}/settings"
		class="flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 whitespace-nowrap ml-auto"
		style="
			color: {$page.url.pathname.startsWith(`/${owner}/${repo}/settings`) ? 'var(--color-primary)' : 'var(--color-text-dim)'};
			border-color: {$page.url.pathname.startsWith(`/${owner}/${repo}/settings`) ? 'var(--color-primary)' : 'transparent'};
			font-weight: {$page.url.pathname.startsWith(`/${owner}/${repo}/settings`) ? '600' : '400'};
		"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
		Settings
	</a>
</nav>
