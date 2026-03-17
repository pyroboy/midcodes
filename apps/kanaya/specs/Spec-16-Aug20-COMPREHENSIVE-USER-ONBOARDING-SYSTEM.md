# Comprehensive User Onboarding System

## Overview

This specification addresses the lack of user onboarding and guidance throughout the application and proposes a comprehensive onboarding system with interactive tutorials, contextual help, progressive disclosure, and personalized guidance to dramatically improve user adoption, reduce time-to-value, and decrease support burden.

## Classification

**Type**: SPECIFICATION (Implementation Plan)
**Category**: User Experience & Onboarding
**Created**: August 20, 2025
**Spec Number**: 16
**Priority**: Medium-High
**Estimated Effort**: 4-5 days

## Current Onboarding Issues Identified

### 1. **No First-Time User Experience**

- New users dropped into main dashboard with no guidance
- Complex template creation process with no tutorials or help
- No progressive feature introduction or capability discovery
- Users must figure out workflows through trial and error
- No contextual hints or tips during first interactions

### 2. **Missing Feature Discovery**

- Advanced features hidden with no discoverability mechanisms
- No tooltips or hints for complex UI elements
- Users don't know about keyboard shortcuts or time-saving features
- No "what's new" notifications for feature updates
- Power user features remain unused by most users

### 3. **Poor Help Integration**

- Basic help link leads to generic page
- No in-context help or documentation
- No searchable help system or knowledge base
- Missing video tutorials or visual guides
- No chatbot or interactive assistance

### 4. **Role-Specific Guidance Missing**

- Different user roles (admin, user, viewer) get same experience
- No role-based tutorials or specialized workflows
- Admin features overwhelming for basic users
- No progressive permission/capability introduction

### 5. **No Progress Tracking**

- Users don't know what steps they've completed
- No sense of progress toward goals or milestones
- Missing achievement system or completion tracking
- No guidance on "what to do next"

## Comprehensive Onboarding Solutions

### Phase 1: Interactive Tutorial System

#### 1.1 Multi-Step Tutorial Framework

```svelte
<!-- Interactive tutorial overlay system -->
<script lang="ts">
	import { TutorialEngine } from '$lib/services/tutorial-engine';
	import { UserProgressTracker } from '$lib/services/user-progress';

	interface TutorialStep {
		id: string;
		title: string;
		description: string;
		target: string; // CSS selector for element to highlight
		position: 'top' | 'bottom' | 'left' | 'right' | 'center';
		action?: 'click' | 'input' | 'hover' | 'custom';
		validation?: () => boolean;
		prerequisites?: string[];
		optional?: boolean;
	}

	let currentTutorial = $state<Tutorial | null>(null);
	let currentStep = $state(0);
	let isPlaying = $state(false);
	let completionProgress = $state(0);

	const tutorialEngine = new TutorialEngine();
	const progressTracker = new UserProgressTracker();

	async function startTutorial(tutorialId: string) {
		currentTutorial = await tutorialEngine.getTutorial(tutorialId);
		currentStep = 0;
		isPlaying = true;

		// Track tutorial start
		progressTracker.trackEvent('tutorial_started', { tutorialId });

		showCurrentStep();
	}

	function showCurrentStep() {
		if (!currentTutorial || currentStep >= currentTutorial.steps.length) {
			completeTutorial();
			return;
		}

		const step = currentTutorial.steps[currentStep];

		// Highlight target element
		highlightElement(step.target);

		// Show tutorial popup
		showTutorialPopup(step);

		// Set up validation if required
		if (step.validation) {
			setupStepValidation(step);
		}
	}

	function highlightElement(selector: string) {
		// Remove previous highlights
		document.querySelectorAll('.tutorial-highlight').forEach((el) => {
			el.classList.remove('tutorial-highlight');
		});

		// Add highlight to current target
		const target = document.querySelector(selector);
		if (target) {
			target.classList.add('tutorial-highlight');

			// Scroll into view if needed
			target.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'center'
			});
		}
	}

	function nextStep() {
		const step = currentTutorial!.steps[currentStep];

		// Validate step completion if required
		if (step.validation && !step.validation()) {
			showValidationError();
			return;
		}

		// Track step completion
		progressTracker.trackEvent('tutorial_step_completed', {
			tutorialId: currentTutorial!.id,
			stepId: step.id,
			stepIndex: currentStep
		});

		currentStep++;
		completionProgress = (currentStep / currentTutorial!.steps.length) * 100;

		showCurrentStep();
	}

	function skipTutorial() {
		progressTracker.trackEvent('tutorial_skipped', {
			tutorialId: currentTutorial!.id,
			stepIndex: currentStep,
			completionPercentage: completionProgress
		});

		closeTutorial();
	}

	function completeTutorial() {
		progressTracker.trackEvent('tutorial_completed', {
			tutorialId: currentTutorial!.id,
			totalSteps: currentTutorial!.steps.length
		});

		// Mark tutorial as completed
		progressTracker.markTutorialCompleted(currentTutorial!.id);

		// Show completion celebration
		showCompletionCelebration();

		closeTutorial();
	}

	function closeTutorial() {
		isPlaying = false;
		currentTutorial = null;
		currentStep = 0;
		completionProgress = 0;

		// Clean up highlights
		document.querySelectorAll('.tutorial-highlight').forEach((el) => {
			el.classList.remove('tutorial-highlight');
		});
	}
</script>

{#if isPlaying && currentTutorial}
	<!-- Tutorial Overlay -->
	<div class="tutorial-overlay" transition:fade>
		<!-- Background dimmer -->
		<div class="tutorial-backdrop" onclick={skipTutorial} />

		<!-- Tutorial popup -->
		<div
			class="tutorial-popup"
			class:center={currentTutorial.steps[currentStep].position === 'center'}
		>
			<div class="tutorial-header">
				<div class="tutorial-progress">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {completionProgress}%" />
					</div>
					<span class="step-counter">
						Step {currentStep + 1} of {currentTutorial.steps.length}
					</span>
				</div>

				<button class="tutorial-close" onclick={skipTutorial}> × </button>
			</div>

			<div class="tutorial-content">
				<h3 class="tutorial-title">
					{currentTutorial.steps[currentStep].title}
				</h3>

				<p class="tutorial-description">
					{currentTutorial.steps[currentStep].description}
				</p>

				{#if currentTutorial.steps[currentStep].media}
					<div class="tutorial-media">
						<img
							src={currentTutorial.steps[currentStep].media.url}
							alt={currentTutorial.steps[currentStep].media.alt}
						/>
					</div>
				{/if}
			</div>

			<div class="tutorial-actions">
				{#if currentStep > 0}
					<button class="btn-secondary" onclick={() => currentStep--}> Previous </button>
				{/if}

				<div class="tutorial-actions-right">
					<button class="btn-ghost" onclick={skipTutorial}> Skip Tutorial </button>

					{#if currentStep < currentTutorial.steps.length - 1}
						<button class="btn-primary" onclick={nextStep}> Next </button>
					{:else}
						<button class="btn-primary" onclick={completeTutorial}> Complete </button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
```

#### 1.2 Tutorial Definition System

```typescript
interface Tutorial {
	id: string;
	title: string;
	description: string;
	category: 'getting_started' | 'templates' | 'cards' | 'admin' | 'advanced';
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	estimatedTime: number; // in minutes
	prerequisites: string[];
	steps: TutorialStep[];
	completionRewards?: CompletionReward[];
}

const TUTORIAL_LIBRARY: Tutorial[] = [
	{
		id: 'first_time_user',
		title: 'Welcome to ID Generator',
		description: 'Learn the basics of creating your first ID card template',
		category: 'getting_started',
		difficulty: 'beginner',
		estimatedTime: 5,
		prerequisites: [],
		steps: [
			{
				id: 'welcome',
				title: 'Welcome!',
				description:
					"Welcome to ID Generator! Let's create your first template in just a few steps.",
				target: 'body',
				position: 'center'
			},
			{
				id: 'navigate_templates',
				title: 'Navigate to Templates',
				description: 'Click on the Templates tab to see all available templates.',
				target: '[href="/templates"]',
				position: 'bottom',
				action: 'click',
				validation: () => window.location.pathname === '/templates'
			},
			{
				id: 'create_new_template',
				title: 'Create Your First Template',
				description: 'Click the "Create New Template" button to start building your own template.',
				target: '.create-template-btn',
				position: 'bottom',
				action: 'click',
				validation: () =>
					document.querySelector('.template-creation-dialog')?.classList.contains('open')
			},
			{
				id: 'choose_template_size',
				title: 'Choose Template Size',
				description: 'Select a template size. For ID cards, the standard size works great!',
				target: '.size-selection',
				position: 'right'
			},
			{
				id: 'add_background',
				title: 'Add Background',
				description: 'Upload a background image or choose a solid color for your template.',
				target: '.background-upload',
				position: 'top'
			},
			{
				id: 'add_fields',
				title: 'Add Fields',
				description: 'Drag field types from the palette to add name, photo, and other information.',
				target: '.field-palette',
				position: 'right'
			},
			{
				id: 'save_template',
				title: 'Save Your Template',
				description: 'Click Save to store your template. You can now use it to generate ID cards!',
				target: '.save-template-btn',
				position: 'top',
				action: 'click'
			},
			{
				id: 'completion',
				title: 'Congratulations!',
				description: "You've created your first template! Next, try generating an ID card from it.",
				target: 'body',
				position: 'center'
			}
		],
		completionRewards: [
			{
				type: 'badge',
				title: 'Template Creator',
				description: 'Created your first template'
			},
			{
				type: 'feature_unlock',
				feature: 'advanced_fields'
			}
		]
	},

	{
		id: 'generate_first_card',
		title: 'Generate Your First ID Card',
		description: 'Learn how to create ID cards from templates',
		category: 'cards',
		difficulty: 'beginner',
		estimatedTime: 3,
		prerequisites: ['first_time_user'],
		steps: [
			{
				id: 'select_template',
				title: 'Select a Template',
				description: 'Choose the template you want to use for generating ID cards.',
				target: '.template-card',
				position: 'bottom',
				action: 'click'
			},
			{
				id: 'fill_information',
				title: 'Fill in Information',
				description: "Enter the person's details in the form fields.",
				target: '.template-form',
				position: 'left'
			},
			{
				id: 'upload_photo',
				title: 'Upload Photo',
				description: 'Upload a photo for the ID card if your template includes a photo field.',
				target: '.photo-upload',
				position: 'top'
			},
			{
				id: 'preview_card',
				title: 'Preview Your Card',
				description: 'See how your ID card will look with the provided information.',
				target: '.card-preview',
				position: 'left'
			},
			{
				id: 'generate_card',
				title: 'Generate Card',
				description:
					'Click Generate to create your ID card. It will be saved to your cards library.',
				target: '.generate-btn',
				position: 'top',
				action: 'click'
			}
		]
	},

	{
		id: 'admin_user_management',
		title: 'Managing Users as an Admin',
		description: 'Learn how to add and manage users in your organization',
		category: 'admin',
		difficulty: 'intermediate',
		estimatedTime: 8,
		prerequisites: [],
		steps: [
			// Admin-specific tutorial steps
		]
	}
];

class TutorialEngine {
	private completedTutorials = new Set<string>();
	private userProgress = new Map<string, number>();

	async getTutorial(tutorialId: string): Promise<Tutorial | null> {
		const tutorial = TUTORIAL_LIBRARY.find((t) => t.id === tutorialId);
		if (!tutorial) return null;

		// Check prerequisites
		const hasPrerequisites = tutorial.prerequisites.every((prereq) =>
			this.completedTutorials.has(prereq)
		);

		if (!hasPrerequisites) {
			throw new Error(`Prerequisites not met for tutorial: ${tutorialId}`);
		}

		return tutorial;
	}

	getRecommendedTutorials(userRole: string, completedTutorials: string[]): Tutorial[] {
		this.completedTutorials = new Set(completedTutorials);

		return TUTORIAL_LIBRARY.filter((tutorial) => {
			// Filter by role appropriateness
			if (tutorial.category === 'admin' && !['super_admin', 'org_admin'].includes(userRole)) {
				return false;
			}

			// Filter out already completed
			if (completedTutorials.includes(tutorial.id)) {
				return false;
			}

			// Check prerequisites
			return tutorial.prerequisites.every((prereq) => completedTutorials.includes(prereq));
		}).sort((a, b) => {
			// Prioritize getting started tutorials
			if (a.category === 'getting_started' && b.category !== 'getting_started') return -1;
			if (b.category === 'getting_started' && a.category !== 'getting_started') return 1;

			// Then by difficulty
			const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
			return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
		});
	}
}
```

### Phase 2: Contextual Help System

#### 2.1 Smart Help Tooltips

```svelte
<!-- Contextual help tooltip component -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { HelpContentService } from '$lib/services/help-content';

	interface Props {
		helpId: string;
		trigger?: 'hover' | 'click' | 'focus';
		position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
		showDelay?: number;
		hideDelay?: number;
		persistent?: boolean;
	}

	let {
		helpId,
		trigger = 'hover',
		position = 'auto',
		showDelay = 500,
		hideDelay = 200,
		persistent = false
	}: Props = $props();

	let isVisible = $state(false);
	let helpContent = $state<HelpContent | null>(null);
	let tooltipElement: HTMLDivElement;
	let triggerElement: HTMLElement;
	let showTimer: number;
	let hideTimer: number;

	const helpService = new HelpContentService();

	onMount(async () => {
		// Load help content
		helpContent = await helpService.getHelpContent(helpId);

		// Set up event listeners based on trigger type
		setupTriggerEvents();

		return () => {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
		};
	});

	function setupTriggerEvents() {
		const parent = triggerElement?.parentElement;
		if (!parent) return;

		switch (trigger) {
			case 'hover':
				parent.addEventListener('mouseenter', scheduleShow);
				parent.addEventListener('mouseleave', scheduleHide);
				break;
			case 'click':
				parent.addEventListener('click', toggleVisibility);
				break;
			case 'focus':
				parent.addEventListener('focusin', scheduleShow);
				parent.addEventListener('focusout', scheduleHide);
				break;
		}
	}

	function scheduleShow() {
		clearTimeout(hideTimer);
		showTimer = setTimeout(show, showDelay);
	}

	function scheduleHide() {
		clearTimeout(showTimer);
		if (!persistent) {
			hideTimer = setTimeout(hide, hideDelay);
		}
	}

	function show() {
		isVisible = true;

		// Track help content views
		helpService.trackHelpView(helpId);

		// Position tooltip relative to trigger
		requestAnimationFrame(positionTooltip);
	}

	function hide() {
		isVisible = false;
	}

	function toggleVisibility() {
		if (isVisible) {
			hide();
		} else {
			show();
		}
	}

	function positionTooltip() {
		if (!tooltipElement || !triggerElement?.parentElement) return;

		const trigger = triggerElement.parentElement;
		const triggerRect = trigger.getBoundingClientRect();
		const tooltipRect = tooltipElement.getBoundingClientRect();
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		let finalPosition = position;

		// Auto-position if requested
		if (position === 'auto') {
			finalPosition = getBestPosition(triggerRect, tooltipRect, viewport);
		}

		// Apply positioning
		applyPosition(finalPosition, triggerRect, tooltipRect);
	}

	function getBestPosition(trigger: DOMRect, tooltip: DOMRect, viewport: any): string {
		const positions = ['top', 'bottom', 'left', 'right'];
		const scores = positions.map((pos) => calculatePositionScore(pos, trigger, tooltip, viewport));
		const bestIndex = scores.indexOf(Math.max(...scores));
		return positions[bestIndex];
	}
</script>

<span bind:this={triggerElement} class="help-trigger">
	<!-- Help icon -->
	<svg class="help-icon" viewBox="0 0 16 16" fill="currentColor">
		<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
		<path
			d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"
		/>
	</svg>
</span>

{#if isVisible && helpContent}
	<div
		bind:this={tooltipElement}
		class="help-tooltip"
		class:persistent
		transition:fade={{ duration: 200 }}
		onmouseenter={() => clearTimeout(hideTimer)}
		onmouseleave={scheduleHide}
	>
		<div class="tooltip-header">
			<h4 class="tooltip-title">{helpContent.title}</h4>
			{#if persistent}
				<button class="tooltip-close" onclick={hide}>×</button>
			{/if}
		</div>

		<div class="tooltip-content">
			<p class="tooltip-description">{helpContent.description}</p>

			{#if helpContent.steps}
				<ol class="tooltip-steps">
					{#each helpContent.steps as step}
						<li>{step}</li>
					{/each}
				</ol>
			{/if}

			{#if helpContent.mediaUrl}
				<div class="tooltip-media">
					{#if helpContent.mediaType === 'video'}
						<video controls preload="metadata">
							<source src={helpContent.mediaUrl} type="video/mp4" />
						</video>
					{:else}
						<img src={helpContent.mediaUrl} alt={helpContent.title} />
					{/if}
				</div>
			{/if}
		</div>

		{#if helpContent.relatedLinks}
			<div class="tooltip-footer">
				<div class="related-links">
					{#each helpContent.relatedLinks as link}
						<a href={link.url} class="related-link" target="_blank">
							{link.title}
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div class="tooltip-arrow" />
	</div>
{/if}
```

#### 2.2 Help Content Management

```typescript
interface HelpContent {
	id: string;
	title: string;
	description: string;
	category: 'basic' | 'advanced' | 'troubleshooting';
	steps?: string[];
	mediaUrl?: string;
	mediaType?: 'image' | 'video' | 'gif';
	relatedLinks?: Array<{
		title: string;
		url: string;
	}>;
	tags: string[];
	lastUpdated: Date;
}

class HelpContentService {
	private helpCache = new Map<string, HelpContent>();
	private viewAnalytics = new Map<string, number>();

	async getHelpContent(helpId: string): Promise<HelpContent | null> {
		// Check cache first
		if (this.helpCache.has(helpId)) {
			return this.helpCache.get(helpId)!;
		}

		try {
			const response = await fetch(`/api/help/${helpId}`);
			const helpContent: HelpContent = await response.json();

			// Cache the content
			this.helpCache.set(helpId, helpContent);

			return helpContent;
		} catch (error) {
			console.warn(`Failed to load help content for ${helpId}:`, error);

			// Return fallback content
			return this.getFallbackContent(helpId);
		}
	}

	trackHelpView(helpId: string) {
		const currentViews = this.viewAnalytics.get(helpId) || 0;
		this.viewAnalytics.set(helpId, currentViews + 1);

		// Send analytics
		this.sendHelpAnalytics(helpId);
	}

	getMostRequestedHelp(): Array<{ id: string; views: number }> {
		return Array.from(this.viewAnalytics.entries())
			.map(([id, views]) => ({ id, views }))
			.sort((a, b) => b.views - a.views)
			.slice(0, 10);
	}

	private getFallbackContent(helpId: string): HelpContent {
		return {
			id: helpId,
			title: 'Help Available',
			description: 'Click for more information about this feature.',
			category: 'basic',
			tags: [],
			lastUpdated: new Date()
		};
	}
}

// Help content database
const HELP_CONTENT_LIBRARY: Record<string, HelpContent> = {
	'template-creation': {
		id: 'template-creation',
		title: 'Creating Templates',
		description:
			'Templates are the foundation for generating ID cards. They define the layout, fields, and styling.',
		category: 'basic',
		steps: [
			'Click "Create New Template" button',
			'Choose your template size (standard ID card recommended)',
			'Upload background images or choose solid colors',
			'Add fields by dragging from the palette',
			'Position and style your fields',
			'Save your template for future use'
		],
		mediaUrl: '/help/videos/template-creation.mp4',
		mediaType: 'video',
		relatedLinks: [
			{ title: 'Template Best Practices', url: '/help/template-best-practices' },
			{ title: 'Field Types Guide', url: '/help/field-types' }
		],
		tags: ['template', 'creation', 'beginner'],
		lastUpdated: new Date('2025-08-20')
	},

	'field-positioning': {
		id: 'field-positioning',
		title: 'Positioning Fields',
		description: 'Learn how to precisely position and resize fields in your template.',
		category: 'basic',
		steps: [
			'Click and drag fields from the palette to the canvas',
			'Use the handles to resize fields',
			'Fine-tune position with the property panel',
			'Use alignment guides for precise positioning',
			'Test with sample data to verify layout'
		],
		mediaUrl: '/help/gifs/field-positioning.gif',
		mediaType: 'gif',
		tags: ['fields', 'positioning', 'layout'],
		lastUpdated: new Date('2025-08-20')
	},

	'photo-upload': {
		id: 'photo-upload',
		title: 'Uploading Photos',
		description: 'Add photos to ID cards with automatic cropping and optimization.',
		category: 'basic',
		steps: [
			'Click the photo field in your form',
			'Select "Upload Photo" or drag and drop an image',
			'Adjust the photo position and zoom if needed',
			'Photos are automatically optimized for print quality'
		],
		relatedLinks: [
			{ title: 'Photo Requirements', url: '/help/photo-requirements' },
			{ title: 'Troubleshooting Photo Issues', url: '/help/photo-troubleshooting' }
		],
		tags: ['photo', 'upload', 'images'],
		lastUpdated: new Date('2025-08-20')
	}
};
```

### Phase 3: Adaptive Onboarding Experience

#### 3.1 Personalized Onboarding Flow

```svelte
<!-- Adaptive onboarding based on user role and goals -->
<script lang="ts">
	import { OnboardingEngine } from '$lib/services/onboarding-engine';
	import { UserProfileService } from '$lib/services/user-profile';

	let onboardingState = $state<OnboardingState>({
		currentFlow: null,
		currentStep: 0,
		userGoals: [],
		completedActions: [],
		estimatedProgress: 0
	});

	const onboardingEngine = new OnboardingEngine();
	const userProfile = new UserProfileService();

	onMount(async () => {
		// Check if user needs onboarding
		const user = await userProfile.getCurrentUser();
		const needsOnboarding = await onboardingEngine.shouldShowOnboarding(user);

		if (needsOnboarding) {
			startPersonalizedOnboarding(user);
		}
	});

	async function startPersonalizedOnboarding(user: User) {
		// Determine user's likely goals based on role and organization
		const suggestedGoals = onboardingEngine.suggestGoals(user);

		// Start with goal selection
		showGoalSelectionDialog(suggestedGoals);
	}

	function showGoalSelectionDialog(suggestedGoals: UserGoal[]) {
		// Present goal selection UI
	}

	async function startOnboardingFlow(selectedGoals: UserGoal[]) {
		const personalizedFlow = await onboardingEngine.createPersonalizedFlow({
			user: user,
			goals: selectedGoals,
			timePreference: 'quick' // or 'comprehensive'
		});

		onboardingState.currentFlow = personalizedFlow;
		onboardingState.userGoals = selectedGoals;

		startFlow();
	}

	function startFlow() {
		if (!onboardingState.currentFlow) return;

		showCurrentFlowStep();
	}

	function showCurrentFlowStep() {
		const currentStep = onboardingState.currentFlow?.steps[onboardingState.currentStep];
		if (!currentStep) return;

		// Handle different step types
		switch (currentStep.type) {
			case 'tutorial':
				startTutorial(currentStep.tutorialId);
				break;
			case 'action':
				guideUserAction(currentStep);
				break;
			case 'information':
				showInformationStep(currentStep);
				break;
			case 'milestone':
				celebrateMilestone(currentStep);
				break;
		}
	}
</script>

{#if onboardingState.currentFlow}
	<div class="onboarding-overlay">
		<!-- Onboarding progress indicator -->
		<div class="onboarding-progress">
			<div class="progress-header">
				<h3>Getting you set up...</h3>
				<div class="progress-stats">
					<span class="estimated-time">
						~{onboardingState.currentFlow.estimatedMinutes} min remaining
					</span>
					<span class="completion-percentage">
						{Math.round(onboardingState.estimatedProgress)}% complete
					</span>
				</div>
			</div>

			<div class="progress-timeline">
				{#each onboardingState.currentFlow.milestones as milestone, index}
					<div
						class="milestone"
						class:completed={index < onboardingState.currentStep}
						class:active={index === onboardingState.currentStep}
					>
						<div class="milestone-icon">
							{#if index < onboardingState.currentStep}
								✓
							{:else if index === onboardingState.currentStep}
								{milestone.icon}
							{:else}
								{milestone.icon}
							{/if}
						</div>
						<span class="milestone-label">{milestone.title}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Current step content -->
		<div class="onboarding-step-content">
			<!-- Step-specific content rendered here -->
		</div>
	</div>
{/if}
```

#### 3.2 Onboarding Engine

```typescript
interface UserGoal {
	id: string;
	title: string;
	description: string;
	category: 'create_templates' | 'generate_cards' | 'manage_users' | 'setup_organization';
	estimatedTime: number;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface OnboardingFlow {
	id: string;
	title: string;
	description: string;
	steps: OnboardingStep[];
	milestones: OnboardingMilestone[];
	estimatedMinutes: number;
	successCriteria: string[];
}

interface OnboardingStep {
	id: string;
	type: 'tutorial' | 'action' | 'information' | 'milestone';
	title: string;
	description: string;
	tutorialId?: string;
	actionRequired?: UserAction;
	completionCriteria: () => boolean;
	optional: boolean;
}

class OnboardingEngine {
	private userProgressTracker: UserProgressTracker;
	private completedFlows = new Set<string>();

	constructor() {
		this.userProgressTracker = new UserProgressTracker();
	}

	async shouldShowOnboarding(user: User): Promise<boolean> {
		// Check if user has completed basic onboarding
		const hasCompletedBasicFlow = this.userProgressTracker.hasCompletedFlow('basic_onboarding');
		if (hasCompletedBasicFlow) {
			return false;
		}

		// Check if user has performed any significant actions
		const hasCreatedTemplate = this.userProgressTracker.hasCompletedAction('create_template');
		const hasGeneratedCard = this.userProgressTracker.hasCompletedAction('generate_card');

		if (hasCreatedTemplate && hasGeneratedCard) {
			// User has figured things out on their own
			return false;
		}

		// Check time since account creation
		const daysSinceSignup =
			(Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

		// Show onboarding for new users or users who haven't been active
		return daysSinceSignup < 7;
	}

	suggestGoals(user: User): UserGoal[] {
		const goals: UserGoal[] = [];

		// Role-based goal suggestions
		if (['super_admin', 'org_admin'].includes(user.role)) {
			goals.push({
				id: 'setup_organization',
				title: 'Set up your organization',
				description: 'Configure settings and add team members',
				category: 'setup_organization',
				estimatedTime: 10,
				difficulty: 'intermediate'
			});

			goals.push({
				id: 'manage_users',
				title: 'Add and manage users',
				description: 'Learn how to invite team members and assign roles',
				category: 'manage_users',
				estimatedTime: 8,
				difficulty: 'intermediate'
			});
		}

		// Universal goals
		goals.push({
			id: 'create_first_template',
			title: 'Create your first template',
			description: 'Build a custom ID card template for your organization',
			category: 'create_templates',
			estimatedTime: 5,
			difficulty: 'beginner'
		});

		goals.push({
			id: 'generate_first_card',
			title: 'Generate your first ID card',
			description: 'Create an ID card using one of your templates',
			category: 'generate_cards',
			estimatedTime: 3,
			difficulty: 'beginner'
		});

		return goals;
	}

	async createPersonalizedFlow(options: {
		user: User;
		goals: UserGoal[];
		timePreference: 'quick' | 'comprehensive';
	}): Promise<OnboardingFlow> {
		const { user, goals, timePreference } = options;

		// Create flow based on selected goals and preferences
		const steps: OnboardingStep[] = [];
		let totalEstimatedTime = 0;

		// Start with welcome step
		steps.push({
			id: 'welcome',
			type: 'information',
			title: 'Welcome to ID Generator!',
			description: `Let's get you set up to achieve your goals: ${goals.map((g) => g.title).join(', ')}`,
			completionCriteria: () => true,
			optional: false
		});

		// Add goal-specific steps
		for (const goal of goals) {
			const goalSteps = await this.createStepsForGoal(goal, timePreference);
			steps.push(...goalSteps);
			totalEstimatedTime += goal.estimatedTime;
		}

		// Add completion milestone
		steps.push({
			id: 'completion',
			type: 'milestone',
			title: 'Setup Complete!',
			description: "You're ready to start using ID Generator effectively.",
			completionCriteria: () => true,
			optional: false
		});

		return {
			id: `personalized_${Date.now()}`,
			title: 'Personalized Setup',
			description: 'Custom onboarding flow based on your goals',
			steps,
			milestones: this.createMilestonesFromSteps(steps),
			estimatedMinutes: Math.ceil(totalEstimatedTime * (timePreference === 'quick' ? 0.7 : 1.2)),
			successCriteria: goals.map((g) => g.id)
		};
	}

	private async createStepsForGoal(
		goal: UserGoal,
		timePreference: string
	): Promise<OnboardingStep[]> {
		switch (goal.category) {
			case 'create_templates':
				return timePreference === 'quick'
					? this.getQuickTemplateSteps()
					: this.getComprehensiveTemplateSteps();

			case 'generate_cards':
				return timePreference === 'quick'
					? this.getQuickCardGenerationSteps()
					: this.getComprehensiveCardGenerationSteps();

			case 'manage_users':
				return this.getUserManagementSteps();

			case 'setup_organization':
				return this.getOrganizationSetupSteps();

			default:
				return [];
		}
	}
}
```

## Technical Implementation Plan

### Step 1: Tutorial Framework (1.5 days)

1. **Build tutorial engine** with step-by-step guidance system
2. **Create tutorial overlay components** with highlighting and positioning
3. **Implement tutorial library** with predefined tutorials for common workflows
4. **Add tutorial progress tracking** and completion analytics

### Step 2: Contextual Help System (1 day)

1. **Build help tooltip component** with smart positioning and content loading
2. **Create help content management system** with dynamic content delivery
3. **Implement help analytics** to track most requested help topics
4. **Add help search and discovery** features

### Step 3: Adaptive Onboarding (1.5 days)

1. **Build onboarding engine** with personalized flow creation
2. **Create goal selection interface** with role-based suggestions
3. **Implement progress tracking** and milestone celebrations
4. **Add onboarding analytics** and optimization features

### Step 4: Integration & Polish (1 day)

1. **Integrate onboarding with existing flows** and user journey
2. **Add onboarding triggers** and smart timing
3. **Implement A/B testing** for onboarding variations
4. **Create admin dashboard** for onboarding analytics and content management

## Success Metrics

### User Adoption Metrics

- **Onboarding Completion Rate**: 85% of users complete basic onboarding
- **Time to First Value**: 50% reduction in time to create first template/card
- **Feature Discovery**: 60% increase in advanced feature usage
- **User Activation**: 80% of new users perform core actions within 7 days

### Support & Retention Metrics

- **Support Ticket Reduction**: 70% fewer "how to" support requests
- **Help Content Usage**: 90% of help topics viewed reduce follow-up questions
- **User Retention**: 40% improvement in 30-day user retention
- **User Satisfaction**: > 4.5/5 rating for onboarding experience

### Business Metrics

- **User Productivity**: 50% faster completion of common tasks after onboarding
- **Feature Adoption**: 35% increase in feature adoption rates
- **User Engagement**: 25% increase in daily active users
- **Expansion**: 30% more users invite team members after good onboarding

## Implementation Priority

### Must-Have (MVP)

- ✅ Basic interactive tutorial system for core workflows
- ✅ Contextual help tooltips for complex UI elements
- ✅ First-time user onboarding flow
- ✅ Progress tracking and completion analytics

### Should-Have (V1.1)

- ✅ Adaptive onboarding based on user goals and role
- ✅ Advanced help system with search and videos
- ✅ Tutorial library with role-specific content
- ✅ Onboarding analytics and optimization

### Nice-to-Have (Future)

- ⭐ AI-powered personalized recommendations
- ⭐ Interactive product tours with real data
- ⭐ Gamification and achievement systems
- ⭐ Community-driven help content

## Dependencies

- **Analytics**: User behavior tracking and onboarding funnel analysis
- **Content Management**: System for managing help content and tutorials
- **User Profile**: Enhanced user profile data for personalization
- **Video Hosting**: Platform for hosting tutorial and help videos
- **A/B Testing**: Framework for testing onboarding variations

## Risk Assessment

### Technical Risks

- **Performance**: Complex onboarding overlays may impact app performance
- **User Frustration**: Poorly designed onboarding may frustrate experienced users
- **Maintenance**: Tutorial content may become outdated with UI changes

### Mitigation Strategies

- **Performance Testing**: Ensure onboarding components don't impact core functionality
- **Skip Options**: Always provide easy ways to skip or dismiss onboarding
- **Content Versioning**: System for keeping tutorial content synchronized with UI changes
- **User Testing**: Extensive testing with different user types and skill levels

## Notes

This specification creates a comprehensive onboarding system that adapts to different user needs, roles, and goals while providing ongoing contextual assistance. The focus is on reducing time-to-value, improving feature discovery, and creating self-sufficient users who require less support.

The implementation should prioritize user choice and control, ensuring that onboarding enhances rather than hinders the user experience for both new and returning users.
