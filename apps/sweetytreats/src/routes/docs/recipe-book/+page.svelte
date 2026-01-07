<script lang="ts">
    import { recipes } from '$lib/data/recipes';
    import { getIngredient } from '$lib/data/ingredients';
    
    let selectedRecipeId = $state(recipes[0].id);
    let activeRecipe = $derived(recipes.find(r => r.id === selectedRecipeId) || recipes[0]);

    // Helper to format ingredient display
    const formatIngredient = (item: any) => {
        const ing = getIngredient(item.ingredientId);
        const name = ing ? ing.name : item.ingredientId;
        const unit = item.unit || ing?.unit || 'g';
        return { name, amount: item.amount, unit, notes: item.notes };
    };
</script>

<svelte:head>
    <title>RECIPE BOOK | SweetyTreats</title>
</svelte:head>

<div class="recipe-book-layout">
    
    <!-- Sidebar List -->
    <aside class="recipe-sidebar">
        <header class="sidebar-header">
            <h3>📖 Recipe Book</h3>
            <a href="/" class="back-link">← Dashboard</a>
        </header>
        
        <nav class="recipe-list">
            {#each recipes as recipe}
                <button 
                    class="recipe-btn" 
                    class:active={selectedRecipeId === recipe.id}
                    onclick={() => selectedRecipeId = recipe.id}
                >
                    <span class="icon">🍪</span>
                    <span class="name">{recipe.name}</span>
                </button>
            {/each}
        </nav>
        
        <div class="secret-note">
            <p>🤫 <strong>Confidential:</strong> For internal kitchen use only.</p>
        </div>
    </aside>

    <!-- Recipe Content -->
    <main class="recipe-display">
        <div class="recipe-card">
            <header class="recipe-header">
                <h1>{activeRecipe.name}</h1>
                <p class="description">{activeRecipe.description}</p>
                
                <div class="meta-row">
                    <div class="meta-item">
                        <span class="label">Yield</span>
                        <span class="val">{activeRecipe.yield} {activeRecipe.yieldUnit}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">Prep</span>
                        <span class="val">{activeRecipe.prepTime}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">Bake</span>
                        <span class="val">{activeRecipe.bakeTime}</span>
                    </div>
                </div>
            </header>

            <div class="content-split">
                <!-- Ingredients -->
                <div class="col ingredients">
                    <h3>Ingredients</h3>
                    <ul>
                        {#each activeRecipe.items as item}
                            {@const details = formatIngredient(item)}
                            <li>
                                <span class="amount">{details.amount} <small>{details.unit}</small></span>
                                <span class="item">{details.name}</span>
                                {#if details.notes}
                                    <span class="note">({details.notes})</span>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>

                <!-- Instructions -->
                <div class="col instructions">
                    <h3>Instructions</h3>
                    <ol>
                        {#each activeRecipe.instructions as step}
                            <li>{step}</li>
                        {/each}
                    </ol>

                    <div class="tips-box">
                        <h4>💡 Baker's Tips</h4>
                        <ul>
                            {#each activeRecipe.tips as tip}
                                <li>{tip}</li>
                            {/each}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>

<style>
    .recipe-book-layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--color-cream);
    }

    /* SIDEBAR */
    .recipe-sidebar {
        width: 300px;
        background: white;
        border-right: 2px solid var(--color-pink-light);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
    }
    .sidebar-header {
        padding: 2rem;
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        color: white;
    }
    .sidebar-header h3 { color: white; margin-bottom: 0.5rem; font-size: 1.5rem; }
    .back-link { 
        color: rgba(255,255,255,0.8); 
        font-size: 0.9rem; 
        text-transform: uppercase; 
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .back-link:hover { color: white; text-decoration: underline; }

    .recipe-list { padding: 1rem; flex-grow: 1; }
    .recipe-btn {
        display: flex;
        align-items: center;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 1rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 0.5rem;
        color: var(--color-text-main);
    }
    .recipe-btn:hover { background: var(--color-pink-light); }
    .recipe-btn.active { 
        background: white; 
        border: 2px solid var(--color-pink);
        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.1);
    }
    .recipe-btn .icon { font-size: 1.5rem; margin-right: 0.75rem; }
    .recipe-btn .name { font-weight: 700; font-family: var(--font-header); font-size: 1.1rem; }

    .secret-note {
        padding: 1.5rem;
        background: #fdf2f8;
        border-top: 1px dashed var(--color-pink-light);
        font-size: 0.85rem;
        color: var(--color-pink-dark);
    }

    /* MAIN CONTENT */
    .recipe-display {
        flex-grow: 1;
        padding: 4rem;
        overflow-y: auto;
    }
    .recipe-card {
        background: white;
        max-width: 900px;
        margin: 0 auto;
        border-radius: 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        overflow: hidden;
        border: 1px solid var(--color-pink-light);
    }
    
    .recipe-header {
        background: var(--color-gray-100);
        padding: 3rem;
        text-align: center;
        border-bottom: 2px solid var(--color-pink-light);
    }
    .recipe-header h1 { 
        font-size: 3.5rem; 
        color: var(--color-brown); 
        margin-bottom: 1rem;
    }
    .description { font-style: italic; color: #71717a; font-size: 1.1rem; margin-bottom: 2rem; }

    .meta-row {
        display: inline-flex;
        background: white;
        border-radius: 50px;
        padding: 0.5rem 1rem;
        border: 2px solid var(--color-pink-light);
        gap: 2rem;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-item .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: var(--color-pink); }
    .meta-item .val { font-weight: 700; color: var(--color-brown); }

    .content-split {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
    }

    .col { padding: 3rem; }
    .col.ingredients { background: #fafafa; border-right: 1px solid #f4f4f5; }
    
    .col h3 { font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--color-brown); }

    /* Ingredients List */
    .ingredients ul { list-style: none; padding: 0; margin: 0; }
    .ingredients li { padding: 0.75rem 0; border-bottom: 1px solid #e4e4e7; font-size: 1rem; }
    .ingredients li:last-child { border: none; }
    .ingredients .amount { font-weight: 700; color: var(--color-pink); margin-right: 0.5rem; }
    .ingredients .note { font-style: italic; color: #a1a1aa; font-size: 0.9rem; margin-left: 0.25rem;}

    /* Instructions List */
    .instructions ol { padding-left: 1.5rem; margin: 0; }
    .instructions li { margin-bottom: 1.25rem; line-height: 1.6; color: #3f3f46; font-size: 1.1rem; }

    .tips-box {
        margin-top: 3rem;
        background: #fffbeb; /* Light yellow */
        border: 2px solid #fcd34d;
        border-radius: 12px;
        padding: 1.5rem;
    }
    .tips-box h4 { margin: 0 0 1rem 0; color: #b45309; font-size: 1.1rem; }
    .tips-box ul { margin: 0; padding-left: 1.25rem; }
    .tips-box li { margin-bottom: 0.5rem; color: #78350f; font-size: 0.95rem; }

    @media(max-width: 900px) {
        .recipe-book-layout { flex-direction: column; }
        .recipe-sidebar { width: 100%; border-right: none; border-bottom: 2px solid var(--color-pink-light); height: auto; }
        .recipe-list { display: flex; overflow-x: auto; gap: 0.5rem; }
        .recipe-btn { width: auto; white-space: nowrap; margin: 0; }
        .recipe-display { padding: 1rem; }
        .recipe-header { padding: 2rem 1rem; }
        .content-split { grid-template-columns: 1fr; }
        .col.ingredients { border-right: none; border-bottom: 1px solid #eee; }
        .col { padding: 2rem 1.5rem; }
    }
</style>
