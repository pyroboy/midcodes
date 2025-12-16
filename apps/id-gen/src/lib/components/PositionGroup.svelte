<script lang="ts">
	let { x, y, width, height, rotation = 0, onUpdate } = $props();

	function handleXChange(event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		onUpdate({ x: value });
	}

	function handleYChange(event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		onUpdate({ y: value });
	}

	function handleWidthChange(event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		onUpdate({ width: value });
	}

	function handleHeightChange(event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		onUpdate({ height: value });
	}

	function handleRotationChange(event: Event) {
		let value = Number((event.target as HTMLInputElement).value);
		// Normalize to -180 to +180 range
		value = value % 360;
		if (value > 180) {
			value -= 360;
		} else if (value < -180) {
			value += 360;
		}
		onUpdate({ rotation: value });
	}
</script>

<div class="position-container">
	<div class="input-group position-group">
		<label>
			<span>X</span>
			<input type="number" value={x} oninput={handleXChange} />
		</label>
		<label>
			<span>Y</span>
			<input type="number" value={y} oninput={handleYChange} />
		</label>
	</div>
	<div class="input-group position-group">
		<label>
			<span>W</span>
			<input type="number" value={width} oninput={handleWidthChange} />
		</label>
		<label>
			<span>H</span>
			<input type="number" value={height} oninput={handleHeightChange} />
		</label>
	</div>
	<div class="input-group position-group rotation-group">
		<label>
			<span title="Rotation in degrees">R</span>
			<input
				type="number"
				value={rotation}
				oninput={handleRotationChange}
				min="-180"
				max="180"
				step="1"
			/>
			<span class="unit">deg</span>
		</label>
	</div>
</div>

<style>
	.position-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.position-group {
		display: flex;
		background-color: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
	}
	.position-group label {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 4px 8px;
		background-color: #2d2d2d;
		flex: 1;
	}
	.position-group label:last-of-type {
		border-right: none;
	}
	.position-group span {
		font-size: 12px;
		color: #888;
		margin-right: 4px;
		width: 30px;
	}
	.position-group input {
		width: 100%;
		background-color: transparent;
		border: none;
		color: #fff;
		font-size: 12px;
		padding: 2px;
		text-align: left;
	}
	.position-group input[type='number']::-webkit-inner-spin-button,
	.position-group input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.rotation-group label {
		flex: 1;
		justify-content: space-between;
	}

	.rotation-group .unit {
		font-size: 10px;
		color: #666;
		margin-left: 4px;
		width: auto;
		flex-shrink: 0;
	}
</style>
