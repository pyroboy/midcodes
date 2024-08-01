<script lang="ts">
    import { Loader } from 'lucide-svelte';
   import { onMount ,createEventDispatcher} from 'svelte';
   import { page } from '$app/stores';
   import { supabase } from '$lib/supabaseClient';
   import type { TemplateData, TemplateElement } from '../../../stores/templateStore';
   import IdCanvas from '$lib/IdCanvas.svelte';
   import { Button } from "$lib/components/ui/button";
   import { Card } from "$lib/components/ui/card";
   import { Input } from "$lib/components/ui/input";
   import { Label } from "$lib/components/ui/label";
   import { darkMode } from '../../../stores/darkMode';
   import { Switch } from "$lib/components/ui/switch";
   import { onDestroy } from 'svelte';
   import ThumbnailInput from '$lib/ThumbnailInput.svelte';
import ErrorBoundary from '$lib/ErrorBoundary.svelte';
import { browser } from '$app/environment';
   let frontCanvasComponent: IdCanvas;
   let backCanvasComponent: IdCanvas;
   let isSaving = false;
   let debugMessages: string[] = [];

   const dispatch = createEventDispatcher();

   onMount(async () => {
    if (browser) {
        const templateId = $page.params.id;
        await fetchTemplate(templateId);
        
        // Wait for both canvases to be mounted
        await Promise.all([
            new Promise(resolve => frontCanvasComponent.$on('mounted', resolve)),
            new Promise(resolve => backCanvasComponent.$on('mounted', resolve))
        ]);

        console.log('Front canvas:', frontCanvasComponent?.canvas);
        console.log('Front hidden canvas:', frontCanvasComponent?.hiddenCanvas);
        console.log('Back canvas:', backCanvasComponent?.canvas);
        console.log('Back hidden canvas:', backCanvasComponent?.hiddenCanvas);

        // Only call saveIdCard if canvases are properly initialized
        if (frontCanvasComponent?.canvas && frontCanvasComponent?.hiddenCanvas &&
            backCanvasComponent?.canvas && backCanvasComponent?.hiddenCanvas) {
            saveIdCard();
        } else {
            console.error('Canvas components not properly initialized');
        }
    }
});


function handleImageUpdate(event: CustomEvent, variableName: string) {
       const { scale, x, y } = event.detail;
       imagePositions[variableName] = {
           ...imagePositions[variableName],
           scale,
           x,
           y
       };
   }
   function handleSelectFile(variableName: string) {
       const input = document.createElement('input');
       input.type = 'file';
       input.accept = 'image/*';
       input.onchange = (e) => handleFileUpload(e, variableName);
       input.click();
   }
onDestroy(() => {
   Object.values(cachedFileUrls).forEach(URL.revokeObjectURL);
});

   function handleToggle(checked: boolean) {
       darkMode.set(checked);
   }
   let cachedFileUrls: {[key: string]: string} = {};

function createAndCacheFileUrl(file: File, variableName: string) {
   if (cachedFileUrls[variableName]) {
       URL.revokeObjectURL(cachedFileUrls[variableName]);
   }
   const url = URL.createObjectURL(file);
   cachedFileUrls[variableName] = url;
   return url;
}

   let template: TemplateData | null = null;
   let formData: {[key: string]: string} = {};
   let fileUploads: {[key: string]: File | null} = {};
   let imagePositions: {[key: string]: {x: number, y: number, width: number, height: number, scale: number}} = {};
   let errorMessage = '';
   
   let MOUSE_MOVING = false;
   let fullResolution = false;
   
//    onMount(async () => {
//        const templateId = $page.params.id;
//        await fetchTemplate(templateId);
//    });

onMount(async () => {

    const templateId = $page.params.id;
    await fetchTemplate(templateId);
  await new Promise(resolve => {
    frontCanvasComponent.$on('mounted', resolve);
    backCanvasComponent.$on('mounted', resolve);
  });

  // Now you can call saveIdCard safely
  saveIdCard();
});
   
   async function fetchTemplate(id: string) {
       try {
           const { data, error } = await supabase
               .from('templates')
               .select('*')
               .eq('id', id)
               .single();
   
           if (error) throw error;
   
           template = data as TemplateData;
           initializeFormData();
           console.log('Template fetched:', template);
       } catch (error) {
           console.error('Error fetching template:', error);
           errorMessage = 'Failed to load template';
       }
   }
   

   function initializeFormData() {
       if (template) {
           template.template_elements.forEach(el => {
               if (el.type === 'text') {
                   formData[el.variableName] = el.content || '';
               } else {
                   fileUploads[el.variableName] = null;
                   imagePositions[el.variableName] = {
                       x: 0,
                       y: 0,
                       width: el.width || 100,
                       height: el.height || 100,
                       scale: 1
                   };
               }
           });
       }
   }
   
   function handleFileUpload(event: Event, variableName: string) {
   const input = event.target as HTMLInputElement;
   if (input.files && input.files.length > 0) {
       const file = input.files[0];
       fileUploads[variableName] = file;
       formData[variableName] = file.name;
       createAndCacheFileUrl(file, variableName);
   }
}
   
async function saveIdCard() {
    if (!template) {
        console.error("Template not loaded");
        addDebugMessage("Error: Template not loaded");
        errorMessage = "Template not loaded";
        return;
    }

    isSaving = true;
    debugMessages = [];
    addDebugMessage("Starting saveIdCard function");

    try {
        // Check if canvas components are initialized
        if (!frontCanvasComponent || !backCanvasComponent) {
            throw new Error('Canvas components are not initialized');
        }

        addDebugMessage("Rendering full resolution canvases");
        console.log('Front component:', frontCanvasComponent);
        console.log('Back component:', backCanvasComponent);

        // Render full resolution canvases and get blobs
        const [frontBlob, backBlob] = await Promise.all([
            frontCanvasComponent.renderFullResolution(),
            backCanvasComponent.renderFullResolution()
        ]);

        addDebugMessage("Full resolution canvases rendered");

        if (!frontBlob || !backBlob) {
            throw new Error('Failed to create blobs from canvases');
        }

        addDebugMessage("Blobs created successfully");

        // Generate unique filenames
        const timestamp = Date.now();
        const frontFilename =  `front_${template.id}_${timestamp}.png`;
        const backFilename = `back_${template.id}_${timestamp}.png`;

        // Upload images to storage
        addDebugMessage("Uploading images to storage");
        const frontUpload = await uploadToStorage('rendered-id-cards', frontFilename, frontBlob);
        const backUpload = await uploadToStorage('rendered-id-cards', backFilename, backBlob);

        addDebugMessage("Images uploaded successfully");

        // Prepare data for saving
        const savedData = {
           ... formData,
            imagePositions,
            fileUploads: Object.fromEntries(
                Object.entries(fileUploads).map(([key, file]) => [key, file ? file.name : null])
            )
        };

        console.log("Data to be saved:", JSON.stringify(savedData, null, 2));
        addDebugMessage(`Form Data: ${JSON.stringify(formData)}`);
        addDebugMessage(`Image Positions: ${JSON.stringify(imagePositions)}`);
        addDebugMessage(`File Uploads: ${JSON.stringify(savedData.fileUploads)}`);

        // Save record to database
        const { data, error } = await supabase
            .from('idcards')
            .insert({
                template_id: template.id,
                front_image: frontUpload,
                back_image: backUpload,
                data: JSON.stringify(savedData),
    
            });

        if (error) throw error;

        console.log("Database insert response:", data);
        addDebugMessage('ID card saved successfully');
        alert('ID card saved successfully!');
    } catch (error) {
        console.error('Error saving ID card:', error);
        errorMessage = `Failed to save ID card: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        addDebugMessage(errorMessage);
    } finally {
        isSaving = false;
    }
}
function addDebugMessage(message: string) {
    console.log(message); // Also log to console for easier debugging
    debugMessages = [...debugMessages, message];
}

   async function uploadToStorage(bucket: string, filename: string, file: Blob): Promise<string> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) throw error;
    return data.path;
}

</script>

<div class="container mx-auto p-4 flex flex-col md:flex-row gap-4">
    <div class="w-full md:w-1/2">
        <Card class="h-full">
            <div class="p-4">
                <h2 class="text-2xl font-bold mb-4">ID Card Preview</h2>
                <div class="canvas-wrapper" class:landscape={template?.orientation === 'landscape'} class:portrait={template?.orientation === 'portrait'}>
                    <ErrorBoundary>
                        <div class="front-canvas">
                            <h3 class="text-lg font-semibold mb-2">Front</h3>
                            {#if template}
                                <IdCanvas
                                    bind:this={frontCanvasComponent}
                                    elements={template.template_elements.filter(el => el.side === 'front')}
                                    backgroundUrl={template.front_background}
                                    {formData}
                                    {fileUploads}
                                    {imagePositions}
                                    {fullResolution}
                                    on:rendered={() => console.log('Front canvas rendered')}
                                />
                            {/if}
                        </div>
                    </ErrorBoundary>
                    <ErrorBoundary>
                        <div class="back-canvas">
                            <h3 class="text-lg font-semibold mb-2">Back</h3>
                            {#if template && !MOUSE_MOVING}
                                <IdCanvas
                                    bind:this={backCanvasComponent}
                                    elements={template.template_elements.filter(el => el.side === 'back')}
                                    backgroundUrl={template.back_background}
                                    {formData}
                                    {fileUploads}
                                    {imagePositions}
                                    {fullResolution}
                                    on:rendered={() => console.log('Back canvas rendered')}
                                />
                            {/if}
                        </div>
                    </ErrorBoundary>
                </div>
            </div>
        </Card>
    </div>
   <div class="w-full md:w-1/2">
       <Card class="h-full">
           <div class="p-6">
 <div class="flex justify-between items-center mb-4">
   <h2 class="text-2xl font-bold">ID Card Form</h2>
   <Switch 
       checked={$darkMode} 
       onCheckedChange={handleToggle}
   >
       <span class="sr-only">Toggle dark mode</span>
       <span aria-hidden="true">{$darkMode ? '🌙' : '☀️'}</span>
   </Switch>
</div>

               <p class="text-muted-foreground mb-6">Please fill out these details for your ID card.</p>
               {#if template}
               <form on:submit|preventDefault={saveIdCard} class="space-y-4">
                   {#each template.template_elements as element (element.variableName)}
                       <div class="grid grid-cols-[auto,1fr] gap-4 items-center">
                           <Label for={element.variableName} class="text-base whitespace-nowrap">
                               {element.variableName}:
                           </Label>
                           {#if element.type === 'text'}
                               <Input 
                                   type="text"
                                   id={element.variableName}
                                   bind:value={formData[element.variableName]}
                                   class="bg-muted"
                               />
                           {:else if element.type === 'photo' || element.type === 'signature'}
                           <ThumbnailInput
                           width={element.width || 100}
                           height={element.height || 100}
                           fileUrl={cachedFileUrls[element.variableName]}
                           initialScale={imagePositions[element.variableName].scale}
                           initialX={imagePositions[element.variableName].x}
                           initialY={imagePositions[element.variableName].y}
                           isSignature={element.type === 'signature'}
                           on:selectFile={() => handleSelectFile(element.variableName)}
                           on:update={(e) => handleImageUpdate(e, element.variableName)}
                       />
                           {/if}
                       </div>
                   {/each}
                   <Button type="submit" class="w-full mt-6" on:click={saveIdCard} disabled={isSaving}>
                       {#if isSaving}
                           <Loader class="mr-2 h-4 w-4 animate-spin" />
                       {/if}
                       Generate and Save ID Card
                   </Button>
                   {#if debugMessages.length > 0}
                       <div class="mt-4 p-2 bg-gray-100 rounded">
                           <h4 class="font-semibold">Debug Messages:</h4>
                           <ul class="list-disc pl-5">
                               {#each debugMessages as message}
                                   <li>{message}</li>
                               {/each}
                           </ul>
                       </div>
                   {/if}
               </form>
               {/if}
       
           </div>
       </Card>
   </div>
</div>

<style>
   :global(.dark) {
       color-scheme: dark;
   }
   .canvas-wrapper {
       display: flex;
       gap: 20px;
   }
   .canvas-wrapper.landscape {
       flex-direction: column;
   }
   .canvas-wrapper.portrait {
       flex-direction: row;
   }
</style>