<script lang="ts">
	let { name, color }: { name: string; color: string } = $props();
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
	style="background-color: {color}30; color: {color}; border: 1px solid {color}40;"
>
	{name}
</span>
