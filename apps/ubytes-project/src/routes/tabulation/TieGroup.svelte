<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { cn } from "$lib/utils";
    import { tieGroupsValidation } from "./schema";
    
    export let value: string = "";
    export let onChange: (value: string) => void;
    export let disabled = false;
    export let error: string[] | undefined = undefined;
    export let rankings: Array<{
        rank: number;
        department_id: number | null;
        tie_group: number | null;
    }> | undefined = undefined;

    let validationError = "";
    let previousValue = value;
    let affectedRanks = new Set<number>();
    
    // Debounce function to prevent too many validations
    function debounce<T extends (...args: any[]) => any>(
        fn: T,
        ms: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), ms);
        };
    }
    
    function validateAndUpdate(input: string) {
        console.log("Validating input:", input);
        
        // If input is empty, clear validation error and update form
        if (!input.trim()) {
            console.log("Empty input - clearing validation");
            validationError = "";
            affectedRanks.clear();
            onChange("");
            return;
        }

        // Calculate max rank from valid rankings
        const validRanks = rankings?.filter(r => r.department_id !== null && r.department_id !== -1) ?? [];
        const maxRank = validRanks.length;
        console.log("Max rank:", maxRank);

        try {
            // Basic format validation
            const formatRegex = /^\d+-\d+(\s*,\s*\d+-\d+)*$/;
            if (!formatRegex.test(input)) {
                console.log("Format validation failed");
                validationError = "Use format like '1-3, 4-6' (ranges separated by comma)";
                return;
            }

            // Reset affected ranks
            affectedRanks.clear();
            let maxRankExceeded = false;

            // Validate groups
            const groups = input.split(",").map(g => g.trim());
            console.log("Validating groups:", groups);

            for (const group of groups) {
                const [start, end] = group.split("-").map(Number);
                console.log(`Checking group ${start}-${end} against max rank ${maxRank}`);
                
                if (end > maxRank) {
                    console.log(`Max rank exceeded: ${end} > ${maxRank}`);
                    maxRankExceeded = true;
                    for (let i = start; i <= end; i++) {
                        affectedRanks.add(i);
                    }
                }
            }

            if (maxRankExceeded) {
                console.log("Setting max rank error");
                validationError = `Tie groups cannot exceed maximum rank of ${maxRank}`;
                return;
            }

            // Zod validation
            console.log("Running Zod validation");
            const result = tieGroupsValidation.safeParse(input);
            console.log("Zod validation result:", result);
            
            validationError = result.success ? "" : result.error.errors[0].message;
            
            if (result.success) {
                console.log("Validation passed - updating value");
                previousValue = input;
                onChange(input);
                affectedRanks.clear();
            }
        } catch (error) {
            console.error("Validation error:", error);
            validationError = "Invalid input format";
        }
    }
    
    const debouncedValidate = debounce(validateAndUpdate, 300);
    
    function handleInput(event: Event) {
        const input = (event.target as HTMLInputElement).value;
        console.log("Input event:", input);
        debouncedValidate(input);
    }
    
    // Only validate when necessary
    let lastRankingsLength = 0;
    $: if (rankings) {
        const currentLength = rankings.filter(r => r.department_id !== null && r.department_id !== -1).length;
        if (currentLength !== lastRankingsLength) {
            console.log("Rankings changed:", currentLength);
            lastRankingsLength = currentLength;
            if (value.trim()) {
                debouncedValidate(value);
            }
        }
    }

    $: inputClass = cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        (error || validationError) && "ring-2 ring-destructive border-destructive"
    );

    // Dispatch affected ranks only when they change
    $: if (affectedRanks.size > 0) {
        console.log("Dispatching affected ranks:", Array.from(affectedRanks));
        dispatchEvent(new CustomEvent('affectedranks', {
            detail: Array.from(affectedRanks)
        }));
    }
</script>

<div class="flex flex-col gap-2">
    <Label for="tieGroups">Tie Groups</Label>
    <div class="relative">
        <Input
            id="tieGroups"
            type="text"
            value={value}
            {disabled}
            placeholder="e.g., 2-5, 7-9 for tied rankings"
            on:input={handleInput}
            class={inputClass}
        />
    </div>
    {#if error || validationError}
        <span class="text-sm text-destructive">{error || validationError}</span>
    {/if}
</div>