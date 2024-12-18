<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import JSZip from 'jszip';
    import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
    
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

    
    let idCards: IdCard[] = [];
    let selectedCards: Set<string> = new Set();
    let selectAll = false;
    let isLoading = true;
    let errorMessage = '';
    let selectedFrontImage: string | null = null;
    let selectedBackImage: string | null = null;
    
    onMount(async () => {
        await fetchIdCards();
    });
    
    async function fetchIdCards() {
        isLoading = true;
        errorMessage = '';
        console.log('Starting fetchIdCards()...');
        
        try {
            console.log('Querying Supabase...');
            const { data, error } = await supabase
                .from('idcards')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching ID cards:', error);
                errorMessage = `Error fetching ID cards: ${error.message}`;
                return;
            }

            console.log('Raw data from Supabase:', data);
            
            if (data && data.length > 0) {
                console.log(`Processing ${data.length} ID cards...`);
                idCards = await Promise.all(data.map(async (card: any, index: number) => {
                    console.log(`Processing card ${index + 1}/${data.length}`);
                    const parsedData = typeof card.data === 'string' ? JSON.parse(card.data) : card.data;
                    console.log(`Getting public URL for card ${index + 1} images...`);
                    const frontUrl = await getPublicUrl(card.front_image);
                    const backUrl = await getPublicUrl(card.back_image);
                    console.log(`Finished processing card ${index + 1}`);
                    return {
                        ...card,
                        front_image: frontUrl,
                        back_image: backUrl,
                        data: parsedData
                    };
                }));
                console.log('Finished processing all cards');
            } else {
                console.log('No ID cards found in the response');
                errorMessage = 'No ID cards found';
            }
        } catch (e: any) {
            console.error('Unexpected error in fetchIdCards:', e);
            errorMessage = `Unexpected error: ${e.message}`;
        } finally {
            console.log('Setting isLoading to false');
            isLoading = false;
        }
    }

    async function getPublicUrl(path: string): Promise<string> {
        if (!path) {
            console.log('[Debug] Empty path provided to getPublicUrl');
            return '';
        }
        console.log('[Debug] Getting public URL for path:', path);
        const { data } = await supabase.storage.from('rendered-id-cards').getPublicUrl(path);
        console.log('[Debug] Got public URL:', data.publicUrl);
        return data.publicUrl;
    }
    
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString();
    }

    function toggleSelectAll() {
        if (selectAll) {
            selectedCards = new Set(idCards.map(card => card.id));
        } else {
            selectedCards.clear();
        }
        selectedCards = selectedCards;
    }

    function toggleCardSelection(cardId: string) {
        if (selectedCards.has(cardId)) {
            selectedCards.delete(cardId);
        } else {
            selectedCards.add(cardId);
        }
        selectedCards = selectedCards;
        selectAll = selectedCards.size === idCards.length;
    }

    async function downloadCard(card: IdCard) {
        try {
            const frontResponse = await fetch(card.front_image);
            const backResponse = await fetch(card.back_image);
            const frontBlob = await frontResponse.blob();
            const backBlob = await backResponse.blob();

            const zip = new JSZip();
            zip.file(`${card.data.name || 'unknown'}_front.png`, frontBlob);
            zip.file(`${card.data.name || 'unknown'}_back.png`, backBlob);

            const content = await zip.generateAsync({type: "blob"});
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${card.data.name || 'id_card'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading card:', error);
            alert('Failed to download card');
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
        try {
            const zip = new JSZip();
            for (const cardId of selectedCards) {
                const card = idCards.find(c => c.id === cardId);
                if (card) {
                    const frontResponse = await fetch(card.front_image);
                    const backResponse = await fetch(card.back_image);
                    const frontBlob = await frontResponse.blob();
                    const backBlob = await backResponse.blob();

                    zip.file(`${card.data.name || 'unknown'}_${card.id}_front.png`, frontBlob);
                    zip.file(`${card.data.name || 'unknown'}_${card.id}_back.png`, backBlob);
                }
            }

            const content = await zip.generateAsync({type: "blob"});
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'id_cards.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error bulk downloading cards:', error);
            alert('Failed to download selected cards');
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

    function openImageModal(frontImage: string, backImage: string) {
        console.log('[Debug] Opening modal with images:', { frontImage, backImage });
        selectedFrontImage = frontImage;
        selectedBackImage = backImage;
    }

    function closeImageModal() {
        console.log('[Debug] Closing modal');
        selectedFrontImage = null;
        selectedBackImage = null;
    }
console.log(idCards)
    
</script>

<svelte:head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
</svelte:head>

<style lang="postcss">
    .id-cards-container {
        @apply p-4;
    }

    h2 {
        @apply text-2xl font-bold mb-4 text-foreground;
    }

    .bulk-actions {
        @apply mb-4 flex gap-2;
    }

    .bulk-actions button {
        @apply px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed;
    }

    table {
        @apply w-full border-collapse bg-card text-card-foreground;
    }

    thead {
        @apply bg-muted;
    }

    th {
        @apply px-4 py-2 text-left font-medium text-muted-foreground border-b border-border;
    }

    td {
        @apply px-4 py-2 border-b border-border;
    }

    .actions {
        @apply flex gap-2;
    }

    .actions button {
        @apply px-3 py-1 rounded text-sm;
    }

    .actions button.download {
        @apply bg-primary text-primary-foreground hover:bg-primary/90;
    }

    .actions button.delete {
        @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
    }

    .error {
        @apply text-destructive;
    }

    .checkbox-cell {
        @apply w-8 text-center;
    }

    input[type="checkbox"] {
        @apply w-4 h-4 rounded border-primary text-primary focus:ring-primary;
    }

    .image-cell {
        @apply relative;
    }

    .image-button {
        @apply p-0 border-0 bg-transparent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary rounded;
    }

    .id-thumbnail {
        @apply h-12 w-auto object-contain;
    }
</style>

<div class="id-cards-container">
    <h2>Generated ID Cards</h2>
    
    {#if isLoading}
        <p>Loading ID cards...</p>
    {:else if errorMessage}
        <p class="error">{errorMessage}</p>
    {:else if idCards.length === 0}
        <p>No ID cards found.</p>
    {:else}
        <div class="bulk-actions">
            <button on:click={bulkDownload} disabled={selectedCards.size === 0}>Download Selected</button>
            <button on:click={bulkDelete} disabled={selectedCards.size === 0}>Delete Selected</button>
        </div>

        <div class="rounded-md border">
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
                        <th>Name</th>
                        <th>ID Number</th>
                        <th>Created At</th>
                        <th>Front Image</th>
                        <th>Back Image</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each idCards as card}
                        <tr class="hover:bg-muted/50">
                            <td class="checkbox-cell">
                                <input
                                    type="checkbox"
                                    checked={selectedCards.has(card.id)}
                                    on:change={() => toggleCardSelection(card.id)}
                                />
                            </td>
                            <td>{card.data?.name || 'N/A'}</td>
                            <td>{card.data?.licenseNo || 'N/A'}</td>
                            <td>{formatDate(card.created_at)}</td>
                            <td class="image-cell">
                                {#if card.front_image}
                                    <button 
                                        type="button"
                                        class="image-button"
                                        on:click={() => openImageModal(card.front_image, card.back_image)}
                                        aria-label="View ID card images">
                                        <img 
                                            src={card.front_image} 
                                            alt="Front ID" 
                                            class="id-thumbnail"
                                            on:error={() => console.error(`Failed to load front image for card ${card.id}`)} 
                                        />
                                    </button>
                                {:else}
                                    <span>No front image</span>
                                {/if}
                            </td>
                            <td class="image-cell">
                                {#if card.back_image}
                                    <button 
                                        type="button"
                                        class="image-button"
                                        on:click={() => openImageModal(card.front_image, card.back_image)}
                                        aria-label="View ID card images">
                                        <img 
                                            src={card.back_image} 
                                            alt="Back ID" 
                                            class="id-thumbnail"
                                            on:error={() => console.error(`Failed to load back image for card ${card.id}`)} 
                                        />
                                    </button>
                                {:else}
                                    <span>No back image</span>
                                {/if}
                            </td>
                            <td class="actions">
                                <button class="download" on:click={() => downloadCard(card)}>
                                    Download
                                </button>
                                <button class="delete" on:click={() => deleteCard(card.id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<ImagePreviewModal 
    frontImageUrl={selectedFrontImage}
    backImageUrl={selectedBackImage}
    onClose={closeImageModal}
/>