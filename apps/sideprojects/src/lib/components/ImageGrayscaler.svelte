<script lang="ts">
  let imageSrc: string | null = null;
  let isGrayscaled = false;

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        imageSrc = e.target?.result as string;
        isGrayscaled = false; // reset grayscale on new image
      };
      reader.readAsDataURL(file);
    }
  }

  function toggleGrayscale() {
    isGrayscaled = !isGrayscaled;
  }
</script>

<div class="flex flex-col items-center gap-4">
  <!-- Image Input with dark styling -->
  <input 
    type="file" 
    accept="image/*" 
    on:change={handleFileChange}
    class="bg-gray-800 text-white border border-gray-700 p-2 rounded"
  />

  {#if imageSrc}
    <!-- Preview Image with conditional grayscale -->
    <img
      src={imageSrc}
      alt="User uploaded content"
      class="w-full h-auto max-w-md"
      style="filter: {isGrayscaled ? 'grayscale(100%)' : 'none'};"
    />

    <!-- Toggle Grayscale / Undo Grayscale Button -->
    <button 
      class="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      on:click={toggleGrayscale}
    >
      {isGrayscaled ? 'Undo Grayscale' : 'Grayscale Image'}
    </button>
  {/if}
</div>
