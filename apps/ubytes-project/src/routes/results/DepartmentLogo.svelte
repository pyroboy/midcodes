<script lang="ts">
    export let departmentLogoSrc: string | undefined | null = undefined; // Source for department logo
    export let mascotLogoSrc: string | undefined | null = undefined; // Source for mascot logo
    export let acronym: string; // Acronym of the department
    export let mascotName: string | null = null; // Name of the mascot
    export let size: number = 32; // Size of the logo
    export let useMascot: boolean = false; // Toggle to display mascot logo

    let imageError = false;

    // Function to generate a random background color
    function getRandomColor(text: string = ''): string {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 40%)`;
    }

    // Function to get initials based on the acronym and mascot name
    function getInitials(): string {
        const baseText = useMascot && mascotName ? `${acronym} ${mascotName}` : acronym;
        return baseText
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Reactive statement to preload images based on current sources
    $: {
        if (useMascot && mascotLogoSrc) {
            preloadImage(mascotLogoSrc);
        } else if (departmentLogoSrc) {
            preloadImage(departmentLogoSrc);
        }
    }

    // Function to preload an image and log its loading status
    function preloadImage(src: string | undefined | null) {
        if (!src) return;
        const img = new Image();
        img.src = src;
        // img.onload = () => console.log(`Image preloaded: ${src}`);
        img.onerror = () => {
            imageError = true; // Set error flag if image fails to load
            console.error(`Error loading image: ${src}`);
        };
    }

    // Reactive properties for display logic
    $: backgroundColor = getRandomColor(useMascot && mascotName ? mascotName : acronym);
    $: initials = getInitials();
    $: showPlaceholder = !((useMascot && mascotLogoSrc) || departmentLogoSrc) || imageError;

    // Log the current state of the component for debugging
    // $: console.log({
    //     useMascot,
    //     mascotLogoSrc,
    //     departmentLogoSrc,
    //     initials,
    //     showPlaceholder,
    //     imageError,
    // });
</script>

{#if showPlaceholder}
    <div
        style="width: {size}px; height: {size}px; background-color: {backgroundColor}; font-size: {size * 0.4}px;"
        class="rounded-full flex items-center justify-center text-white font-bold"
    >
        {initials}
    </div>
{:else}
    <img
        src={useMascot ? mascotLogoSrc : departmentLogoSrc}
        alt={useMascot ? `${acronym} mascot logo` : `${acronym} logo`}
        class="rounded-full object-cover"
        style="width: {size}px; height: {size}px;"
        on:error={() => {
            imageError = true; 
            console.error(`Error loading image: ${useMascot ? mascotLogoSrc : departmentLogoSrc}`);
        }} 
    />
    <!-- <p class="mt-2 text-center text-gray-600">
        Currently displaying: {useMascot ? `${acronym} mascot logo` : `${acronym} department logo`}
    </p> -->
{/if}

<!-- Feedback Text -->

