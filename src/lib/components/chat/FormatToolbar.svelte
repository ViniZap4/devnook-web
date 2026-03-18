<script lang="ts">
	let {
		textareaEl,
		currentValue = '',
		oninsert
	}: {
		textareaEl: HTMLTextAreaElement | undefined;
		currentValue: string;
		oninsert: (newValue: string) => void;
	} = $props();

	function wrapSelection(prefix: string, suffix: string) {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;
		const value = currentValue;
		const selected = value.slice(start, end);

		if (selected) {
			const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
			oninsert(newValue);
			requestAnimationFrame(() => {
				if (!textareaEl) return;
				textareaEl.selectionStart = start + prefix.length;
				textareaEl.selectionEnd = end + prefix.length;
				textareaEl.focus();
			});
		} else {
			const placeholder = prefix === '[' ? '[text](url)' : prefix + 'text' + suffix;
			const newValue = value.slice(0, start) + placeholder + value.slice(end);
			oninsert(newValue);
			requestAnimationFrame(() => {
				if (!textareaEl) return;
				if (prefix === '[') {
					textareaEl.selectionStart = start + 1;
					textareaEl.selectionEnd = start + 5;
				} else {
					textareaEl.selectionStart = start + prefix.length;
					textareaEl.selectionEnd = start + prefix.length + 4;
				}
				textareaEl.focus();
			});
		}
	}

	const tools = [
		{ label: 'Bold', icon: 'B', prefix: '**', suffix: '**', style: 'font-weight:700' },
		{ label: 'Italic', icon: 'I', prefix: '_', suffix: '_', style: 'font-style:italic' },
		{ label: 'Strikethrough', icon: 'S', prefix: '~', suffix: '~', style: 'text-decoration:line-through' },
		{ label: 'Code', icon: '</>', prefix: '`', suffix: '`', style: 'font-family:monospace;font-size:12px' },
		{ label: 'Code block', icon: '```', prefix: '```\n', suffix: '\n```', style: 'font-family:monospace;font-size:11px' },
		{ label: 'Link', icon: '[]', prefix: '[', suffix: '](url)', style: 'text-decoration:underline' },
		{ label: 'Spoiler', icon: '||', prefix: '||', suffix: '||', style: 'background:var(--color-text-dim);color:transparent;border-radius:3px;padding:0 2px;font-size:12px' },
	];
</script>

<div class="format-toolbar">
	{#each tools as tool}
		<button
			class="fmt-btn"
			title={tool.label}
			aria-label={tool.label}
			type="button"
			onclick={() => wrapSelection(tool.prefix, tool.suffix)}
		>
			<span style={tool.style}>{tool.icon}</span>
		</button>
	{/each}
</div>

<style>
	.format-toolbar {
		display: flex; align-items: center; gap: 2px;
		padding: 4px 12px 0; opacity: 0.7;
		transition: opacity 0.15s;
	}
	.format-toolbar:hover { opacity: 1; }
	.fmt-btn {
		width: 28px; height: 26px; border-radius: 6px;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); font-size: 13px;
		transition: background 0.1s, color 0.1s;
	}
	.fmt-btn:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); color: var(--color-text); }
	.fmt-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.format-toolbar { transition: none !important; }
	}
</style>
