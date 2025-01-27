<script lang="ts">
    import SearchableCombobox from './SerchableCombobox.svelte';
    import type { DepartmentItem, Ranking } from './types';
    import { slide} from 'svelte/transition';
    import {  quartOut, elasticOut } from 'svelte/easing';
    import { onDestroy } from 'svelte';
    
    interface TieRange {
        start: number;
        end: number;
        groupIndex: number;
        newRank: number;
    }
    
    interface GroupStyle {
        primary: string;
        text: string;
    }
    
    interface LayoutMetrics {
        rowHeight: number;
        circleRadius: number;
        circlePadding: number;
        markerWidth: number;
        horizontalPadding: number;
        verticalPadding: number;
        contentOffset: number;
        circleLeftOffset: number;
    }
    
    export let rankings: Ranking[] = [];
    export let tieGroups: string = "";
    export let getAvailableDepartments: (index: number) => DepartmentItem[];
    export let onDepartmentSelect: (index: number, departmentId: string) => void;
    export let isDisabled: boolean = false;
    export let affectedRankings: Set<number>;
    
    let activeIndex: number | null = null;
    let rankingsContainer: HTMLElement;
    let previousTieGroups = new Map<number, number | null>();
    let showMergedRankings = false;
    let lastTieGroups = "";
    let calculatedRanks: Map<number, number> = new Map();
    let isTieGroupInputFocused = false;
    let isInitialLoad = true;
    let mergeTimeout: number | null = null;

    const LAYOUT: LayoutMetrics = {
        rowHeight: 45,
        circleRadius: 20,
        circlePadding: 16,
        markerWidth: 46,
        horizontalPadding: 24,
        verticalPadding: 0,
        contentOffset: 32,
        circleLeftOffset: 3
    };

    const ANIMATION = {
        initial: { duration: 400, easing: quartOut, delay: 50 },
        merge: { duration: 500, easing: elasticOut, delay: 200, stagger: 50 }
    };
    
    const GROUP_COLORS = {
        even: { primary: 'rgb(59, 130, 246)', text: 'rgb(29, 78, 216)' },
        odd: { primary: 'rgb(99, 102, 241)', text: 'rgb(67, 56, 202)' }
    } as const;

    function handleTieGroupFocus() {
        isTieGroupInputFocused = true;
        isInitialLoad = false;
    }

    function handleTieGroupBlur() {
        isTieGroupInputFocused = false;
    }

    function calculateNewRanks(tieRanges: TieRange[], totalRankings: number): Map<number, number> {
        const newRanks = new Map<number, number>();
        let currentNewRank = 1;
        let currentPosition = 1;

        while (currentPosition <= totalRankings) {
            const tieGroup = tieRanges.find(range => 
                currentPosition >= range.start && currentPosition <= range.end
            );

            if (tieGroup) {
                for (let i = tieGroup.start; i <= tieGroup.end; i++) {
                    newRanks.set(i, currentNewRank);
                }
                currentPosition = tieGroup.end + 1;
                currentNewRank++;
            } else {
                newRanks.set(currentPosition, currentNewRank);
                currentPosition++;
                currentNewRank++;
            }
        }

        return newRanks;
    }
    
    function parseTieGroups(tieGroupsStr: string): TieRange[] {
        if (!tieGroupsStr.trim()) return [];
        
        const ranges = tieGroupsStr.split(',')
            .map((group, index) => {
                const [start, end] = group.trim().split('-').map(Number);
                if (isNaN(start) || isNaN(end)) return null;
                return { start, end, groupIndex: index, newRank: 0 };
            })
            .filter((range): range is TieRange => range !== null);

        return ranges;
    }

    function calculatePositions(index: number) {
        const baseY = index * LAYOUT.rowHeight;
        const centerY = baseY + (LAYOUT.rowHeight / 2);
        const circleX = LAYOUT.horizontalPadding + LAYOUT.circleLeftOffset + LAYOUT.circleRadius;
        
        return {
            row: { top: baseY, height: LAYOUT.rowHeight },
            circle: { cx: circleX, cy: centerY, r: LAYOUT.circleRadius },
            content: {
                left: circleX + LAYOUT.circleRadius + LAYOUT.contentOffset,
                centerY,
                right: LAYOUT.horizontalPadding
            }
        };
    }

    function calculateMergedPosition(tieGroup: TieRange) {
        const startIndex = tieGroup.start - 1;
        const endIndex = tieGroup.end - 1;
        const midY = (startIndex + endIndex) / 2 * LAYOUT.rowHeight + LAYOUT.rowHeight / 2;
        const circleX = LAYOUT.horizontalPadding + LAYOUT.circleLeftOffset + LAYOUT.circleRadius;
        
        return {
            circle: { cx: circleX, cy: midY, r: LAYOUT.circleRadius },
            row: { top: 0, height: LAYOUT.rowHeight },
            content: {
                left: circleX + LAYOUT.circleRadius + LAYOUT.contentOffset,
                centerY: midY,
                right: LAYOUT.horizontalPadding
            }
        };
    }

    function getTieGroupForRank(rank: number, tieRanges: TieRange[]): TieRange | null {
        return tieRanges.find(range => rank >= range.start && rank <= range.end) || null;
    }
    
    function getGroupStyles(groupIndex: number): GroupStyle {
        return groupIndex % 2 === 0 ? GROUP_COLORS.even : GROUP_COLORS.odd;
    }
    
    function getRectHeight(start: number, end: number): number {
        return (end - start + 1) * LAYOUT.rowHeight - LAYOUT.verticalPadding * 2;
    }
    
    function handleComboboxStateChange(index: number, isOpen: boolean) {
        activeIndex = isOpen ? index : null;
    }

    function getTransitionParams(index: number, isNew: boolean) {
        return {
            duration: ANIMATION.initial.duration,
            easing: ANIMATION.initial.easing,
            delay: isNew ? index * ANIMATION.initial.delay : 0
        };
    }

    function getMergeTransitionParams(index: number, tieGroup: TieRange | null) {
        if (!tieGroup || !isTieGroupInputFocused) return null;
        const position = index - (tieGroup.start - 1);
        return {
            duration: ANIMATION.merge.duration,
            easing: ANIMATION.merge.easing,
            delay: ANIMATION.merge.delay + (position * ANIMATION.merge.stagger)
        };
    }

    function updateRankings(newTieGroups: string) {
        const ranges = parseTieGroups(newTieGroups);
        calculatedRanks = calculateNewRanks(ranges, rankings.length);
        
        if (isInitialLoad) {
            showMergedRankings = true;
            isInitialLoad = false;
            return;
        }

        if (isTieGroupInputFocused) {
            showMergedRankings = false;
            if (mergeTimeout) {
                clearTimeout(mergeTimeout);
            }
            mergeTimeout = window.setTimeout(() => {
                showMergedRankings = true;
                mergeTimeout = null;
            }, ANIMATION.merge.delay);
        } else {
            showMergedRankings = true;
        }
    }

    function debounce<T extends (...args: any[]) => void>(
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: number | null = null;
        
        return (...args: Parameters<T>) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = window.setTimeout(() => {
                fn(...args);
                timeoutId = null;
            }, delay);
        };
    }

    const debouncedTieGroupUpdate = debounce(updateRankings, 250);

    $: if (tieGroups !== lastTieGroups) {
        debouncedTieGroupUpdate(tieGroups);
        lastTieGroups = tieGroups;
    }
    $: containerHeight = rankings.length * LAYOUT.rowHeight;
    $: rankingsContainer && (rankingsContainer.style.setProperty('--container-height', `${containerHeight}px`));
    $: tieRanges = parseTieGroups(tieGroups);
    $: maxZIndex = rankings.length + 100;

    onDestroy(() => {
        if (mergeTimeout) {
            clearTimeout(mergeTimeout);
        }
    });
</script>

<div class="rankings-container" bind:this={rankingsContainer}>
    <svg 
        class="background-svg"
        width="100%" 
        height={`${rankings.length * LAYOUT.rowHeight}px`}
        viewBox="0 0 100% {rankings.length * LAYOUT.rowHeight}"
        preserveAspectRatio="none"
    >
        <defs>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="2"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.1 0"/>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {#each rankings as ranking, index (ranking.rank)}
            {@const currentTieGroup = getTieGroupForRank(ranking.rank, tieRanges)}
            {@const isFirstInTieGroup = currentTieGroup && ranking.rank === currentTieGroup.start}
            {@const groupStyles = currentTieGroup ? getGroupStyles(currentTieGroup.groupIndex) : null}
            
            {#if currentTieGroup && isFirstInTieGroup && groupStyles}
                <rect
                    x={LAYOUT.horizontalPadding}
                    y={index * LAYOUT.rowHeight + LAYOUT.verticalPadding}
                    width={LAYOUT.markerWidth}
                    height={getRectHeight(currentTieGroup.start, currentTieGroup.end)}
                    rx={LAYOUT.circleRadius}
                    fill={groupStyles.primary}
                    opacity="0.25"
                    class="tie-group-rect"
                    in:slide|local={getTransitionParams(index, true)}
                    out:slide|local={getTransitionParams(index, false)}
                />
            {/if}
        {/each}

        {#each rankings as ranking, index (ranking.rank)}
            {@const currentTieGroup = getTieGroupForRank(ranking.rank, tieRanges)}
            {@const groupStyles = currentTieGroup ? getGroupStyles(currentTieGroup.groupIndex) : null}
            {@const mergeParams = getMergeTransitionParams(index, currentTieGroup)}
            {@const positions = currentTieGroup && showMergedRankings 
                ? calculateMergedPosition(currentTieGroup)
                : calculatePositions(index)}
            {@const displayRank = showMergedRankings 
                ? (calculatedRanks.get(ranking.rank) || ranking.rank)
                : ranking.rank}

            <g 
                filter="url(#dropShadow)"
                class="circle-group"
                style="
                    transform-origin: center;
                    transition: all {mergeParams?.duration || ANIMATION.initial.duration}ms 
                              {mergeParams?.easing || ANIMATION.initial.easing} 
                              {mergeParams?.delay || 0}ms;
                "
            >
                <circle
                    cx={positions.circle.cx}
                    cy={positions.circle.cy}
                    r={positions.circle.r}
                    fill="white"
                    stroke={groupStyles?.primary ?? 'transparent'}
                    stroke-width={groupStyles ? 2 : 0}
                    class="circle"
                    style="opacity: {currentTieGroup && showMergedRankings && ranking.rank !== currentTieGroup.start ? 0 : 1}"
                />
                
                <text
                    x={positions.circle.cx}
                    y={positions.circle.cy}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={groupStyles?.text ?? 'rgb(55, 65, 81)'}
                    class="rank-number"
                    style="opacity: {currentTieGroup && showMergedRankings && ranking.rank !== currentTieGroup.start ? 0 : 1}"
                >
                    {displayRank}
                </text>
            </g>
        {/each}
    </svg>

    <div class="rankings-content">
        {#each rankings as ranking, index (ranking.rank)}
            {@const positions = calculatePositions(index)}
            
            <div 
                class="ranking-item"
                class:highlight-row={affectedRankings.has(index)}
                style="
                    --row-z-index: {activeIndex === index ? maxZIndex : maxZIndex - index};
                    --row-top: {positions.row.top}px;
                    --content-left: {positions.content.left}px;
                "
            >
                <div class="combobox-container">
                    <SearchableCombobox
                        type="department"
                        items={getAvailableDepartments(index)}
                        value={ranking.department_id?.toString()}
                        onValueChange={(value) => onDepartmentSelect(index, value)}
                        placeholder="Select a department"
                        searchPlaceholder="Search departments..."
                        disabled={isDisabled}
                        onOpenStateChange={(isOpen) => handleComboboxStateChange(index, isOpen)}
                    />
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .rankings-container {
        position: relative;
        width: 100%;
        isolation: isolate;
        height: var(--container-height);
        min-height: var(--container-height);
        display: block;
        margin-left: -0.5rem;
    }

    .background-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    .rankings-content {
        position: relative;
        z-index: 2;
        height: var(--container-height);
    }
    
    .ranking-item {
        position: absolute;
        top: var(--row-top);
        left: var(--content-left);
        right: 0;
        height: 45px;
        display: flex;
        align-items: center;
        z-index: var(--row-z-index);
        padding-right: 16px;
    }
    
    .combobox-container {
        width: 100%;
        position: relative;
    }
    
    .highlight-row {
        background-color: rgba(255, 0, 0, 0.1);
        border: 1px solid red;
        border-radius: 0.375rem;
        padding: 0.5rem;
        margin: 0.5rem 0;
    }
    
    .circle-group {
        transform-origin: center;
    }

    .circle {
        transition: all 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .tie-group-rect {
        transition: all 600ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    :global(.rank-number) {
        font-size: 1.25rem;
        font-weight: 700;
        user-select: none;
        transition: all 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    :global([data-state="open"].combobox-content) {
        z-index: calc(var(--row-z-index) + 1000) !important;
    }
    
    :global(.combobox-trigger) {
        position: relative;
        z-index: calc(var(--row-z-index) + 1);
    }
</style>