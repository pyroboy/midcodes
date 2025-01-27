<script lang="ts">
    import { writable, type Writable } from 'svelte/store';
    import type { PageData } from './$types';
    import { superForm } from 'sveltekit-superforms/client';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';
    import { fly, fade, slide } from 'svelte/transition';
    import { Loader2 } from 'lucide-svelte';
    import ImageUpload from './ImageUpload.svelte';
    import { toast, Toaster } from 'svelte-french-toast';
    import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import SupabaseImage from '$lib/components/SupabaseImage.svelte';
    export let data: PageData;

    interface Department {
        id: number;
        department_name: string;
        department_acronym: string;
        department_logo: string | null;
        mascot_name: string;
        mascot_logo: string | null;
        updated_at: string;
    }

    let isSubmitting = false;
    let departments: Writable<Department[]> = writable([]);
    const showDeleteModal = writable(false);
    let departmentToDelete: Department | null = null;
    let deleteError: string | null = null;

    function openDeleteModal(department: Department) {
        departmentToDelete = department;
        deleteError = null;
        showDeleteModal.set(true);
    }

    function closeDeleteModal() {
        showDeleteModal.set(false);
        departmentToDelete = null;
        deleteError = null;
    }

    $: {
        if (data.departments) {
            const sortedDepartments = [...data.departments].sort((a, b) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
            departments.set(sortedDepartments);
        }
    }

    const { form, errors, enhance, reset } = superForm(data.form, {
        resetForm: false,
        onSubmit: ({ formData, cancel }) => {
            isSubmitting = true;

            if ($form.department_logo === null) {
                formData.append('removeDepartmentLogo', 'true');
            }
            if ($form.mascot_logo === null) {
                formData.append('removeMascotLogo', 'true');
            }

            if (editingDepartment) {
                if ($form.department_logo === editingDepartment.department_logo && editingDepartment.department_logo) {
                    formData.append('keepDepartmentLogo', 'true');
                    formData.append('currentDepartmentLogo', editingDepartment.department_logo);
                }
                if ($form.mascot_logo === editingDepartment.mascot_logo && editingDepartment.mascot_logo) {
                    formData.append('keepMascotLogo', 'true');
                    formData.append('currentMascotLogo', editingDepartment.mascot_logo);
                }
            }

            const fileInputs = [
                { id: '#imageFile', name: 'Department Logo' },
                { id: '#mascotImageFile', name: 'Spirit Animal Image' }
            ];

            for (const input of fileInputs) {
                const fileInput = document.querySelector(input.id) as HTMLInputElement;
                const file = fileInput?.files?.[0];
                
                if (file) {
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                        toast.error(`${input.name} must be less than 5MB`, {
                            position: 'top-right',
                        });
                        isSubmitting = false;
                        cancel();
                        return;
                    }
                    
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(file.type)) {
                        toast.error(`Invalid file type for ${input.name}. Use JPG, PNG, or WebP`, {
                            position: 'top-right',
                        });
                        isSubmitting = false;
                        cancel();
                        return;
                    }
                }
            }
        },
        onResult: ({ result }) => {
            isSubmitting = false;
            
            if (result.type === 'success') {
                toast.success(
                    editingDepartment ? 'Department updated successfully' : 'Department updated successfully',
                    { position: 'top-right' }
                );
                editingDepartment = null;
                invalidate('departments');
            } else if (result.type === 'error') {
                toast.error('Operation failed. Please try again.', {
                    position: 'top-right',
                });
            }
        },
        onError: (err) => {
            isSubmitting = false;
            toast.error('An error occurred. Please try again.', {
                position: 'top-right',
            });
        },
        taintedMessage: null
    });

    let editingDepartment: Department | null = null;

    function editDepartment(department: Department) {
        editingDepartment = {
            ...department,
            department_logo: department.department_logo,
            mascot_logo: department.mascot_logo
        };
        $form = {
            ...department,
            department_logo: department.department_logo,
            mascot_logo: department.mascot_logo
        };
    }

    function cancelEdit() {
        editingDepartment = null;
        reset();
    }

    function handleImageChange(
        event: CustomEvent<{ 
            file: File | null; 
            previewUrl: string | null; 
            name: string | null 
        }>,
        field: 'department_logo' | 'mascot_logo'
    ) {
        if (!event.detail.file && !event.detail.previewUrl) {
            $form[field] = null;
            return;
        }
        
        if (event.detail.file) {
            $form[field] = event.detail.previewUrl;
            return;
        }
        
        if (editingDepartment?.[field]?.startsWith('https://')) {
            $form[field] = editingDepartment[field];
            return;
        }
        
        $form[field] = null;
    }

    async function handleDelete() {
        if (!departmentToDelete) return;

        try {
            isSubmitting = true;
            const formData = new FormData();
            formData.append('id', departmentToDelete.id.toString());

            const loadingToast = toast.loading('Deleting department...', {
                position: 'top-right'
            });

            const response = await fetch('?/delete', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                departments.update(deps => deps.filter(d => d.id !== departmentToDelete?.id));
                await invalidate('departments');
                toast.success('Department deleted successfully', {
                    position: 'top-right',
                });
                closeDeleteModal();
            } else {
                const errorData = await response.text();
                deleteError = errorData || 'Failed to delete department';
                toast.error(`Failed to delete: ${errorData || response.statusText}`, {
                    position: 'top-right',
                });
            }
            toast.dismiss(loadingToast);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            deleteError = errorMessage;
            toast.error(`Error: ${errorMessage}`, {
                position: 'top-right',
            });
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="container mx-auto p-4">
    <Card class="mb-8">
        <CardHeader>
            <CardTitle>Departments Management</CardTitle>
        </CardHeader>
        <CardContent>
            <form method="POST" use:enhance enctype="multipart/form-data">
                <div class="grid grid-cols-2 gap-4 space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <ImageUpload
                            initialImage={$form.department_logo}
                            name="imageFile"
                            id="department-logo-upload"
                            label="Department Logo"
                            on:change={(event) => handleImageChange(event, 'department_logo')}
                        />

                        <ImageUpload
                            initialImage={$form.mascot_logo}
                            name="mascotImageFile"
                            id="mascot-logo-upload"
                            label="Mascot Logo"
                            on:change={(event) => handleImageChange(event, 'mascot_logo')}
                        />
                    </div>
                
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Label for="department_name">Department Name</Label>
                            <Input 
                                id="department_name" 
                                name="department_name" 
                                bind:value={$form.department_name}
                            />
                            {#if $errors.department_name}
                                <span class="text-red-500 text-sm" transition:fade|local>
                                    {$errors.department_name}
                                </span>
                            {/if}
                        </div>
                
                        <div class="space-y-2">
                            <Label for="department_acronym">Department Acronym</Label>
                            <Input 
                                id="department_acronym" 
                                name="department_acronym" 
                                bind:value={$form.department_acronym}
                            />
                            {#if $errors.department_acronym}
                                <span class="text-red-500 text-sm" transition:fade|local>
                                    {$errors.department_acronym}
                                </span>
                            {/if}
                        </div>
                
                        <div class="space-y-2">
                            <Label for="mascot_name">Spirit Animal (plural)</Label>
                            <Input 
                                id="mascot_name" 
                                name="mascot_name" 
                                bind:value={$form.mascot_name}
                            />
                            {#if $errors.mascot_name}
                                <span class="text-red-500 text-sm" transition:fade|local>
                                    {$errors.mascot_name}
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>

                {#if editingDepartment}
                    <input type="hidden" name="id" value={editingDepartment.id} />
                {/if}
                
                <div class="flex space-x-2 mt-4">
                    <Button type="submit" 
                            formaction={editingDepartment ? "?/update" : "?/create"}
                            disabled={isSubmitting}>
                        {#if isSubmitting}
                            <Loader2 class="h-4 w-4 animate-spin mr-2" />
                            {editingDepartment ? 'Updating...' : 'Creating...'}
                        {:else}
                            {editingDepartment ? 'Update Department' : 'Create Department'}
                        {/if}
                    </Button>
                    
                    {#if editingDepartment}
                        <Button type="button" variant="outline" on:click={cancelEdit}>
                            Cancel
                        </Button>
                    {/if}
                </div>
            </form>
        </CardContent>
    </Card>

    <Card>
        <CardHeader>
            <CardTitle>Department List</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th class="text-left p-2">Logo</th>
                            <th class="text-left p-2">Spirit Animal Image</th>
                            <th class="text-left p-2">Department Name</th>
                            <th class="text-left p-2">Acronym</th>
                            <th class="text-left p-2">Spirit Animal</th>
                            <th class="text-left p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $departments as department (department.id)}
                            <tr class="border-b last:border-b-0">
                                <td class="p-2">
                                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                        {#if department.department_logo}
                                        <SupabaseImage
                                        bucket="department-logos"
                                        imageUrl={department.department_logo}
                                        label="Department Logo"
                                        width={77}
                                        height={77}
                                        quality={67}
                                    />
                                        {:else}
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-sm text-gray-500">LOGO</span>
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                                <td class="p-2">
                                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                        {#if department.mascot_logo}

                                        <SupabaseImage
                                        bucket="mascot-logos"
                                        imageUrl={department.mascot_logo}
                                        label={department.mascot_name}
                                        width={77}
                                        height={77}
                                        quality={67}
                                    />
                                  
                                        {:else}
                                            <div class="w-full h-full flex items-center justify-center">
                                                <span class="text-sm text-gray-500">MASCOT</span>
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                                <td class="p-2">{department.department_name}</td>
                                <td class="p-2">{department.department_acronym}</td>
                                <td class="p-2">{department.mascot_name}</td>
                                <td class="p-2">
                                    <div class="flex space-x-2">
                                        <Button 
                                            on:click={() => editDepartment(department)} 
                                            variant="outline" 
                                            size="sm"
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            on:click={() => openDeleteModal(department)} 
                                            variant="destructive" 
                                            size="sm"
                                            disabled={isSubmitting}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
</div>

{#if $showDeleteModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         transition:fade={{ duration: 200 }}>
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full m-4" 
             transition:slide={{ duration: 200 }}>
            <h2 class="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p class="text-gray-700 mb-4">
                Are you sure you want to delete the department "{departmentToDelete?.department_name}"? 
                This action cannot be undone.
            </p>
            
            {#if deleteError}
                <div class="bg-red-50 text-red-500 p-3 rounded-md mb-4" transition:fade|local>
                    {deleteError}
                </div>
            {/if}
            
            <div class="flex justify-end space-x-2">
                <Button 
                    variant="outline" 
                    on:click={closeDeleteModal}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    on:click={handleDelete}
                    disabled={isSubmitting}
                >
                    {#if isSubmitting}
                        <Loader2 class="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                    {:else}
                        Delete Department
                    {/if}
                </Button>
            </div>
        </div>
    </div>
{/if}

<SuperDebug data={$form} />
<Toaster />

<style>
    :global(.animate-spin) {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>