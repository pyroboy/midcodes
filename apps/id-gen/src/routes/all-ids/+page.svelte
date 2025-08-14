<script lang="ts">

    import type { HeaderRow, DataRow } from '$lib/types';
    import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
    import { getSupabaseStorageUrl } from '$lib/utils/supabase';
    import { preloadCardGeometry } from '$lib/utils/cardGeometry';
    import JSZip from 'jszip';
    
import type { PageData } from './$types';
	import type { IDCard } from './+page.server';

    let { data }: { data: PageData } = $props();
    const { idCards, metadata } = data;

    console.log("Id cards",idCards);

    // Preload 3D card geometry once for all modals
    const cardGeometry = preloadCardGeometry();


    let searchQuery = $state('');
    let dataRows = $state(idCards);
    let errorMessage = '';
    let selectedFrontImage: string | null = $state(null);
    let selectedBackImage: string | null = $state(null);
    let downloadingCards = $state(new Set<string>());
    let deletingCards = $state(new Set<string>());
    let selectedCards = $state(new Set<string>());
    let selectedCount = $derived(selectedCards.size);

    // Create a map to store each group's selection state
    let groupSelectionStates = $state(new Map<string, boolean>());

    $effect(() => {
        const states = new Map<string, boolean>();
        Object.entries(groupedCards).forEach(([templateName, cards]) => {
            states.set(
                templateName, 
                cards.every(card => selectedCards.has(getCardId(card)))
            );
        });
        groupSelectionStates = states;
    });

    function handleCheckboxClick(event: Event, card: IDCard) {
        event.stopPropagation();
        const cardId = getCardId(card);
        if (!cardId) return;
        
        const newSelectedCards = new Set(selectedCards);
        if (newSelectedCards.has(cardId)) {
            newSelectedCards.delete(cardId);
        } else {
            newSelectedCards.add(cardId);
        }
        selectedCards = newSelectedCards;
    }

    function handleGroupCheckboxClick(event: Event, cards: IDCard[]) {
        event.stopPropagation();
        const validCards = cards.filter(card => {
            const cardId = getCardId(card);
            return !!cardId;
        });
        
        const allSelected = validCards.every(card => selectedCards.has(getCardId(card)));
        const newSelectedCards = new Set(selectedCards);
        
        validCards.forEach(card => {
            const cardId = getCardId(card);
            if (allSelected) {
                newSelectedCards.delete(cardId);
            } else {
                newSelectedCards.add(cardId);
            }
        });
        
        selectedCards = newSelectedCards;
    }

    interface SelectionState {
        isSelected: (cardId: string) => boolean;
        isGroupSelected: (cards: IDCard[]) => boolean;
        toggleSelection: (cardId: string) => void;
        toggleGroupSelection: (cards: IDCard[]) => void;
        getSelectedCount: () => number;
        clearSelection: () => void;
    }

    let isSelected = (cardId: string) => selectedCards.has(cardId);
    let isGroupSelected = (cards: IDCard[]) => {
        return cards.every(card => {
            const cardId = getCardId(card);
            return cardId && selectedCards.has(cardId);
        });
    };

    const selectionManager: SelectionState = {
        isSelected,
        isGroupSelected,
        toggleSelection: (cardId: string) => {
            if (!cardId) return;
            
            const newSelectedCards = new Set(selectedCards);
            if (newSelectedCards.has(cardId)) {
                newSelectedCards.delete(cardId);
            } else {
                newSelectedCards.add(cardId);
            }
            selectedCards = newSelectedCards;
        },
        toggleGroupSelection: (cards: IDCard[]) => {
            const validCards = cards.filter(card => {
                const cardId = getCardId(card);
                return !!cardId;
            });
            
            const allSelected = validCards.every(card => selectedCards.has(getCardId(card)));
            const newSelectedCards = new Set(selectedCards);
            
            validCards.forEach(card => {
                const cardId = getCardId(card);
                if (allSelected) {
                    newSelectedCards.delete(cardId);
                } else {
                    newSelectedCards.add(cardId);
                }
            });
            
            selectedCards = newSelectedCards;
        },
        getSelectedCount: () => selectedCards.size,
        clearSelection: () => {
            selectedCards = new Set();
        }
    };



    function getCardId(card:IDCard): string {
        const id = card.idcard_id?.toString();
        if (!id) return '';
        return id;
    }

    function getAllSelectedCards() {
        return dataRows.filter(card => selectionManager.isSelected(getCardId(card)));
    }

    async function openPreview(event: MouseEvent, card: IDCard) {
        // Don't open preview if clicking on a checkbox, button, or their containers
        const target = event.target as HTMLElement;
        if (
            target.closest('input[type="checkbox"]') ||
            target.closest('button') ||
            target.closest('.flex.items-center') ||
            target.closest('.flex.gap-2')
        ) {
            return;
        }


        console.log("Front image",card.front_image);
        console.log("Back image",card.back_image);
        selectedFrontImage = card.front_image ?? null;
        selectedBackImage = card.back_image ?? null;
    }

    function closePreview() {
        selectedFrontImage = null;
        selectedBackImage = null;
    }

    async function downloadCard(card: IDCard) {
        const cardId = getCardId(card);
        console.log('Starting download for card:', { cardId, frontImage: card.front_image, backImage: card.back_image });
        
        downloadingCards.add(cardId);
        downloadingCards = downloadingCards;

        try {
            const zip = new JSZip();
            
            const nameField = card.fields?.['Name']?.value || 
                            card.fields?.['name']?.value || 
                            card.fields?.['Full Name']?.value || 
                            `id-${cardId}`;
            
            console.log('Creating folder for:', { nameField });
            const folder = zip.folder(nameField);
            if (!folder) throw new Error('Failed to create folder');
            
            if (card.front_image) {
                const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
                console.log('Downloading front image:', { frontImageUrl });
                
                if (frontImageUrl) {
                    try {
                        const frontResponse = await fetch(frontImageUrl);
                        console.log('Front image response:', { 
                            status: frontResponse.status, 
                            ok: frontResponse.ok,
                            contentType: frontResponse.headers.get('content-type')
                        });
                        
                        if (!frontResponse.ok) {
                            throw new Error(`Failed to download front image: ${frontResponse.status} ${frontResponse.statusText}`);
                        }
                        const frontBlob = await frontResponse.blob();
                        folder.file(`${nameField}_front.jpg`, frontBlob);
                        console.log('Front image downloaded successfully');
                    } catch (frontError) {
                        console.error('Error downloading front image:', frontError);
                        throw frontError;
                    }
                }
            }

            if (card.back_image) {
                const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
                console.log('Downloading back image:', { backImageUrl });
                
                if (backImageUrl) {
                    try {
                        const backResponse = await fetch(backImageUrl);
                        console.log('Back image response:', { 
                            status: backResponse.status, 
                            ok: backResponse.ok,
                            contentType: backResponse.headers.get('content-type')
                        });
                        
                        if (!backResponse.ok) {
                            throw new Error(`Failed to download back image: ${backResponse.status} ${backResponse.statusText}`);
                        }
                        const backBlob = await backResponse.blob();
                        folder.file(`${nameField}_back.jpg`, backBlob);
                        console.log('Back image downloaded successfully');
                    } catch (backError) {
                        console.error('Error downloading back image:', backError);
                        throw backError;
                    }
                }
            }

            console.log('Generating zip file...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nameField}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log('Download completed successfully');
        } catch (error) {
            console.error('Error downloading ID card:', error);
            errorMessage = `Failed to download ID card: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
            downloadingCards.delete(cardId);
            downloadingCards = downloadingCards;
        }
    }

    async function downloadSelectedCards() {
        const selectedRows = getAllSelectedCards();
        if (selectedRows.length === 0) return;

        try {
            const zip = new JSZip();
            const nameCount = new Map<string, number>();

            // First pass: count all names
            selectedRows.forEach(card => {
                let baseName = card.fields?.['Name']?.value || 
                             card.fields?.['name']?.value || 
                             card.fields?.['Full Name']?.value || 
                             `id-${getCardId(card)}`;
                baseName = baseName.replace(/[^a-zA-Z0-9-_() ]/g, '');
                nameCount.set(baseName, (nameCount.get(baseName) || 0) + 1);
            });

            // Second pass: create folders with proper numbering
            const usedNames = new Map<string, number>();

            for (const card of selectedRows) {
                const cardId = getCardId(card);
                downloadingCards.add(cardId);
                downloadingCards = downloadingCards;

                try {
                    let baseName = card.fields?.['Name']?.value || 
                                 card.fields?.['name']?.value || 
                                 card.fields?.['Full Name']?.value || 
                                 `id-${cardId}`;

                    // Clean the name field to avoid invalid characters
                    baseName = baseName.replace(/[^a-zA-Z0-9-_() ]/g, '');

                    // Get current count for this name
                    const currentCount = usedNames.get(baseName) || 0;
                    const totalCount = nameCount.get(baseName) || 1;

                    // Generate unique name
                    let nameField = baseName;
                    if (totalCount > 1) {
                        nameField = `${baseName} (${currentCount + 1})`;
                    }
                    usedNames.set(baseName, currentCount + 1);

                    // Create folder for each card
                    const folder = zip.folder(nameField);
                    if (!folder) {
                        console.error(`Failed to create folder for ${nameField}`);
                        continue;
                    }

                    // Download front image
                    if (card.front_image) {
                        const frontImageUrl = getSupabaseStorageUrl(card.front_image, 'rendered-id-cards');
                        if (frontImageUrl) {
                            const frontResponse = await fetch(frontImageUrl);
                            if (!frontResponse.ok) {
                                console.error(`Failed to download front image for ${nameField}`);
                            } else {
                                const frontBlob = await frontResponse.blob();
                                folder.file(`${nameField}_front.jpg`, frontBlob);
                            }
                        }
                    }

                    // Download back image
                    if (card.back_image) {
                        const backImageUrl = getSupabaseStorageUrl(card.back_image, 'rendered-id-cards');
                        if (backImageUrl) {
                            const backResponse = await fetch(backImageUrl);
                            if (!backResponse.ok) {
                                console.error(`Failed to download back image for ${nameField}`);
                            } else {
                                const backBlob = await backResponse.blob();
                                folder.file(`${nameField}_back.jpg`, backBlob);
                            }
                        }
                    }
                } catch (cardError) {
                    console.error(`Error processing card ${cardId}:`, cardError);
                } finally {
                    downloadingCards.delete(cardId);
                    downloadingCards = downloadingCards;
                }
            }

            // Generate and download the zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `id-cards-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // Clear selection after successful download
            selectedCards.clear();
            selectedCards = new Set();
        } catch (error) {
            console.error('Error downloading ID cards:', error);
            errorMessage = 'Failed to download ID cards';
        }
    }

    async function handleDelete(card: IDCard) {
        const cardId = getCardId(card);
        if (!cardId) return;

        deletingCards.add(cardId);
        deletingCards = deletingCards;

        try {
            const formData = new FormData();
            formData.append('cardId', cardId);

            const response = await fetch('?/deleteCard', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete ID card');
            }

            dataRows = dataRows.filter(row => getCardId(row) !== cardId);
            selectedCards.delete(cardId);
            selectedCards = new Set(selectedCards);
        } catch (error) {
            console.error('Error deleting ID card:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to delete ID card';
        } finally {
            deletingCards.delete(cardId);
            deletingCards = deletingCards;
        }
    }

    async function deleteSelectedCards() {
        const selectedRows = getAllSelectedCards();
        if (selectedRows.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedRows.length} ID card${selectedRows.length > 1 ? 's' : ''}?`)) {
            return;
        }

        try {
            const cardIds = selectedRows.map(card => getCardId(card)).filter(Boolean);
            
            // Mark all cards as deleting
            cardIds.forEach(id => {
                deletingCards.add(id);
            });
            deletingCards = deletingCards;

            const formData = new FormData();
            formData.append('cardIds', JSON.stringify(cardIds));

            const response = await fetch('?/deleteMultiple', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete ID cards');
            }

            // Refresh the data after deletion
            window.location.reload();
        } catch (error) {
            console.error('Error deleting ID cards:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to delete ID cards';
        } finally {
            // Clear deleting states
            deletingCards = new Set();
        }
    }

    let templateFields = $derived(metadata?.templates || {});

    let groupedCards = $derived((() => {
        const groups: Record<string, IDCard[]> = {};
        dataRows.forEach(card => {
            if (!groups[card.template_name]) {
                groups[card.template_name] = [];
            }
            groups[card.template_name].push(card);
        });
        return groups;
    })());
</script>

<div class="mb-4 flex justify-between items-center">
    <input
        type="text"
        placeholder="Search..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        bind:value={searchQuery}
    />
    {#if selectedCount > 0}
        <div class="ml-4 flex gap-2">
            <button
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onclick={downloadSelectedCards}
            >
                Download Selected ({selectedCount})
            </button>
            <button
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onclick={deleteSelectedCards}
            >
                Delete Selected ({selectedCount})
            </button>
        </div>
    {/if}
</div>

{#each Object.entries(groupedCards) as [templateName, cards]}
    <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">{templateName}</h3>
        <div class="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20">
                    <tr>
                        <th scope="col" class="sticky left-0 z-30 w-16 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                            <div class="flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    checked={groupSelectionStates.get(templateName)}
                                    onchange={(e) => handleGroupCheckboxClick(e, cards)}
                                />
                            </div>
                        </th>
                        <th scope="col" class="sticky left-[57px] z-30 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</span>
                        </th>
                        {#if templateFields[templateName]}
                            {#each templateFields[templateName] || [] as field (field.variableName)}
                                <th scope="col" class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 {field.side === 'front' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-green-50/50 dark:bg-green-900/10'}">
                                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{field.variableName}</span>
                                </th>
                            {/each}
                        {/if}
                        <th scope="col" class="sticky right-0 z-30 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                    {#each cards as card}
                    <tr
                    class="group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onclick={(e) => openPreview(e, card)}
                >
                    <td class="sticky left-0 z-20 w-16 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
                        <div class="flex items-center justify-center">
                            <input
                                type="checkbox"
                                class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                checked={selectionManager.isSelected(getCardId(card))}
                                onchange={(e) => handleCheckboxClick(e, card)}
                            />
                        </div>
                    </td>
                    <td class="sticky left-[57px] z-20 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
                        <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </td>
                    {#if templateFields[templateName]}
                        {#each templateFields[templateName] || [] as field (field.variableName)}
                            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 {field.side === 'front' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-green-50/50 dark:bg-green-900/10'}">
                                {card.fields?.[field.variableName]?.value || ''}
                            </td>
                        {/each}
                    {/if}
                    <td class="sticky right-0 z-20 px-4 py-2 bg-white dark:bg-gray-900 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 flex gap-2 items-center">
                        <button
                            class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150"
                            onclick={() => downloadCard(card)}
                            disabled={downloadingCards.has(getCardId(card))}
                        >
                            {downloadingCards.has(getCardId(card)) ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                            class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-150"
                            onclick={() => handleDelete(card)}
                            disabled={deletingCards.has(getCardId(card))}
                        >
                            {deletingCards.has(getCardId(card)) ? 'Deleting...' : 'Delete'}
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
</div>
{/each}

{#if selectedFrontImage || selectedBackImage}
<ImagePreviewModal
    frontImageUrl={selectedFrontImage ? getSupabaseStorageUrl(selectedFrontImage,'rendered-id-cards') : null}
    backImageUrl={selectedBackImage ? getSupabaseStorageUrl(selectedBackImage,'rendered-id-cards') : null}
{cardGeometry}
    onClose={closePreview}
/>
{/if}