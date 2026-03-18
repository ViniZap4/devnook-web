<script lang="ts">
	let { label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' } = $props();

	const variantStyles: Record<string, string> = {
		default: 'background: rgba(255, 255, 255, 0.03); color: var(--color-text);',
		success: 'background: var(--color-success-subtle); color: var(--color-success);',
		danger: 'background: var(--color-error-subtle); color: var(--color-error);',
		warning: 'background: var(--color-warning-subtle); color: var(--color-warning);',
		info: 'background: var(--color-info-subtle); color: var(--color-secondary);'
	};
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={variantStyles[variant]}>
	{label}
</span>
