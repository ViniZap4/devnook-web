<script lang="ts">
	let { data = [], label = '', color = 'var(--color-primary)', height = 140 }: {
		data?: { day: string; count: number }[];
		label?: string;
		color?: string;
		height?: number;
	} = $props();

	const WIDTH = 400;
	const PADDING = { top: 12, right: 8, bottom: 24, left: 32 };
	const chartW = WIDTH - PADDING.left - PADDING.right;
	const chartH = $derived(height - PADDING.top - PADDING.bottom);

	const maxVal = $derived(Math.max(1, ...data.map(d => d.count)));

	function x(i: number): number {
		if (data.length <= 1) return PADDING.left + chartW / 2;
		return PADDING.left + (i / (data.length - 1)) * chartW;
	}

	function y(v: number): number {
		return PADDING.top + chartH - (v / maxVal) * chartH;
	}

	const linePath = $derived(
		data.length < 2
			? ''
			: data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ')
	);

	const areaPath = $derived(
		data.length < 2
			? ''
			: linePath + ` L${x(data.length - 1).toFixed(1)},${(PADDING.top + chartH).toFixed(1)} L${x(0).toFixed(1)},${(PADDING.top + chartH).toFixed(1)} Z`
	);

	const yTicks = $derived(() => {
		const ticks: number[] = [0];
		if (maxVal <= 4) {
			for (let i = 1; i <= maxVal; i++) ticks.push(i);
		} else {
			const step = Math.ceil(maxVal / 3);
			for (let v = step; v <= maxVal; v += step) ticks.push(v);
			if (ticks[ticks.length - 1] !== maxVal) ticks.push(maxVal);
		}
		return ticks;
	});

	function formatDay(day: string): string {
		const d = new Date(day + 'T00:00:00');
		return `${d.getMonth() + 1}/${d.getDate()}`;
	}

	const total = $derived(data.reduce((s, d) => s + d.count, 0));
</script>

<div class="admin-chart">
	<div class="chart-header">
		<span class="chart-label">{label}</span>
		<span class="chart-total" style="color: {color};">{total}</span>
	</div>
	{#if data.length === 0}
		<div class="chart-empty" style="height: {height}px;">
			<span>No data</span>
		</div>
	{:else}
		<svg viewBox="0 0 {WIDTH} {height}" preserveAspectRatio="none" class="chart-svg" style="height: {height}px;">
			<!-- Y grid lines -->
			{#each yTicks() as tick}
				<line
					x1={PADDING.left} y1={y(tick)}
					x2={PADDING.left + chartW} y2={y(tick)}
					stroke="var(--glass-border)" stroke-width="0.5" stroke-dasharray="3,3"
				/>
				<text x={PADDING.left - 4} y={y(tick) + 3} text-anchor="end" class="chart-tick">{tick}</text>
			{/each}

			<!-- X labels -->
			{#if data.length > 1}
				<text x={x(0)} y={PADDING.top + chartH + 14} text-anchor="start" class="chart-tick">{formatDay(data[0].day)}</text>
				<text x={x(data.length - 1)} y={PADDING.top + chartH + 14} text-anchor="end" class="chart-tick">{formatDay(data[data.length - 1].day)}</text>
			{/if}

			<!-- Area fill -->
			{#if areaPath}
				<path d={areaPath} fill={color} opacity="0.08" />
			{/if}

			<!-- Line -->
			{#if linePath}
				<path d={linePath} fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			{/if}

			<!-- Data dots -->
			{#each data as d, i}
				{#if d.count > 0}
					<circle cx={x(i)} cy={y(d.count)} r="2.5" fill={color} />
				{/if}
			{/each}
		</svg>
	{/if}
</div>

<style>
	.admin-chart {
		border-radius: 0.75rem;
		border: 1px solid var(--glass-border);
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		overflow: hidden;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--glass-border);
	}

	.chart-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-dim);
	}

	.chart-total {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.chart-svg {
		width: 100%;
		display: block;
		padding: 0 0.5rem 0.25rem;
	}

	.chart-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	.chart-tick {
		font-size: 8px;
		fill: var(--color-text-dim);
		opacity: 0.6;
	}
</style>
