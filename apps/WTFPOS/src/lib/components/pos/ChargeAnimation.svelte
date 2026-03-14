<script lang="ts">
    interface ChargeBadge { id: number; name: string; visible: boolean }

    interface Props {
        badges: ChargeBadge[];
        totalCount: number;
    }

    let { badges, totalCount }: Props = $props();
</script>

{#if badges.length > 0}
    <!-- z-[95] = above everything, badges float at the top of the screen -->
    <div class="fixed inset-x-0 top-0 z-[95] pointer-events-none flex justify-center pt-16">
        <div class="flex flex-col items-center gap-1">
            {#each badges as badge (badge.id)}
                <div class="charge-badge">
                    <span class="text-accent font-extrabold mr-1">+</span>{badge.name}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .charge-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 14px;
        border-radius: 9999px;
        background: rgba(17, 24, 39, 0.92);
        backdrop-filter: blur(4px);
        color: white;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: badgePop 0.15s cubic-bezier(0.16, 1, 0.3, 1) both,
                   badgeFadeOut 0.3s ease-out 1.8s both;
    }

    @keyframes badgePop {
        from {
            opacity: 0;
            transform: translateY(-16px) scale(0.7);
        }
        60% {
            opacity: 1;
            transform: translateY(2px) scale(1.05);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    @keyframes badgeFadeOut {
        to {
            opacity: 0;
            transform: translateY(8px);
        }
    }
</style>
