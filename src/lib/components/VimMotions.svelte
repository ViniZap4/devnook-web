<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	let mode = $state<'normal' | 'insert'>('normal');
	let pending = $state('');
	let showHint = $state(false);
	let hintText = $state('');
	let hintTimeout: ReturnType<typeof setTimeout>;

	function flash(text: string) {
		hintText = text;
		showHint = true;
		clearTimeout(hintTimeout);
		hintTimeout = setTimeout(() => { showHint = false; }, 1200);
	}

	function isInputFocused(): boolean {
		const el = document.activeElement;
		if (!el) return false;
		const tag = el.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
		if ((el as HTMLElement).contentEditable === 'true') return true;
		return false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!browser) return;

		// Always allow Escape to exit insert mode / unfocus
		if (e.key === 'Escape') {
			if (isInputFocused()) {
				(document.activeElement as HTMLElement)?.blur();
			}
			mode = 'normal';
			pending = '';
			flash('NORMAL');
			return;
		}

		// Don't capture when in input fields
		if (isInputFocused()) {
			mode = 'insert';
			return;
		}

		// Don't capture with ctrl/cmd modifiers (allow browser shortcuts)
		if (e.ctrlKey || e.metaKey) return;

		// Normal mode keybindings
		if (mode === 'normal') {
			const key = e.key;

			// Two-key combos
			if (pending === 'g') {
				if (key === 'g') {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
					flash('gg - top');
				} else if (key === 'h') {
					e.preventDefault();
					goto('/dashboard');
					flash('gh - dashboard');
				} else if (key === 'n') {
					e.preventDefault();
					goto('/notifications');
					flash('gn - notifications');
				} else if (key === 'e') {
					e.preventDefault();
					goto('/explore');
					flash('ge - explore');
				} else if (key === 'f') {
					e.preventDefault();
					goto('/feed');
					flash('gf - feed');
				} else if (key === 'm') {
					e.preventDefault();
					goto('/messages');
					flash('gm - messages');
				} else if (key === 'd') {
					e.preventDefault();
					goto('/docs');
					flash('gd - docs');
				} else if (key === 's') {
					e.preventDefault();
					goto('/settings');
					flash('gs - settings');
				}
				pending = '';
				return;
			}

			switch (key) {
				case 'j':
					e.preventDefault();
					window.scrollBy({ top: 80, behavior: 'smooth' });
					break;
				case 'k':
					e.preventDefault();
					window.scrollBy({ top: -80, behavior: 'smooth' });
					break;
				case 'd':
					if (e.shiftKey) break;
					e.preventDefault();
					window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
					break;
				case 'u':
					e.preventDefault();
					window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
					break;
				case 'G':
					e.preventDefault();
					window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
					flash('G - bottom');
					break;
				case 'g':
					pending = 'g';
					flash('g...');
					return;
				case '/':
					e.preventDefault();
					document.dispatchEvent(new CustomEvent('open-command-palette'));
					flash('/ - search');
					break;
				case 'i':
					mode = 'insert';
					flash('INSERT');
					break;
				case '?':
					e.preventDefault();
					flash('Vim: j/k scroll, d/u half-page, G/gg top/bottom, g+h/e/f/m/d/s goto, / search');
					clearTimeout(hintTimeout);
					hintTimeout = setTimeout(() => { showHint = false; }, 4000);
					break;
				default:
					break;
			}
			pending = '';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if showHint}
	<div class="vim-hint" class:vim-hint-exit={!showHint}>
		<span class="vim-hint-badge">{mode === 'insert' ? 'INSERT' : 'NORMAL'}</span>
		{hintText}
	</div>
{/if}

<style>
	.vim-hint {
		position: fixed;
		top: 64px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		padding: 6px 16px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-family: 'JetBrains Mono', monospace;
		font-weight: 500;
		backdrop-filter: blur(20px) saturate(1.5);
		background: color-mix(in srgb, var(--color-surface) 80%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 8px;
		animation: vim-hint-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
		pointer-events: none;
	}

	.vim-hint-badge {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
		color: var(--color-primary);
	}

	@keyframes vim-hint-in {
		0% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
		100% { opacity: 1; transform: translateX(-50%) translateY(0); }
	}
</style>
