<script lang="ts">
    

    interface Props {
        x: number;
        y: number;
        width: number | undefined;
        height: number | undefined;
    }

    let {
        x = $bindable(),
        y = $bindable(),
        width = $bindable(),
        height = $bindable()
    }: Props = $props();
</script>

<div class="position-container">
    <div class="input-group position-group">
        <label>
            <span>X</span>
            <input type="number" bind:value={x}>
        </label>
        <label>
            <span>Y</span>
            <input type="number" bind:value={y}>
        </label>
    </div>
    <div class="input-group position-group">
        <label>
            <span>W</span>
            <input type="number" bind:value={width}>
        </label>
        <label>
            <span>H</span>
            <input type="number" bind:value={height}>
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
    .position-group input[type="number"]::-webkit-inner-spin-button,
    .position-group input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    /* .position-group input[type="number"] {
        -moz-appearance: textfield;
    } */
</style>