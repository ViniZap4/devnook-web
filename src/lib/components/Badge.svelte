<script lang="ts">
	let { label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'danger' | 'warning' } = $props();

	const variantClasses: Record<string, string> = {
		default: 'bg-white/10 text-[var(--color-text)]',
		success: 'bg-green-500/20 text-green-400',
		danger: 'bg-red-500/20 text-red-400',
		warning: 'bg-yellow-500/20 text-yellow-400'
	};
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {variantClasses[variant]}">
	{label}
</span>
