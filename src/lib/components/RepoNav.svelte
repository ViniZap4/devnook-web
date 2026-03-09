<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let { owner, repo }: { owner: string; repo: string } = $props();

	let navContainer = $state<HTMLElement>();
	let indicatorStyle = $state('opacity: 0;');
	let mounted = $state(false);

	const tabs = $derived([
		{ label: 'Code', href: `/${owner}/${repo}`, icon: 'code', match: (p: string) => p === `/${owner}/${repo}` || p.startsWith(`/${owner}/${repo}/tree`) || p.startsWith(`/${owner}/${repo}/blob`) || p.startsWith(`/${owner}/${repo}/blame`) },
		{ label: 'Issues', href: `/${owner}/${repo}/issues`, icon: 'issue', match: (p: string) => p.startsWith(`/${owner}/${repo}/issues`) || p.startsWith(`/${owner}/${repo}/labels`) || p.startsWith(`/${owner}/${repo}/milestones`) || p.startsWith(`/${owner}/${repo}/board`) },
		{ label: 'Pull Requests', href: `/${owner}/${repo}/pulls`, icon: 'pr', match: (p: string) => p.startsWith(`/${owner}/${repo}/pulls`) },
		{ label: 'Wiki', href: `/${owner}/${repo}/wiki`, icon: 'wiki', match: (p: string) => p.startsWith(`/${owner}/${repo}/wiki`) },
		{ label: 'Commits', href: `/${owner}/${repo}/commits`, icon: 'commit', match: (p: string) => p.startsWith(`/${owner}/${repo}/commits`) },
		{ label: 'Branches', href: `/${owner}/${repo}/branches`, icon: 'branch', match: (p: string) => p.startsWith(`/${owner}/${repo}/branches`) || p.startsWith(`/${owner}/${repo}/tags`) },
		{ label: 'Releases', href: `/${owner}/${repo}/releases`, icon: 'release', match: (p: string) => p.startsWith(`/${owner}/${repo}/releases`) },
		{ label: 'Insights', href: `/${owner}/${repo}/insights`, icon: 'insights', match: (p: string) => p.startsWith(`/${owner}/${repo}/insights`) },
	]);

	const settingsActive = $derived($page.url.pathname.startsWith(`/${owner}/${repo}/settings`));
	let activeIndex = $derived(tabs.findIndex(t => t.match($page.url.pathname)));

	function updateIndicator() {
		if (!navContainer) return;
		const links = navContainer.querySelectorAll<HTMLAnchorElement>('a[data-repo-tab]');
		const settingsLink = navContainer.querySelector<HTMLAnchorElement>('a[data-repo-settings]');
		const target = settingsActive ? settingsLink : (activeIndex >= 0 ? links[activeIndex] : null);
		if (!target) {
			indicatorStyle = 'opacity: 0;';
			return;
		}
		// Use offsetLeft/offsetTop to account for scroll position within the container
		const el = target as HTMLElement;
		indicatorStyle = `width: ${el.offsetWidth}px; height: ${el.offsetHeight}px; left: ${el.offsetLeft}px; top: ${el.offsetTop}px; opacity: 1;`;

		// Auto-scroll active tab into view on mobile
		target.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
	}

	onMount(() => {
		mounted = true;
		tick().then(updateIndicator);
	});

	afterNavigate(() => {
		tick().then(updateIndicator);
	});

	$effect(() => {
		if (mounted && navContainer) {
			const _ = activeIndex;
			const __ = settingsActive;
			tick().then(updateIndicator);
		}
	});
</script>

<svelte:window onresize={updateIndicator} />

<nav bind:this={navContainer} class="flex items-center gap-0.5 overflow-x-auto glass-subtle rounded-xl p-1 relative scrollbar-none">
	{#if mounted}
		<div
			class="absolute rounded-lg pointer-events-none z-0"
			style="{indicatorStyle} background: color-mix(in srgb, var(--color-primary) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent); transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease, height 0.25s ease, opacity 0.2s ease;"
			aria-hidden="true"
		></div>
	{/if}

	{#each tabs as tab}
		{@const active = tab.match($page.url.pathname)}
		<a
			href={tab.href}
			data-repo-tab
			class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap relative z-10"
			style="
				color: {active ? 'var(--color-primary)' : 'var(--color-text-dim)'};
				font-weight: {active ? '600' : '400'};
				transition: color 0.2s ease;
			"
			onmouseenter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text)'; }}
			onmouseleave={(e) => { if (!active) e.currentTarget.style.color = active ? 'var(--color-primary)' : 'var(--color-text-dim)'; }}
		>
			{#if tab.icon === 'code'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
			{:else if tab.icon === 'issue'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" /></svg>
			{:else if tab.icon === 'pr'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
			{:else if tab.icon === 'commit'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path stroke-linecap="round" d="M12 3v6m0 6v6" /></svg>
			{:else if tab.icon === 'branch'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
			{:else if tab.icon === 'wiki'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
			{:else if tab.icon === 'release'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
			{:else if tab.icon === 'insights'}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
			{/if}
			<span class="hidden sm:inline">{tab.label}</span>
		</a>
	{/each}
	<a
		href="/{owner}/{repo}/settings"
		data-repo-settings
		class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap ml-auto relative z-10"
		style="
			color: {settingsActive ? 'var(--color-primary)' : 'var(--color-text-dim)'};
			font-weight: {settingsActive ? '600' : '400'};
			transition: color 0.2s ease;
		"
	>
		<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
		<span class="hidden sm:inline">Settings</span>
	</a>
</nav>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
