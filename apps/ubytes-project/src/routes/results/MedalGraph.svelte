<script lang="ts">
    import { onMount ,afterUpdate } from 'svelte';
    import { tick } from 'svelte';

import {
    Chart,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend,
    type ChartConfiguration,
    type ChartData as ChartJsData,
    type TooltipItem
} from 'chart.js';
import { Button } from "$lib/components/ui/button";
import DepartmentLogo from "./DepartmentLogo.svelte";
import { useMascotLogo } from './logoStore';

Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend
);

interface ChartData {
    department_name: string;
    department_acronym: string;
    department_logo: string | null;
    mascot_name: string | null;
    mascot_logo: string | null;
    updated_at: string | null;
    updated_by: string | null;
    updated_by_username: string | null;
    gold_count: number;
    silver_count: number;
    bronze_count: number;
    events: number;
}

interface ResponsiveConfig {
    departmentHeight: number;
    padding: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    logo: {
        size: number;
        leftPosition: string;
        topOffset: number;
    };
    counts: {
        rightPosition: string;
        topOffset: number;
        gap: string;
    };
}

export let data: ChartData[] = [];
let displayMode: 'all' | 'top5' | 'top10' = 'all';
let chartInstance: Chart | null = null;
let canvas: HTMLCanvasElement;
let chartContainer: HTMLDivElement;
let isLoading = true;
let isInitialized = false;
// Add data ready check
let isDataReady = false;

const medalColors = {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32'
};

function getResponsiveConfig(): ResponsiveConfig {
    const width = window.innerWidth;
    
    if (width < 640) {
        return {
            departmentHeight: 50,
            padding: { left: 55, right: 70, top: 0, bottom: 30 },
            logo: {
                size: 43,
                leftPosition: '0px',
                topOffset: -21
            },
            counts: {
                rightPosition: '8px',
                topOffset: -15,
                gap: '0.75rem'
            }
        };
    } else if (width < 768) {
        return {
            departmentHeight: 75,
            padding: { left: 70, right: 120, top: 0, bottom: 40 },
            logo: {
                size: 45,
                leftPosition: '12px',
                topOffset: -30
            },
            counts: {
                rightPosition: '16px',
                topOffset: -20,
                gap: '1rem'
            }
        };
    } else if (width < 1024) {
        return {
            departmentHeight: 85,
            padding: { left: 80, right: 150, top: 0, bottom: 50 },
            logo: {
                size: 48,
                leftPosition: '24px',
                topOffset: -35
            },
            counts: {
                rightPosition: '24px',
                topOffset: -25,
                gap: '1.5rem'
            }
        };
    } else {
        return {
            departmentHeight: 105,
            padding: { left: 120, right: 220, top: 0, bottom: 50 },
            logo: {
                size: 50,
                leftPosition: '30px',
                topOffset: -40
            },
            counts: {
                rightPosition: '55px',
                topOffset: -30,
                gap: '2rem'
            }
        };
    }
}

let responsiveConfig = getResponsiveConfig();
const minContainerHeight = 400;





$: containerHeight = Math.max(
    minContainerHeight,
    filteredData.length * responsiveConfig.departmentHeight
);

$: sortedData = [...data].sort((a, b) => {
    if (a.gold_count !== b.gold_count) return b.gold_count - a.gold_count;
    if (a.silver_count !== b.silver_count) return b.silver_count - a.silver_count;
    return b.bronze_count - a.bronze_count;
});

$: filteredData = (() => {
    switch (displayMode) {
        // case 'top5': return sortedData.slice(0, 5);
        // case 'top10': return sortedData.slice(0, 10);
        default: return sortedData;
    }
})();

let lastWidth = window.innerWidth;

// Replace your existing handleResize function with this
function handleResize() {
    const currentWidth = window.innerWidth;
    const breakpoints = [640, 768, 1024];
    
    const hasBreakpointChanged = breakpoints.some(breakpoint => 
        (currentWidth < breakpoint && lastWidth >= breakpoint) ||
        (currentWidth >= breakpoint && lastWidth < breakpoint)
    );

    if (hasBreakpointChanged && chartInstance) {
        responsiveConfig = getResponsiveConfig();
        requestAnimationFrame(() => {
            const config = createChartConfig();
            if (config.options) {
    Object.assign(chartInstance!.options, config.options);
}
            chartInstance!.update('none');
            setTimeout(renderLogosAndCounts, 16);
        });
        lastWidth = currentWidth;
    }
}


function createChartData(): ChartJsData<'bar'> {
    return {
        labels: Array(filteredData.length).fill(''),
        datasets: [
            {
                label: 'Gold',
                data: filteredData.map(entry => entry.gold_count || null),
                backgroundColor: medalColors.gold,
                borderColor: medalColors.gold,
                borderWidth: 0,
                borderSkipped: false,
                borderRadius: {
                    topRight: 16,
                    bottomRight: 16,
                    topLeft: 0,
                    bottomLeft: 0
                },
                barPercentage: 0.1,
                categoryPercentage: 0.5,
                barThickness: 30,
            },
            {
                label: 'Silver',
                data: filteredData.map(entry => entry.silver_count || null),
                backgroundColor: medalColors.silver,
                borderColor: medalColors.silver,
                borderWidth: 0,
                borderSkipped: false,
                borderRadius: {
                    topRight: 16,
                    bottomRight: 16,
                    topLeft: 0,
                    bottomLeft: 0
                },
                barPercentage: 0.1,
                categoryPercentage: 0.5,
                barThickness: 30,
            },
            {
                label: 'Bronze',
                data: filteredData.map(entry => entry.bronze_count || null),
                backgroundColor: medalColors.bronze,
                borderColor: medalColors.bronze,
                borderWidth: 0,
                borderSkipped: false,
                borderRadius: {
                    topRight: 16,
                    bottomRight: 16,
                    topLeft: 0,
                    bottomLeft: 0
                },
                barPercentage: 0.1,
                categoryPercentage: 0.5,
                barThickness: 30,
            }
        ]
    };
}

function createChartConfig(): ChartConfiguration<'bar'> {
    const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: createChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        color: '#E5E7EB',
                        lineWidth: 0.5
                    },
                    ticks: {
                        font: { size: 12 }
                    },
                    min: 0
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    },
                    afterFit: (scale) => {
                        scale.paddingLeft = responsiveConfig.padding.left;
                        scale.paddingRight = responsiveConfig.padding.right;
                        scale.paddingTop = responsiveConfig.padding.top;
                        scale.paddingBottom = responsiveConfig.padding.bottom;
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context: TooltipItem<'bar'>) => {
                            const value = context.parsed.x;
                            if (value === 0.1) return `${context.dataset.label}: 0`;
                            return `${context.dataset.label}: ${value}`;
                        }
                    }
                }
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 20,
                    bottom: 20
                }
            }, transitions: {
                active: {
                    animation: {
                        duration: 400
                    }
                }
            }
        }
    };

    return config;
}
function animateNumber(start: number, end: number, callback: (value: number) => void) {
    const duration = 1000; // 1 second duration
    const startTime = performance.now();
    
    function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOutCubic);
        
        callback(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}



function adjustFontSize(span: HTMLSpanElement): void {
    const parentWidth = span.offsetParent ? (span.offsetParent as HTMLElement).offsetWidth : 0;
    const maxFontSize = 16; // Starting font size
    const minFontSize = 8; // Minimum font size (reduced for better scaling)
    let fontSize = maxFontSize;
console.log("PAERNET:"+parentWidth)
    // Apply maximum font size initially
    span.style.fontSize = `${fontSize}px`;

    // Gradually reduce font size until the text fits the container
    while (span.scrollWidth > parentWidth && fontSize > minFontSize) {
        fontSize -= 0.2; // Smaller steps for smoother resizing
        span.style.fontSize = `${fontSize}px`;
    }
}



function renderLogosAndCounts() {
    if (!chartContainer) return;

    const elements = chartContainer.querySelectorAll('.overlay-element');
    elements.forEach(el => el.remove());

    const chartArea = chartInstance?.chartArea;
    if (!chartArea) return;

    const totalHeight = chartArea.height;
    const rowHeight = totalHeight / filteredData.length;

    filteredData.forEach((entry, index) => {
        const yPos = chartArea.top + (index * rowHeight);
        
        const departmentGroup = document.createElement('div');
        departmentGroup.className = 'overlay-element absolute flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4';
        departmentGroup.style.cssText = `
            top: ${yPos + (rowHeight/2) + responsiveConfig.logo.topOffset}px;
            left: ${responsiveConfig.logo.leftPosition};
            width: ${responsiveConfig.logo.size}px;
            display: flex;
            justify-content: center;
        `;
        
        const logoWrapper = document.createElement('div');
        logoWrapper.className = 'flex flex-col items-center relative';
        
        new DepartmentLogo({
            target: logoWrapper,
            props: {
                departmentLogoSrc: entry.department_logo,
                mascotLogoSrc: entry.mascot_logo,
                acronym: entry.department_acronym,
                mascotName: entry.mascot_name,
                size: responsiveConfig.logo.size,
                useMascot: $useMascotLogo
            }
        });

const acronymText = document.createElement('span');
acronymText.className = 'hidden sm:block text-xs md:text-sm lg:text-base font-medium text-gray-600 absolute -bottom-6 whitespace-nowrap text-center';
acronymText.style.cssText = `
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    max-width: 100%;
`;

// Set content and append it
acronymText.textContent = entry.department_acronym;
logoWrapper.appendChild(acronymText);

// Ensure it's in the DOM before adjusting
setTimeout(() => {
    adjustFontSize(acronymText);
}, 0);



        departmentGroup.appendChild(logoWrapper);
        
        const hasNoMedals = !entry.gold_count && !entry.silver_count && !entry.bronze_count;
        
        if (hasNoMedals) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'overlay-element absolute transition-all duration-300 ease-out';
            noDataDiv.style.cssText = `
                top: ${yPos + (rowHeight/2) + responsiveConfig.counts.topOffset}px;
                right: ${responsiveConfig.counts.rightPosition};
                opacity: 0;
                transform: translateX(10px);
            `;
            noDataDiv.innerHTML = `
                <span class="text-xs sm:text-sm md:text-base lg:text-lg text-gray-500 font-medium">No Data</span>
            `;
            chartContainer.appendChild(noDataDiv);
            
            // Trigger animation
            setTimeout(() => {
                noDataDiv.style.opacity = '1';
                noDataDiv.style.transform = 'translateX(0)';
            }, 50);
        } else {
            const countsDiv = document.createElement('div');
            countsDiv.className = 'overlay-element absolute flex';
            countsDiv.style.cssText = `
                top: ${yPos + (rowHeight/2) + responsiveConfig.counts.topOffset}px;
                right: ${responsiveConfig.counts.rightPosition};
                display: flex;
                gap: ${responsiveConfig.counts.gap};
                opacity: 0;
                transform: translateX(10px);
                transition: all 300ms ease-out;
            `;

            const goldSpan = document.createElement('span');
            goldSpan.className = 'text-xs sm:text-sm md:text-base lg:text-lg font-bold';
            const silverSpan = document.createElement('span');
            silverSpan.className = 'text-xs sm:text-sm md:text-base lg:text-lg font-bold';
            const bronzeSpan = document.createElement('span');
            bronzeSpan.className = 'text-xs sm:text-sm md:text-base lg:text-lg font-bold';

            countsDiv.innerHTML = `
                <div class="flex flex-col items-center gap-1">
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transform scale-0 transition-transform duration-300" 
                         style="background: ${medalColors.gold}">
                    </div>
                    <div class="number-container"></div>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transform scale-0 transition-transform duration-300" 
                         style="background: ${medalColors.silver}">
                    </div>
                    <div class="number-container"></div>
                </div>
                <div class="flex flex-col items-center gap-1">
                    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transform scale-0 transition-transform duration-300" 
                         style="background: ${medalColors.bronze}">
                    </div>
                    <div class="number-container"></div>
                </div>
            `;

            const numberContainers = countsDiv.querySelectorAll('.number-container');
            numberContainers[0].appendChild(goldSpan);
            numberContainers[1].appendChild(silverSpan);
            numberContainers[2].appendChild(bronzeSpan);

            chartContainer.appendChild(countsDiv);

            // Trigger animations
            setTimeout(() => {
                countsDiv.style.opacity = '1';
                countsDiv.style.transform = 'translateX(0)';
                
                const dots = countsDiv.querySelectorAll('.rounded-full');
                dots.forEach(dot => {
                    (dot as HTMLElement).style.transform = 'scale(1)';
                });

                // Animate numbers
                animateNumber(0, entry.gold_count || 0, value => {
                    goldSpan.textContent = value.toString();
                });
                animateNumber(0, entry.silver_count || 0, value => {
                    silverSpan.textContent = value.toString();
                });
                animateNumber(0, entry.bronze_count || 0, value => {
                    bronzeSpan.textContent = value.toString();
                });
            }, 50);
        }

        // Add entrance animation for logos
        departmentGroup.style.opacity = '0';
        departmentGroup.style.transform = 'translateX(-50px)';
        departmentGroup.style.transition = 'all 800ms ease-out';
        
        chartContainer.appendChild(departmentGroup);
        
        // Trigger logo animation
        setTimeout(() => {
            departmentGroup.style.opacity = '1';
            departmentGroup.style.transform = 'translateX(0)';
        }, 50);
    });
}


async function updateChart() {
    if (!chartInstance && canvas && data.length) {
        await initializeChart();
        return;
    }

    if (chartInstance) {
        const config = createChartConfig();
        chartInstance.data = config.data;
        if (config.options) {
            chartInstance.options = config.options;
        }
        // Use Chart.js built-in animations
        chartInstance.update('show');
    
        setTimeout(renderLogosAndCounts, 50);
    }
}

$: if (chartInstance && (filteredData || displayMode)) {
    updateChart();
}

// Simplify initialization
async function initializeChart() {
    if (!canvas || !data.length) {
        isLoading = false;
        return;
    }
    
    try {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        await tick();
        
        const config = createChartConfig();
        chartInstance = new Chart(canvas, config);
        renderLogosAndCounts();
        
        isLoading = false;
    } catch (error) {
        console.error('Error initializing chart:', error);
        isLoading = false;
    }
}
// Split initialization and cleanup
function initChart() {
    if (data.length && !isInitialized) {
        initializeChart();
    } else {
        isLoading = false;
    }
}
$: if (data.length && canvas) {
    initializeChart();
}

afterUpdate(async () => {
    if (isDataReady && !chartInstance) {
        await initializeChart();
    }
});
// Reactive statement to handle data changes
$: if (data.length) {
    initializeChart();
}
onMount(() => {
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        isLoading = true;
    };
});

</script>

<div class="space-y-4 w-full">
    <!-- <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded-full" style="background: {medalColors.gold}"></div>
                <span class="text-sm">Gold</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded-full" style="background: {medalColors.silver}"></div>
                <span class="text-sm">Silver</span>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded-full" style="background: {medalColors.bronze}"></div>
                <span class="text-sm">Bronze</span>
            </div>
        </div>

        <div class="flex gap-1">
            <Button 
                variant={displayMode === 'all' ? 'default' : 'outline'}
                on:click={() => displayMode = 'all'}
                class="rounded-r-none"
            >
                All
            </Button>
            <Button 
                variant={displayMode === 'top5' ? 'default' : 'outline'}
                on:click={() => displayMode = 'top5'}
                class="rounded-none border-x-0"
            >
                Top 5
            </Button>
            <Button 
                variant={displayMode === 'top10' ? 'default' : 'outline'}
                on:click={() => displayMode = 'top10'}
                class="rounded-l-none"
            >
                Top 10
            </Button>
        </div>
    </div> -->
    <div class="w-full overflow-x-auto flex justify-center">
        {#if isLoading}
            <div class="flex justify-center items-center h-[400px] text-gray-500">
                Loading...
            </div>
        {:else if  !data.length}
            <div class="flex justify-center items-center h-[400px] text-gray-500">
                No data available
            </div>
        {:else}
            <div 
                bind:this={chartContainer} 
                class="w-full relative" 
                style="height: {containerHeight}px; min-height: {minContainerHeight}px;"
            >
                <canvas 
                    bind:this={canvas} 
                    class="w-full h-full"
                ></canvas>
            </div>
        {/if}
    </div>
</div>

<style>
    :global(.overlay-element) {
        position: absolute;
        z-index: 10;
    }
</style>