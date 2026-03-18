<script lang="ts">
	import type { CallInfo } from '$lib/types/message';
	import Avatar from '$lib/components/Avatar.svelte';

	let {
		callInfo,
		localStream = null,
		remoteStream = null,
		micEnabled = true,
		cameraEnabled = true,
		onaccept,
		onreject,
		onend,
		ontogglemic,
		ontogglecamera,
	}: {
		callInfo: CallInfo;
		localStream: MediaStream | null;
		remoteStream: MediaStream | null;
		micEnabled: boolean;
		cameraEnabled: boolean;
		onaccept: () => void;
		onreject: () => void;
		onend: () => void;
		ontogglemic: () => void;
		ontogglecamera: () => void;
	} = $props();

	let remoteVideoEl = $state<HTMLVideoElement>();
	let localVideoEl = $state<HTMLVideoElement>();
	let elapsed = $state(0);

	$effect(() => {
		if (remoteVideoEl && remoteStream) {
			remoteVideoEl.srcObject = remoteStream;
		}
	});

	$effect(() => {
		if (localVideoEl && localStream) {
			localVideoEl.srcObject = localStream;
		}
	});

	$effect(() => {
		if (callInfo.state === 'connected' && callInfo.startTime) {
			const start = callInfo.startTime;
			const interval = setInterval(() => {
				elapsed = Math.floor((Date.now() - start) / 1000);
			}, 1000);
			return () => clearInterval(interval);
		}
	});

	function formatTime(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="call-overlay">
	{#if callInfo.state === 'calling' || callInfo.state === 'ringing' || callInfo.state === 'connecting'}
		<!-- Ringing / Calling state -->
		<div class="call-ringing">
			<div class="call-avatar-wrap">
				<div class="pulse-ring"></div>
				<div class="pulse-ring delay"></div>
				<Avatar username={callInfo.remoteUsername} size={96} />
			</div>
			<div class="call-status-text">
				{#if callInfo.state === 'ringing'}
					Incoming call from
				{:else if callInfo.state === 'connecting'}
					Connecting to
				{:else}
					Calling
				{/if}
			</div>
			<div class="call-name">{callInfo.remoteUsername}</div>
			{#if callInfo.isAudioOnly}
				<div class="call-type-badge">Audio only</div>
			{/if}

			<div class="call-actions">
				{#if callInfo.state === 'ringing'}
					<button class="call-btn call-accept" aria-label="Accept call" onclick={onaccept}>
						<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
						</svg>
					</button>
				{/if}
				<button class="call-btn call-reject" aria-label={callInfo.state === 'ringing' ? 'Reject call' : 'Cancel call'} onclick={callInfo.state === 'ringing' ? onreject : onend}>
					<svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L8.23 3.684A1 1 0 007.28 3H5z" />
					</svg>
				</button>
			</div>
		</div>
	{:else if callInfo.state === 'connected'}
		<!-- Connected state -->
		<div class="call-connected">
			{#if remoteStream}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={remoteVideoEl} autoplay playsinline class="remote-video"></video>
			{:else}
				<div class="call-avatar-wrap connected">
					<Avatar username={callInfo.remoteUsername} size={120} />
				</div>
			{/if}

			{#if localStream}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={localVideoEl} autoplay playsinline muted class="local-video"></video>
			{/if}

			<div class="call-controls">
				<div class="call-timer">{formatTime(elapsed)}</div>
				<div class="control-buttons">
					<button
						class="control-btn"
						class:control-off={!micEnabled}
						aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
						onclick={ontogglemic}
					>
						{#if micEnabled}
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
							</svg>
						{:else}
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
							</svg>
						{/if}
					</button>
					<button
						class="control-btn"
						class:control-off={!cameraEnabled}
						aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
						onclick={ontogglecamera}
					>
						{#if cameraEnabled}
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						{:else}
							<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						{/if}
					</button>
					<button class="control-btn call-end-btn" aria-label="End call" onclick={onend}>
						<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L8.23 3.684A1 1 0 007.28 3H5z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.call-overlay {
		position: fixed; inset: 0; z-index: 100;
		background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
		display: flex; align-items: center; justify-content: center;
		animation: overlay-in 0.3s ease both;
	}
	@keyframes overlay-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Ringing state */
	.call-ringing {
		display: flex; flex-direction: column; align-items: center; gap: 16px;
	}
	.call-avatar-wrap {
		position: relative; display: flex; align-items: center; justify-content: center;
	}
	.pulse-ring {
		position: absolute; width: 140px; height: 140px; border-radius: 50%;
		border: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
		animation: pulse-expand 2s ease-out infinite;
	}
	.pulse-ring.delay { animation-delay: 1s; }
	@keyframes pulse-expand {
		0% { transform: scale(0.7); opacity: 1; }
		100% { transform: scale(1.4); opacity: 0; }
	}
	.call-status-text { font-size: 16px; color: var(--color-text-dim); margin-top: 8px; }
	.call-name { font-size: 24px; font-weight: 700; color: var(--color-text); }
	.call-type-badge {
		font-size: 12px; padding: 4px 12px; border-radius: 12px;
		background: color-mix(in srgb, var(--color-text) 8%, transparent); color: var(--color-text-dim);
	}

	.call-actions { display: flex; gap: 24px; margin-top: 32px; }
	.call-btn {
		width: 64px; height: 64px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		color: white; transition: transform 0.15s;
	}
	.call-btn:hover { transform: scale(1.1); }
	.call-accept { background: var(--color-success); }
	.call-reject { background: var(--color-error); }

	/* Connected state */
	.call-connected {
		position: relative; width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
	}
	.call-avatar-wrap.connected { margin-top: -60px; }
	.remote-video {
		width: 100%; height: 100%; object-fit: cover;
	}
	.local-video {
		position: absolute; bottom: 100px; right: 24px;
		width: 160px; height: 120px; border-radius: 12px;
		object-fit: cover; border: 2px solid color-mix(in srgb, var(--color-text) 20%, transparent);
		box-shadow: 0 4px 16px rgba(0,0,0,0.4);
	}

	.call-controls {
		position: absolute; bottom: 0; left: 0; right: 0;
		display: flex; flex-direction: column; align-items: center; gap: 12px;
		padding: 20px 0 32px;
		background: linear-gradient(transparent, rgba(0,0,0,0.7));
	}
	.call-timer {
		font-size: 16px; font-weight: 600; color: white;
		font-variant-numeric: tabular-nums;
	}
	.control-buttons { display: flex; gap: 16px; }
	.control-btn {
		width: 52px; height: 52px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-text) 15%, transparent); backdrop-filter: blur(10px);
		color: white; display: flex; align-items: center; justify-content: center;
		transition: background 0.15s, transform 0.15s;
	}
	.control-btn:hover { background: color-mix(in srgb, var(--color-text) 25%, transparent); transform: scale(1.05); }
	.control-off { background: color-mix(in srgb, var(--color-error) 40%, transparent); }
	.control-off:hover { background: color-mix(in srgb, var(--color-error) 60%, transparent); }
	.call-end-btn { background: var(--color-error); }
	.call-end-btn:hover { background: color-mix(in srgb, var(--color-error) 85%, black); }

	@media (prefers-reduced-motion: reduce) {
		.call-overlay, .pulse-ring, .call-btn { animation: none !important; transition: none !important; }
	}
</style>
