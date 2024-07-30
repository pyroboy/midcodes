<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    
    interface IdCard {
        id: string;
        template_id: string;
        front_image: string;
        back_image: string;
        data: string;
        created_at: string;
    }
    
    let idCards: IdCard[] = [];
    let selectedCards: Set<string> = new Set();
    let selectAll = false;
    let isLoading = true;
    let errorMessage = '';
    
    onMount(async () => {
        await fetchIdCards();
    });
    
    async function fetchIdCards() {
    isLoading = true;
    errorMessage = '';
    console.log('Fetching ID cards...');
    const { data, error } = await supabase
        .from('idcards')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching ID cards:', error);
        errorMessage = `Error fetching ID cards: ${error.message}`;
    } else {
        console.log('Fetched data:', data);
        if (data && data.length > 0) {
            idCards = await Promise.all(data.map(async (card: IdCard) => {
                const parsedData = JSON.parse(card.data);
                // Process the parsed data here
                // For example, you can extract specific properties or perform calculations
                const processedData = parsedData;
                return {
                    ...card,
                    front_image: await getPublicUrl(card.front_image),
                    back_image: await getPublicUrl(card.back_image),
                    data: processedData
                };
            }));
            console.log('Processed idCards:', idCards);
        } else {
            console.log('No ID cards found');
            errorMessage = 'No ID cards found';
        }
    }
    isLoading = false;
}
    async function getPublicUrl(path: string): Promise<string> {
        if (!path) return '';
        const { data } = await supabase.storage.from('rendered-id-cards').getPublicUrl(path);
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
console.log(idCards)
    
</script>

<svelte:head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
</svelte:head>

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

        <table>
            <thead>
                <tr>
                    <th>
                        <input type="checkbox" bind:checked={selectAll} on:change={toggleSelectAll}>
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
                    <tr>
                         
                        <td>
                            <input 
                                type="checkbox" 
                                checked={selectedCards.has(card.id)} 
                                on:change={() => toggleCardSelection(card.id)}
                            >
                        </td>

             
                        <td>{card.data?.name || 'N/A'}</td>
                        <td>{card.data?.licenseNo || 'N/A'}</td>
                        <td>{formatDate(card.created_at)}</td>
                        <td class="image-cell">
                            {#if card.front_image}
                                <img src={card.front_image} alt="Front" class="id-thumbnail" on:error={() => console.error(`Failed to load front image for card ${card.id}`)} />
                                <div class="image-hover">
                                    <img src={card.front_image} alt="Front Large" class="large-preview" />
                                </div>
                            {:else}
                                <span>No front image</span>
                            {/if}
                        </td>
                        <td class="image-cell">
                            {#if card.back_image}
                                <img src={card.back_image} alt="Back" class="id-thumbnail" on:error={() => console.error(`Failed to load back image for card ${card.id}`)} />
                                <div class="image-hover">
                                    <img src={card.back_image} alt="Back Large" class="large-preview" />
                                </div>
                            {:else}
                                <span>No back image</span>
                            {/if}
                        </td>
                        <td>
                            <button on:click={() => downloadCard(card)}>Download</button>
                            <button on:click={() => deleteCard(card.id)}>Delete</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style>
    .id-cards-container {
        padding: 20px;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    th {
        background-color: #f2f2f2;
    }
    .id-thumbnail {
        width: auto;
        height: 50px;
        object-fit: contain;
    }
    .bulk-actions {
        margin-bottom: 10px;
    }
    button {
        margin-right: 5px;
    }
    .error {
        color: red;
    }
    .image-cell {
        position: relative;
    }
    .image-hover {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        background-color: white;
        border: 1px solid #ddd;
        padding: 5px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .image-cell:hover .image-hover {
        display: block;
    }
    .large-preview {
        width: 3in;
        height: 2in;
        object-fit: contain;
    }
</style>