<script lang="ts">
	let { owner, repo, path = '', ref = 'main' }: {
		owner: string;
		repo: string;
		path?: string;
		ref?: string;
	} = $props();

	const segments = $derived(path ? path.split('/').filter(Boolean) : []);
</script>

<nav class="flex items-center gap-1 text-sm text-[var(--color-text)]">
	<a href="/{owner}/{repo}" class="hover:underline opacity-70 hover:opacity-100 font-semibold" style="color: var(--palette-0);">
		{repo}
	</a>
	{#each segments as segment, i}
		<span class="opacity-30">/</span>
		{#if i < segments.length - 1}
			<a
				href="/{owner}/{repo}/tree/{ref}/{segments.slice(0, i + 1).join('/')}"
				class="hover:underline opacity-70 hover:opacity-100"
				style="color: var(--palette-0);"
			>
				{segment}
			</a>
		{:else}
			<span class="font-semibold">{segment}</span>
		{/if}
	{/each}
</nav>
