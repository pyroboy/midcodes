<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import JSZip from 'jszip';
    import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
    import { invalidate } from '$app/navigation';
    
    interface IdCard {
        id: string;
        template_id: string;
        front_image: string;
        back_image: string;
        data: {
            name?: string;
            licenseNo?: string;
            [key: string]: any;
        };
        created_at: string;
    }

    export let data: { idCards: any[] };
    let idCards: IdCard[] = [];
    let selectedCards: Set<string> = new Set();
    let selectAll = false;
    let isLoading = false;
    let errorMessage = '';
    let selectedFrontImage: string | null = null;
    let selectedBackImage: string | null = null;
    let loadingProgress = 0;
    let totalCards = 0;
    let downloadingCards = new Set<string>();

    onMount(async () => {
        if (data.idCards?.length > 0) {
            idCards = data.idCards.map(card => ({
                ...card,
                data: typeof card.data === 'string' ? JSON.parse(card.data) : card.data
            }));
        }
    });

    async function openPreview(card: IdCard) {
        isLoading = true;
        try {
            const [frontUrl, backUrl] = await Promise.all([
                getPublicUrl(card.front_image),
                getPublicUrl(card.back_image)
            ]);
            selectedFrontImage = frontUrl;
            selectedBackImage = backUrl;
        } catch (e) {
            console.error('Error loading preview images:', e);
            errorMessage = 'Failed to load preview images';
        } finally {
            isLoading = false;
        }
    }

    async function getPublicUrl(path: string): Promise<string> {
        if (!path) return '';
        try {
            const { data } = await supabase.storage.from('rendered-id-cards').getPublicUrl(path);
            return data.publicUrl;
        } catch (e) {
            console.error('Error getting public URL:', e);
            return '';
        }
    }

    async function fetchIdCards() {
        if (isLoading) return; // Prevent multiple fetches
        
        try {
            const { data: newData, error } = await supabase
                .from('idcards')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (newData?.length > 0) {
                idCards = newData.map(card => ({
                    ...card,
                    data: typeof card.data === 'string' ? JSON.parse(card.data) : card.data
                }));
                await invalidate('app:idCards');
            } else {
                errorMessage = 'No ID cards found';
                idCards = [];
            }
        } catch (e: any) {
            console.error('Error fetching ID cards:', e);
            errorMessage = `Error: ${e.message}`;
        }
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString();
    }

    function toggleSelectAll() {
        if (!selectAll) {
            selectedCards = new Set(idCards.map(card => card.id));
        } else {
            selectedCards.clear();
        }
        selectAll = !selectAll;
        console.log('Selected cards after toggle all:', Array.from(selectedCards));
    }

    function toggleCardSelection(cardId: string) {
        if (selectedCards.has(cardId)) {
            selectedCards.delete(cardId);
        } else {
            selectedCards.add(cardId);
        }
        selectedCards = selectedCards; // Trigger reactivity
        selectAll = selectedCards.size === idCards.length;
        console.log('Selected cards after toggle:', Array.from(selectedCards));
    }

    async function downloadCard(card: IdCard) {
        if (downloadingCards.has(card.id)) return;
        downloadingCards.add(card.id);
        
        try {
            const zip = new JSZip();
            const frontUrl = card.front_image;
            const backUrl = card.back_image;
            const cardName = card.data?.name?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'id-card';
            
            const [frontResponse, backResponse] = await Promise.all([
                fetch(supabase.storage.from('rendered-id-cards').getPublicUrl(frontUrl).data.publicUrl),
                fetch(supabase.storage.from('rendered-id-cards').getPublicUrl(backUrl).data.publicUrl)
            ]);
            
            if (!frontResponse.ok || !backResponse.ok) {
                throw new Error('Failed to fetch images');
            }
            
            const [frontBlob, backBlob] = await Promise.all([
                frontResponse.blob(),
                backResponse.blob()
            ]);
            
            zip.file(`${cardName}_front.png`, frontBlob);
            zip.file(`${cardName}_back.png`, backBlob);
            
            const content = await zip.generateAsync({ type: 'blob' });
            const downloadUrl = URL.createObjectURL(content);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${cardName}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading card:', error);
            errorMessage = 'Failed to download ID card';
        } finally {
            downloadingCards.delete(card.id);
        }
    }

    async function deleteCard(cardId: string) {
        const { error } = await supabase
            .from('idcards')
            .delete()
            .eq('id', cardId);

        if (error) {
            console.error('Error deleting ID card:', error);
        } else {
            idCards = idCards.filter(card => card.id !== cardId);
            selectedCards.delete(cardId);
            selectedCards = selectedCards;
        }
    }

    async function bulkDownload() {
        const selectedCardsList = idCards.filter(card => selectedCards.has(card.id));
        console.log('Starting bulk download with cards:', selectedCardsList.map(card => ({
            id: card.id,
            name: card.data?.name,
            front_image: card.front_image,
            back_image: card.back_image
        })));
        if (selectedCardsList.length === 0) {
            errorMessage = 'No cards selected for download';
            return;
        }

        try {
            const zip = new JSZip();
            let successCount = 0;

            for (const card of selectedCardsList) {
                try {
                    const cardName = card.data?.name?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'id-card';
                    const folderName = cardName + '/';

                    const [frontResponse, backResponse] = await Promise.all([
                        fetch(supabase.storage.from('rendered-id-cards').getPublicUrl(card.front_image).data.publicUrl),
                        fetch(supabase.storage.from('rendered-id-cards').getPublicUrl(card.back_image).data.publicUrl)
                    ]);

                    if (!frontResponse.ok || !backResponse.ok) {
                        console.error(`Failed to fetch images for ${cardName}`);
                        continue;
                    }

                    const [frontBlob, backBlob] = await Promise.all([
                        frontResponse.blob(),
                        backResponse.blob()
                    ]);

                    // Create folder and add files
                    zip.folder(folderName); // Explicitly create the folder
                    zip.file(folderName + 'front.png', frontBlob);
                    zip.file(folderName + 'back.png', backBlob);
                    successCount++;
                } catch (error) {
                    console.error('Error processing card:', error);
                }
            }

            if (successCount === 0) {
                throw new Error('Failed to process any cards');
            }

            const content = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            });

            const downloadUrl = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'id_cards.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            // Clear selection only on successful download
            selectedCards.clear();
            selectAll = false;
        } catch (error) {
            console.error('Error in bulk download:', error);
            errorMessage = 'Failed to download selected cards';
        }
    }

    async function bulkDelete() {
        const { error } = await supabase
            .from('idcards')
            .delete()
            .in('id', Array.from(selectedCards));

        if (error) {
            console.error('Error deleting ID cards:', error);
        } else {
            idCards = idCards.filter(card => !selectedCards.has(card.id));
            selectedCards.clear();
            selectedCards = selectedCards;
            selectAll = false;
        }
    }
</script>

<svelte:head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
</svelte:head>

<style lang="postcss">
    .id-cards-container {
        @apply p-4;
    }

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-message {
        @apply text-destructive bg-destructive/10 p-4 rounded mb-4;
    }

    .table-container {
        @apply relative overflow-x-auto rounded-lg border border-border bg-card;
    }

    table {
        @apply w-full text-sm;
    }

    thead {
        @apply bg-muted/50 text-muted-foreground;
    }

    th {
        @apply px-6 py-4 text-left font-medium whitespace-nowrap sticky top-0 bg-muted/50;
    }

    tbody tr {
        @apply border-t border-border hover:bg-muted/50 cursor-pointer;
    }

    td {
        @apply px-6 py-4 align-middle;
    }

    .checkbox-cell {
        @apply w-10 text-center;
    }

    .image-cell {
        @apply w-24;
    }

    .id-thumbnail {
        @apply h-16 w-auto object-contain rounded shadow-sm;
    }

    .image-placeholder {
        @apply h-16 w-24 bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-xs;
    }

    .actions-cell {
        @apply w-48 whitespace-nowrap;
    }

    .name-cell {
        @apply font-medium;
    }

    .license-cell {
        @apply font-mono text-muted-foreground;
    }

    .date-cell {
        @apply text-muted-foreground whitespace-nowrap;
    }

    .bulk-actions {
        @apply mb-4 flex items-center gap-4;
    }

    .btn-download {
        @apply inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors;
        min-width: 100px;
        justify-content: center;
    }

    .loading-spinner {
        @apply inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin;
    }
</style>

<div class="id-cards-container">
    <h2 class="text-2xl font-bold mb-4">Generated ID Cards</h2>

    {#if isLoading}
        <div class="loading-overlay">
            <div class="loading-spinner" />
            <div class="mt-4 text-white">Loading...</div>
        </div>
    {/if}

    {#if errorMessage}
        <div class="error-message">
            {errorMessage}
            <button class="btn btn-primary ml-4" on:click={() => errorMessage = ''}>Dismiss</button>
        </div>
    {/if}

    <div class="bulk-actions">
        <label class="flex items-center gap-2">
            <input
                type="checkbox"
                bind:checked={selectAll}
                on:change={toggleSelectAll}
            />
            Select All
        </label>

        {#if selectedCards.size > 0}
            <button class="btn btn-primary" on:click={bulkDownload}>
                Download Selected ({selectedCards.size})
            </button>
            <button class="btn btn-destructive" on:click={bulkDelete}>
                Delete Selected ({selectedCards.size})
            </button>
        {/if}
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th class="checkbox-cell">
                        <input
                            type="checkbox"
                            bind:checked={selectAll}
                            on:change={toggleSelectAll}
                        />
                    </th>
                    <th class="image-cell">Preview</th>
                    <th>Name</th>
                    <th>License No.</th>
                    <th>Created</th>
                    <th class="actions-cell">Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each idCards as card}
                    <tr on:click={() => openPreview(card)}>
                        <td class="checkbox-cell">
                            <input
                                type="checkbox"
                                checked={selectedCards.has(card.id)}
                                on:change={() => toggleCardSelection(card.id)}
                                on:click|stopPropagation
                            />
                        </td>
                        <td class="image-cell">
                            {#if card.front_image}
                                <img
                                    src={supabase.storage.from('rendered-id-cards').getPublicUrl(card.front_image).data.publicUrl}
                                    alt="ID Card Preview"
                                    class="id-thumbnail"
                                    loading="lazy"
                                />
                            {:else}
                                <div class="image-placeholder">
                                    No Image
                                </div>
                            {/if}
                        </td>
                        <td class="name-cell">{card.data?.name || 'N/A'}</td>
                        <td class="license-cell">{card.data?.licenseNo || 'N/A'}</td>
                        <td class="date-cell">{formatDate(card.created_at)}</td>
                        <td class="actions-cell">
                            <button 
                                class="btn-download mr-2" 
                                on:click|stopPropagation={async () => {
                                    await downloadCard(card);
                                }}
                                disabled={downloadingCards.has(card.id)}
                            >
                                {#if downloadingCards.has(card.id)}
                                    <div class="loading-spinner" />
                                    <span>Loading</span>
                                {:else}
                                    <span>Download</span>
                                {/if}
                            </button>
                            <button 
                                class="btn btn-destructive" 
                                on:click|stopPropagation={() => deleteCard(card.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

{#if selectedFrontImage || selectedBackImage}
    <ImagePreviewModal
        frontImageUrl={selectedFrontImage}
        backImageUrl={selectedBackImage}
        onClose={() => {
            selectedFrontImage = null;
            selectedBackImage = null;
        }}
    />
{/if}