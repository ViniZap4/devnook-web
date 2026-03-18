<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppLayout from './AppLayout.svelte';

	type ContentWidth = 'narrow' | 'default' | 'wide' | 'full';
	let { children, rightPanel, width = 'default' as ContentWidth }: {
		children: Snippet;
		rightPanel?: Snippet;
		width?: ContentWidth;
	} = $props();
</script>

<AppLayout {width} {rightPanel}>
	{@render children()}
</AppLayout>
