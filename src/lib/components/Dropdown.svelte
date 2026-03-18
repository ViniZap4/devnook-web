<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';

	let {
		open = $bindable(false),
		align = 'right',
		width = 'w-56',
		fixed = false,
		trigger,
		children,
		panelClass = ''
	}: {
		open?: boolean;
		align?: 'left' | 'right';
		width?: string;
		fixed?: boolean;
		trigger: Snippet;
		children: Snippet;
		panelClass?: string;
	} = $props();

	let triggerEl = $state<HTMLButtonElement>();
	let panelEl = $state<HTMLDivElement>();
	let openUpward = $state(false);
	let fixedStyle = $state('');

	function toggle() {
		open = !open;
		if (open) {
			tick().then(() => computePosition());
		}
	}

	function close() {
		open = false;
	}

	function computePosition() {
		if (!triggerEl || !panelEl) return;
		const triggerRect = triggerEl.getBoundingClientRect();
		const panelRect = panelEl.getBoundingClientRect();
		const spaceBelow = window.innerHeight - triggerRect.bottom;
		const spaceAbove = triggerRect.top;
		openUpward = spaceBelow < panelRect.height + 8 && spaceAbove > panelRect.height + 8;

		if (fixed) {
			const top = openUpward
				? triggerRect.top - panelRect.height - 8
				: triggerRect.bottom + 8;
			const left = align === 'right'
				? Math.max(8, triggerRect.right - panelRect.width)
				: Math.min(triggerRect.left, window.innerWidth - panelRect.width - 8);
			fixedStyle = `top: ${top}px; left: ${left}px;`;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			e.stopPropagation();
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative">
	<button bind:this={triggerEl} type="button" onclick={toggle}>
		{@render trigger()}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={close} onkeydown={() => {}} aria-hidden="true"></div>
		<div
			bind:this={panelEl}
			class="{fixed ? 'fixed' : 'absolute'} {!fixed ? (align === 'right' ? 'right-0' : 'left-0') : ''} {!fixed ? (openUpward ? 'bottom-full mb-2' : 'top-full mt-2') : ''} z-50 {width} rounded-xl overflow-hidden animate-scale-in {panelClass}"
			style="background: var(--glass-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--glass-border); box-shadow: 0 8px 32px rgba(0,0,0,0.2); {fixed ? fixedStyle : ''}"
		>
			{@render children()}
		</div>
	{/if}
</div>
