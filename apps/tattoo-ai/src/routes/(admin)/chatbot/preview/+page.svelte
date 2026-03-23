<script lang="ts">
	import { Send, Bot, User, RotateCcw, MessageSquare, HelpCircle, GitBranch, Zap, Clock, PhoneForwarded } from 'lucide-svelte';

	type StepType = 'message' | 'question' | 'condition' | 'action' | 'delay' | 'handoff';

	interface FlowStep {
		id: string;
		type: StepType;
		label: string;
		content: string;
		quickReplies?: { label: string; value: string }[];
	}

	interface ChatMessage {
		id: string;
		sender: 'bot' | 'user';
		text: string;
		quickReplies?: { label: string; value: string }[];
		timestamp: string;
	}

	const stepTypeConfig: Record<StepType, { label: string; icon: typeof MessageSquare; bg: string; text: string }> = {
		message: { label: 'Message', icon: MessageSquare, bg: 'bg-blue-500/10', text: 'text-blue-500' },
		question: { label: 'Question', icon: HelpCircle, bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
		condition: { label: 'Condition', icon: GitBranch, bg: 'bg-orange-500/10', text: 'text-orange-500' },
		action: { label: 'Action', icon: Zap, bg: 'bg-purple-500/10', text: 'text-purple-500' },
		delay: { label: 'Delay', icon: Clock, bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
		handoff: { label: 'Handoff', icon: PhoneForwarded, bg: 'bg-red-500/10', text: 'text-red-500' }
	};

	const bookingFlow: FlowStep[] = [
		{
			id: 's1',
			type: 'message',
			label: 'Welcome Message',
			content: "Welcome! What style are you interested in? We specialize in a wide range of tattoo styles and our artists would love to bring your vision to life."
		},
		{
			id: 's2',
			type: 'question',
			label: 'Style Selection',
			content: 'What tattoo style are you looking for?',
			quickReplies: [
				{ label: 'Traditional', value: 'traditional' },
				{ label: 'Realism', value: 'realism' },
				{ label: 'Blackwork', value: 'blackwork' },
				{ label: 'Watercolor', value: 'watercolor' },
				{ label: 'Japanese', value: 'japanese' }
			]
		},
		{
			id: 's3',
			type: 'question',
			label: 'Size Selection',
			content: 'How large would you like your tattoo?',
			quickReplies: [
				{ label: 'Small (2-4")', value: 'small' },
				{ label: 'Medium (5-7")', value: 'medium' },
				{ label: 'Large (8-12")', value: 'large' },
				{ label: 'Full Sleeve', value: 'full-sleeve' }
			]
		},
		{
			id: 's4',
			type: 'question',
			label: 'Reference Image',
			content: 'Upload a reference image if you have one. This helps our artist understand your vision better.',
			quickReplies: [
				{ label: 'Skip for now', value: 'skip' }
			]
		},
		{
			id: 's5',
			type: 'question',
			label: 'Preferred Date',
			content: 'When would you like to book your session?',
			quickReplies: [
				{ label: 'This week', value: 'this-week' },
				{ label: 'Next week', value: 'next-week' },
				{ label: 'This month', value: 'this-month' },
				{ label: 'Flexible', value: 'flexible' }
			]
		},
		{
			id: 's6',
			type: 'message',
			label: 'Confirmation',
			content: "Your booking request has been received. A 30% deposit (minimum P2,000) is required to confirm your slot. We'll send you payment details and confirm your appointment within 24 hours. Thank you!"
		}
	];

	let currentStepIndex = $state(0);
	let messages = $state<ChatMessage[]>([]);
	let userInput = $state('');
	let chatContainer: HTMLDivElement;

	function getTimestamp(): string {
		return new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}

	function resetChat() {
		currentStepIndex = 0;
		messages = [];
		advanceFlow();
	}

	function advanceFlow() {
		if (currentStepIndex >= bookingFlow.length) return;

		const step = bookingFlow[currentStepIndex];

		if (step.type === 'message' || step.type === 'question') {
			messages = [
				...messages,
				{
					id: `bot-${Date.now()}`,
					sender: 'bot',
					text: step.content,
					quickReplies: step.quickReplies,
					timestamp: getTimestamp()
				}
			];
		} else if (step.type === 'condition' || step.type === 'action' || step.type === 'delay') {
			// Auto-advance non-visible steps
			currentStepIndex++;
			advanceFlow();
			return;
		} else if (step.type === 'handoff') {
			messages = [
				...messages,
				{
					id: `bot-${Date.now()}`,
					sender: 'bot',
					text: 'Transferring you to a team member. Someone will be with you shortly!',
					timestamp: getTimestamp()
				}
			];
		}

		// Auto-advance message steps (no user input needed)
		if (step.type === 'message') {
			currentStepIndex++;
			if (currentStepIndex < bookingFlow.length) {
				setTimeout(() => advanceFlow(), 800);
			}
		}

		scrollToBottom();
	}

	function handleUserMessage(text: string) {
		if (!text.trim()) return;

		messages = [
			...messages,
			{
				id: `user-${Date.now()}`,
				sender: 'user',
				text: text.trim(),
				timestamp: getTimestamp()
			}
		];

		userInput = '';
		currentStepIndex++;

		setTimeout(() => advanceFlow(), 600);
		scrollToBottom();
	}

	function handleQuickReply(label: string) {
		handleUserMessage(label);
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 50);
	}

	// Start the flow on mount
	$effect(() => {
		if (messages.length === 0) {
			advanceFlow();
		}
	});
</script>

<div class="p-6 lg:p-8 h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6 shrink-0">
		<div>
			<h1 class="text-2xl lg:text-3xl font-display font-bold text-foreground uppercase tracking-wider">Chat Preview</h1>
			<p class="text-muted-foreground text-sm mt-0.5">Test the booking flow as a client would see it</p>
		</div>
		<button
			onclick={resetChat}
			class="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
		>
			<RotateCcw class="w-4 h-4" />
			Reset
		</button>
	</div>

	<!-- Split View -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
		<!-- Flow Steps (left panel, desktop only) -->
		<div class="hidden lg:block lg:col-span-2 bg-card border border-border rounded-xl p-4 overflow-y-auto">
			<h3 class="font-display font-semibold text-foreground text-xs uppercase tracking-wide mb-4">Booking Flow Steps</h3>
			<div class="space-y-2">
				{#each bookingFlow as step, i (step.id)}
					{@const config = stepTypeConfig[step.type]}
					<div class="flex items-start gap-3 p-3 rounded-lg transition {currentStepIndex > i
						? 'bg-muted/30 opacity-50'
						: currentStepIndex === i
							? 'bg-primary/5 border border-primary/30'
							: 'border border-transparent'}">
						<div class="{config.bg} p-1.5 rounded-md shrink-0">
							<config.icon class="w-3 h-3 {config.text}" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-[9px] font-mono font-semibold {config.text} uppercase">{config.label}</span>
								<span class="text-[9px] font-mono text-muted-foreground">#{i + 1}</span>
							</div>
							<p class="text-xs font-medium text-foreground mt-0.5 truncate">{step.label}</p>
							<p class="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{step.content}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Chat Simulation (right panel) -->
		<div class="lg:col-span-3 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
			<!-- Chat Header -->
			<div class="flex items-center gap-3 p-4 border-b border-border bg-card shrink-0">
				<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
					<Bot class="w-4 h-4 text-primary" />
				</div>
				<div>
					<p class="text-sm font-medium text-foreground">Ink Bot</p>
					<p class="text-[10px] text-emerald-500 font-mono">Online</p>
				</div>
			</div>

			<!-- Messages -->
			<div
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4 space-y-4"
			>
				{#each messages as msg (msg.id)}
					<div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="flex items-end gap-2 max-w-[85%]">
							{#if msg.sender === 'bot'}
								<div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
									<Bot class="w-3 h-3 text-primary" />
								</div>
							{/if}
							<div>
								<div class="px-4 py-2.5 rounded-2xl text-sm {msg.sender === 'user'
									? 'bg-primary text-primary-foreground rounded-br-md'
									: 'bg-muted text-foreground rounded-bl-md'}">
									<p class="whitespace-pre-line">{msg.text}</p>
								</div>
								<p class="text-[9px] text-muted-foreground mt-1 {msg.sender === 'user' ? 'text-right' : ''} font-mono">
									{msg.timestamp}
								</p>
								{#if msg.quickReplies && msg.sender === 'bot' && messages[messages.length - 1]?.id === msg.id}
									<div class="flex flex-wrap gap-1.5 mt-2">
										{#each msg.quickReplies as reply (reply.value)}
											<button
												onclick={() => handleQuickReply(reply.label)}
												class="px-3 py-1.5 bg-background border border-primary/30 text-primary rounded-full text-xs font-medium hover:bg-primary/10 transition"
											>
												{reply.label}
											</button>
										{/each}
									</div>
								{/if}
							</div>
							{#if msg.sender === 'user'}
								<div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
									<User class="w-3 h-3 text-muted-foreground" />
								</div>
							{/if}
						</div>
					</div>
				{/each}

				{#if currentStepIndex >= bookingFlow.length && messages.length > 0}
					<div class="text-center py-4">
						<p class="text-xs text-muted-foreground font-mono">Flow completed</p>
						<button
							onclick={resetChat}
							class="text-xs text-primary hover:underline mt-1 font-medium"
						>
							Restart conversation
						</button>
					</div>
				{/if}
			</div>

			<!-- Input -->
			<div class="p-4 border-t border-border bg-card shrink-0">
				<form
					onsubmit={(e) => { e.preventDefault(); handleUserMessage(userInput); }}
					class="flex items-center gap-2"
				>
					<input
						type="text"
						bind:value={userInput}
						placeholder="Type a message..."
						class="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
					/>
					<button
						type="submit"
						disabled={!userInput.trim()}
						class="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Send class="w-4 h-4" />
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
