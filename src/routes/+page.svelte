<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import type { User } from '@supabase/supabase-js';

    let user: User | null = null;
    let idCards: any[] = [];
    let isLoading = true;
    let error: string | null = null;

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;

        if (user) {
            await fetchIdCards();
        }
    });

    async function fetchIdCards() {
        isLoading = true;
        error = null;

        const { data, error: fetchError } = await supabase
            .from('id_cards')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching ID cards:', fetchError);
            error = fetchError.message;
        } else {
            idCards = data || [];
        }

        isLoading = false;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString();
    }
</script>

{#if user}
    <div class="dashboard">
        <h2>ID Card Dashboard</h2>
        {#if isLoading}
            <p>Loading ID cards...</p>
        {:else if error}
            <p class="error">Error: {error}</p>
        {:else if idCards.length === 0}
            <p>No ID cards found.</p>
        {:else}
            <table>
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>ID Number</th>
                        <th>Date of Birth</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {#each idCards as card}
                        <tr>
                            <td>{card.full_name}</td>
                            <td>{card.id_number}</td>
                            <td>{formatDate(card.date_of_birth)}</td>
                            <td>{formatDate(card.created_at)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
{:else}
    <p>Please sign in to view the dashboard.</p>
{/if}

<style>
    .dashboard {
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
    .error {
        color: red;
    }
</style>