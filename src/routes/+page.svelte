<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import html2canvas from 'html2canvas';
    import EasyCrop from 'svelte-easy-crop';
    import type { User } from '@supabase/supabase-js';
    
    let user: User | null = null;
    let fullName = '';
    let dateOfBirth = '';
    let idNumber = '';
    
    let photoFile: string | null = null;
    let signatureFile: string | null = null;
    let croppedPhoto: string | null = null;
    let croppedSignature: string | null = null;
    
    let frontCard: HTMLElement;
    let backCard: HTMLElement;
    
    let crop = { x: 0, y: 0 };
    let zoom = 1;
    let aspect = 4 / 5;
    
    let template: any = null;
    
    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
    
        if (user) {
            loadTemplate();
        }
    });
    
    async function loadTemplate() {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .limit(1)
            .single();
    
        if (error) {
            console.error('Error loading template:', error);
            return;
        }
    
        template = data ? JSON.parse(data.template) : null;
    }
    
    function handlePhotoChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                photoFile = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }
    
    function handleSignatureChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                signatureFile = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }
    
    async function generateAndSaveIdCard() {
        if (!frontCard || !backCard || !user) return;
    
        const frontImage = await html2canvas(frontCard);
        const backImage = await html2canvas(backCard);
    
        const { data, error } = await supabase
            .from('id_cards')
            .insert([
                {
                    user_id: user.id,
                    full_name: fullName,
                    date_of_birth: dateOfBirth,
                    id_number: idNumber,
                    front_image: frontImage.toDataURL(),
                    back_image: backImage.toDataURL(),
                }
            ]);
    
        if (error) {
            alert('Error saving ID card: ' + error.message);
        } else {
            alert('ID card saved successfully!');
        }
    }
    </script>
    
    {#if user}
        <div class="id-generator">
            <h2>Generate ID Card</h2>
            <div class="form-container">
                <input type="text" bind:value={fullName} placeholder="Full Name">
                <input type="date" bind:value={dateOfBirth} placeholder="Date of Birth">
                <input type="text" bind:value={idNumber} placeholder="ID Number">
                <input type="file" on:change={handlePhotoChange} accept="image/*">
                <input type="file" on:change={handleSignatureChange} accept="image/*">
                <button on:click={generateAndSaveIdCard}>Generate and Save ID Card</button>
            </div>
            <div class="preview-container">
                <h3>ID Card Preview</h3>
                <div class="id-card id-front" bind:this={frontCard}>
                    <!-- ... (keep the existing front card preview structure) -->
                </div>
                <div class="id-card id-back" bind:this={backCard}>
                    <!-- ... (keep the existing back card preview structure) -->
                </div>
            </div>
        </div>
    {:else}
        <p>Please sign in to generate ID cards.</p>
    {/if}
    
    <style>
    /* ... (keep the existing styles) */
    </style>