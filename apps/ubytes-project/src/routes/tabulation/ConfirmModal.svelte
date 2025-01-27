<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    
    export let message: string;
    export let onConfirm: () => void;
    export let onCancel: () => void;
</script>

<div class="modal-backdrop">
    <div class="modal-content">
        <h2 class="text-xl font-bold mb-4">Confirm Incomplete Rankings</h2>
        <p class="mb-4">{message}</p>
        <div class="flex justify-end space-x-2">
            <Button variant="outline" on:click={onCancel}>
                Cancel
            </Button>
            <Button variant="default" on:click={onConfirm}>
                Confirm
            </Button>
        </div>
    </div>
</div>

<style lang="postcss">
    .modal-backdrop {
        @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
    }

    .modal-content {
        @apply bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4;
    }
</style>

