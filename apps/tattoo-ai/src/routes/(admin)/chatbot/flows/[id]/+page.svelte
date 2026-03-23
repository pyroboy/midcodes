<script lang="ts">
	import { page } from '$app/state';
	import {
		MessageSquare,
		HelpCircle,
		GitBranch,
		Zap,
		Timer,
		UserPlus,
		Settings,
		Plus,
		Minus,
		ArrowLeft,
		Play,
		Save,
		Trash2,
		X,
		ChevronDown,
		ChevronUp,
		Monitor,
		Eye,
		EyeOff,
		Bot,
		User
	} from 'lucide-svelte';

	// --- Types ---
	interface FlowNode {
		id: string;
		type: 'trigger' | 'message' | 'question' | 'condition' | 'action' | 'delay' | 'handoff';
		position: { x: number; y: number };
		data: {
			label: string;
			content?: string;
			options?: string[];
			variable?: string;
			operator?: string;
			value?: string;
			delaySeconds?: number;
			actionType?: string;
		};
	}

	interface FlowEdge {
		id: string;
		source: string;
		target: string;
	}

	type NodeType = FlowNode['type'];

	interface ChatMessage {
		type: 'bot' | 'user' | 'system' | 'label';
		content: string;
	}

	const nodeTypeConfig: Record<
		NodeType,
		{ label: string; icon: typeof MessageSquare; color: string; bg: string; ring: string }
	> = {
		trigger: {
			label: 'Trigger',
			icon: Zap,
			color: 'bg-yellow-500',
			bg: 'bg-yellow-500/10',
			ring: 'ring-yellow-500'
		},
		message: {
			label: 'Message',
			icon: MessageSquare,
			color: 'bg-blue-500',
			bg: 'bg-blue-500/10',
			ring: 'ring-blue-500'
		},
		question: {
			label: 'Question',
			icon: HelpCircle,
			color: 'bg-green-500',
			bg: 'bg-green-500/10',
			ring: 'ring-green-500'
		},
		condition: {
			label: 'Condition',
			icon: GitBranch,
			color: 'bg-orange-500',
			bg: 'bg-orange-500/10',
			ring: 'ring-orange-500'
		},
		action: {
			label: 'Action',
			icon: Settings,
			color: 'bg-purple-500',
			bg: 'bg-purple-500/10',
			ring: 'ring-purple-500'
		},
		delay: {
			label: 'Delay',
			icon: Timer,
			color: 'bg-cyan-500',
			bg: 'bg-cyan-500/10',
			ring: 'ring-cyan-500'
		},
		handoff: {
			label: 'Handoff',
			icon: UserPlus,
			color: 'bg-red-500',
			bg: 'bg-red-500/10',
			ring: 'ring-red-500'
		}
	};

	const colorMap: Record<NodeType, string> = {
		trigger: '#eab308',
		message: '#3b82f6',
		question: '#22c55e',
		condition: '#f97316',
		action: '#a855f7',
		delay: '#06b6d4',
		handoff: '#ef4444'
	};

	// --- Pre-built flows ---
	const flowsData: Record<string, { name: string; nodes: FlowNode[]; edges: FlowEdge[] }> = {
		booking: {
			name: 'Booking Flow',
			nodes: [
				{
					id: 'n1',
					type: 'trigger',
					position: { x: 400, y: 50 },
					data: { label: 'Keyword Match', content: 'book, booking, appointment' }
				},
				{
					id: 'n2',
					type: 'message',
					position: { x: 400, y: 200 },
					data: {
						label: 'Welcome Message',
						content:
							'Welcome! What style are you interested in? We specialize in a wide range of tattoo styles.'
					}
				},
				{
					id: 'n3',
					type: 'question',
					position: { x: 400, y: 380 },
					data: {
						label: 'Style Selection',
						content: 'What tattoo style are you looking for?',
						options: ['Traditional', 'Realism', 'Blackwork', 'Watercolor', 'Japanese']
					}
				},
				{
					id: 'n4',
					type: 'condition',
					position: { x: 250, y: 560 },
					data: {
						label: 'Style Check',
						variable: 'selected_style',
						operator: 'equals',
						value: 'realism'
					}
				},
				{
					id: 'n5',
					type: 'message',
					position: { x: 550, y: 560 },
					data: { label: 'Style Confirmation', content: 'Great choice! Our artists love that style.' }
				},
				{
					id: 'n6',
					type: 'question',
					position: { x: 400, y: 740 },
					data: {
						label: 'Size Selection',
						content: 'How large would you like your tattoo?',
						options: ['Small (2-4")', 'Medium (5-7")', 'Large (8-12")', 'Full Sleeve']
					}
				},
				{
					id: 'n7',
					type: 'question',
					position: { x: 400, y: 920 },
					data: {
						label: 'Preferred Date',
						content: 'When would you like to book your session?',
						options: ['This week', 'Next week', 'This month', 'Flexible']
					}
				},
				{
					id: 'n8',
					type: 'message',
					position: { x: 400, y: 1100 },
					data: {
						label: 'Confirmation',
						content:
							'Your booking request has been received. A 30% deposit is required to confirm your slot.'
					}
				}
			],
			edges: [
				{ id: 'e1', source: 'n1', target: 'n2' },
				{ id: 'e2', source: 'n2', target: 'n3' },
				{ id: 'e3', source: 'n3', target: 'n4' },
				{ id: 'e4', source: 'n3', target: 'n5' },
				{ id: 'e5', source: 'n4', target: 'n6' },
				{ id: 'e6', source: 'n5', target: 'n6' },
				{ id: 'e7', source: 'n6', target: 'n7' },
				{ id: 'e8', source: 'n7', target: 'n8' }
			]
		},
		greeting: {
			name: 'Greeting Flow',
			nodes: [
				{
					id: 'g1',
					type: 'trigger',
					position: { x: 400, y: 50 },
					data: { label: 'Any Message', content: 'hello, hi, hey, start' }
				},
				{
					id: 'g2',
					type: 'message',
					position: { x: 400, y: 200 },
					data: {
						label: 'Welcome',
						content: 'Hey there! Welcome to our studio. How can we help you today?'
					}
				},
				{
					id: 'g3',
					type: 'question',
					position: { x: 400, y: 380 },
					data: {
						label: 'Intent',
						content: 'What would you like to do?',
						options: ['Book a session', 'See portfolio', 'Get pricing', 'Aftercare info']
					}
				},
				{
					id: 'g4',
					type: 'condition',
					position: { x: 400, y: 560 },
					data: { label: 'Route by intent', variable: 'user_intent', operator: 'equals', value: 'book' }
				},
				{
					id: 'g5',
					type: 'action',
					position: { x: 400, y: 740 },
					data: { label: 'Redirect to flow', content: 'Redirect user to appropriate flow', actionType: 'redirect' }
				}
			],
			edges: [
				{ id: 'ge1', source: 'g1', target: 'g2' },
				{ id: 'ge2', source: 'g2', target: 'g3' },
				{ id: 'ge3', source: 'g3', target: 'g4' },
				{ id: 'ge4', source: 'g4', target: 'g5' }
			]
		}
	};

	// --- State ---
	let flowId = $derived(page.params.id);
	let flowSource = $derived(flowsData[flowId] || flowsData['booking']);
	let flowName = $state('');
	let nodes = $state<FlowNode[]>([]);
	let edges = $state<FlowEdge[]>([]);
	let selectedNodeId = $state<string | null>(null);
	let panOffset = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let dragNodeId = $state<string | null>(null);
	let dragStart = $state({ x: 0, y: 0 });
	let showAddMenu = $state(false);
	let sidebarOpen = $state(false);
	let showChatPreview = $state(false);
	let mobileExpandedNodeId = $state<string | null>(null);

	let selectedNode = $derived(nodes.find((n) => n.id === selectedNodeId) ?? null);

	$effect(() => {
		flowName = flowSource.name;
		nodes = flowSource.nodes.map((n) => ({ ...n, position: { ...n.position }, data: { ...n.data, options: n.data.options ? [...n.data.options] : undefined } }));
		edges = flowSource.edges.map((e) => ({ ...e }));
		selectedNodeId = null;
		sidebarOpen = false;
	});

	// --- Ordered nodes for mobile + chat preview ---
	let orderedNodes = $derived.by(() => {
		if (nodes.length === 0) return [];
		const edgeMap = new Map<string, string[]>();
		const incomingCount = new Map<string, number>();
		for (const n of nodes) {
			edgeMap.set(n.id, []);
			incomingCount.set(n.id, 0);
		}
		for (const e of edges) {
			edgeMap.get(e.source)?.push(e.target);
			incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
		}
		// Topological sort (BFS)
		const queue: string[] = [];
		for (const [id, count] of incomingCount) {
			if (count === 0) queue.push(id);
		}
		const ordered: FlowNode[] = [];
		const visited = new Set<string>();
		while (queue.length > 0) {
			const id = queue.shift()!;
			if (visited.has(id)) continue;
			visited.add(id);
			const node = nodes.find((n) => n.id === id);
			if (node) ordered.push(node);
			for (const targetId of edgeMap.get(id) || []) {
				const newCount = (incomingCount.get(targetId) || 1) - 1;
				incomingCount.set(targetId, newCount);
				if (newCount <= 0 && !visited.has(targetId)) queue.push(targetId);
			}
		}
		// Add any remaining nodes not in edges
		for (const n of nodes) {
			if (!visited.has(n.id)) ordered.push(n);
		}
		return ordered;
	});

	// --- Chat preview messages ---
	let chatMessages = $derived.by(() => {
		const messages: ChatMessage[] = [];
		let isFirstUserInteraction = true;
		let lastNodeType: NodeType | null = null;

		for (let i = 0; i < orderedNodes.length; i++) {
			const node = orderedNodes[i];
			const isLast = i === orderedNodes.length - 1;

			if (node.type === 'trigger') {
				// Skip trigger in chat, it's just the entry point
				continue;
			}

			if (node.type === 'message') {
				if (isLast) {
					messages.push({ type: 'label', content: 'OUTPUT' });
				}
				messages.push({ type: 'bot', content: node.data.content || node.data.label });
			} else if (node.type === 'question') {
				// Bot asks the question
				messages.push({ type: 'bot', content: node.data.content || node.data.label });
				if (isFirstUserInteraction) {
					messages.push({ type: 'label', content: 'INPUT' });
					isFirstUserInteraction = false;
				}
				// User picks the first option as mock response
				const selectedOption = node.data.options?.[0] || 'Selected';
				messages.push({ type: 'user', content: selectedOption });
			} else if (node.type === 'condition') {
				messages.push({
					type: 'system',
					content: `Checking: ${node.data.variable} ${node.data.operator} ${node.data.value}`
				});
			} else if (node.type === 'action') {
				messages.push({
					type: 'system',
					content: `Action: ${node.data.actionType || 'execute'} - ${node.data.content || node.data.label}`
				});
			} else if (node.type === 'delay') {
				messages.push({
					type: 'system',
					content: `Waiting ${node.data.delaySeconds || 2}s...`
				});
			} else if (node.type === 'handoff') {
				messages.push({
					type: 'system',
					content: 'Transferring to human agent...'
				});
			}

			lastNodeType = node.type;
		}

		return messages;
	});

	// --- Node height estimation ---
	function getNodeHeight(node: FlowNode): number {
		let h = 44; // header
		if (node.type === 'trigger') h += 36;
		else if (node.type === 'message') h += 48;
		else if (node.type === 'question') h += 48 + (node.data.options ? Math.ceil(node.data.options.length / 2) * 28 + 8 : 0);
		else if (node.type === 'condition') h += 36;
		else if (node.type === 'action') h += 36;
		else if (node.type === 'delay') h += 36;
		else if (node.type === 'handoff') h += 36;
		return h;
	}

	// --- Edge path ---
	function getEdgePath(sourceNode: FlowNode, targetNode: FlowNode): string {
		const sx = sourceNode.position.x + 100;
		const sy = sourceNode.position.y + getNodeHeight(sourceNode);
		const tx = targetNode.position.x + 100;
		const ty = targetNode.position.y;
		const cy = (sy + ty) / 2;
		return `M ${sx} ${sy} C ${sx} ${cy}, ${tx} ${cy}, ${tx} ${ty}`;
	}

	function getEdgeColor(edgeId: string): string {
		const edge = edges.find((e) => e.id === edgeId);
		if (!edge) return '#555';
		const sourceNode = nodes.find((n) => n.id === edge.source);
		return sourceNode ? colorMap[sourceNode.type] : '#555';
	}

	// --- Canvas interactions ---
	function handleCanvasMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.flow-node')) return;
		isPanning = true;
		panStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
		showAddMenu = false;
	}

	function handleNodeMouseDown(e: MouseEvent, nodeId: string) {
		e.stopPropagation();
		isDragging = true;
		dragNodeId = nodeId;
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			dragStart = { x: e.clientX - node.position.x * zoom, y: e.clientY - node.position.y * zoom };
		}
		selectedNodeId = nodeId;
		sidebarOpen = true;
	}

	function handleMouseMove(e: MouseEvent) {
		if (isPanning) {
			panOffset = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
		}
		if (isDragging && dragNodeId) {
			const node = nodes.find((n) => n.id === dragNodeId);
			if (node) {
				node.position.x = (e.clientX - dragStart.x) / zoom;
				node.position.y = (e.clientY - dragStart.y) / zoom;
			}
		}
	}

	function handleMouseUp() {
		isPanning = false;
		isDragging = false;
		dragNodeId = null;
	}

	function handleZoomIn() {
		zoom = Math.min(zoom + 0.1, 2);
	}

	function handleZoomOut() {
		zoom = Math.max(zoom - 0.1, 0.3);
	}

	function handleZoomReset() {
		zoom = 1;
		panOffset = { x: 0, y: 0 };
	}

	// --- Node CRUD ---
	function addNode(type: NodeType) {
		const id = `node-${Date.now()}`;
		const centerX = (-panOffset.x + 400) / zoom;
		const centerY = (-panOffset.y + 300) / zoom;
		const newNode: FlowNode = {
			id,
			type,
			position: { x: centerX, y: centerY },
			data: {
				label: `New ${nodeTypeConfig[type].label}`,
				content: type === 'trigger' ? 'keyword' : type === 'message' ? 'Enter message...' : type === 'delay' ? '' : '',
				options: type === 'question' ? ['Option 1'] : undefined,
				variable: type === 'condition' ? 'variable' : undefined,
				operator: type === 'condition' ? 'equals' : undefined,
				value: type === 'condition' ? '' : undefined,
				delaySeconds: type === 'delay' ? 2 : undefined,
				actionType: type === 'action' ? 'set_variable' : undefined
			}
		};
		nodes = [...nodes, newNode];
		showAddMenu = false;
		selectedNodeId = id;
		sidebarOpen = true;
	}

	function deleteNode(id: string) {
		nodes = nodes.filter((n) => n.id !== id);
		edges = edges.filter((e) => e.source !== id && e.target !== id);
		if (selectedNodeId === id) {
			selectedNodeId = null;
			sidebarOpen = false;
		}
	}

	function selectNode(id: string) {
		selectedNodeId = id;
		sidebarOpen = true;
	}

	function closeSidebar() {
		sidebarOpen = false;
		selectedNodeId = null;
	}

	function addOption(node: FlowNode) {
		if (!node.data.options) node.data.options = [];
		node.data.options = [...node.data.options, `Option ${node.data.options.length + 1}`];
	}

	function removeOption(node: FlowNode, idx: number) {
		if (node.data.options) {
			node.data.options = node.data.options.filter((_, i) => i !== idx);
		}
	}

	function toggleMobileNode(id: string) {
		mobileExpandedNodeId = mobileExpandedNodeId === id ? null : id;
	}

	// --- Minimap ---
	let minimapNodes = $derived(
		nodes.map((n) => ({
			x: n.position.x,
			y: n.position.y,
			color: colorMap[n.type]
		}))
	);

	let minimapBounds = $derived.by(() => {
		if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 800 };
		const xs = nodes.map((n) => n.position.x);
		const ys = nodes.map((n) => n.position.y);
		return {
			minX: Math.min(...xs) - 50,
			minY: Math.min(...ys) - 50,
			maxX: Math.max(...xs) + 250,
			maxY: Math.max(...ys) + 200
		};
	});
</script>

<!-- ==================== MOBILE VIEW ==================== -->
<div class="flex flex-col h-screen overflow-hidden md:hidden">
	<!-- Mobile Toolbar -->
	<div class="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
		<div class="flex items-center gap-3">
			<a
				href="/chatbot"
				class="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<h1 class="text-foreground font-display font-bold text-base uppercase tracking-wider truncate">{flowName}</h1>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition"
			>
				<Save class="w-3.5 h-3.5" />
				Save
			</button>
		</div>
	</div>

	<!-- Mobile Node List -->
	<div class="flex-1 overflow-y-auto">
		<div class="p-4 space-y-0">
			{#each orderedNodes as node, idx (node.id)}
				{@const config = nodeTypeConfig[node.type]}
				{@const isExpanded = mobileExpandedNodeId === node.id}

				<!-- Connection line -->
				{#if idx > 0}
					<div class="flex justify-center py-1">
						<div class="w-0.5 h-6 bg-border"></div>
					</div>
				{/if}

				<!-- Node Card -->
				<button
					class="w-full text-left rounded-xl border transition-all duration-200 {isExpanded ? 'border-primary ring-1 ring-primary/30 bg-card' : 'border-border bg-card hover:border-primary/30'}"
					onclick={() => toggleMobileNode(node.id)}
				>
					<!-- Card Header -->
					<div class="flex items-center gap-3 px-4 py-3">
						<div class="w-8 h-8 rounded-lg {config.color} flex items-center justify-center shrink-0">
							<config.icon class="w-4 h-4 text-white" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
							</div>
							<p class="text-sm font-medium text-foreground truncate">{node.data.label}</p>
						</div>
						{#if isExpanded}
							<ChevronUp class="w-4 h-4 text-muted-foreground shrink-0" />
						{:else}
							<ChevronDown class="w-4 h-4 text-muted-foreground shrink-0" />
						{/if}
					</div>

					<!-- Content Preview (collapsed) -->
					{#if !isExpanded && node.data.content}
						<div class="px-4 pb-3 -mt-1">
							<p class="text-xs text-muted-foreground line-clamp-1">{node.data.content}</p>
						</div>
					{/if}
				</button>

				<!-- Expanded Edit Panel -->
				{#if isExpanded}
					<div class="border border-t-0 border-primary/30 rounded-b-xl bg-card/50 px-4 py-4 space-y-3 -mt-1">
						<!-- Label -->
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Label</label>
							<input
								type="text"
								bind:value={node.data.label}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
								onclick={(e) => e.stopPropagation()}
							/>
						</div>

						{#if node.type === 'trigger'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Keywords</label>
								<input
									type="text"
									bind:value={node.data.content}
									class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
									placeholder="comma separated keywords"
									onclick={(e) => e.stopPropagation()}
								/>
							</div>
						{:else if node.type === 'message'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Message</label>
								<textarea
									bind:value={node.data.content}
									rows={3}
									class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
									onclick={(e) => e.stopPropagation()}
								></textarea>
							</div>
						{:else if node.type === 'question'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Question</label>
								<textarea
									bind:value={node.data.content}
									rows={2}
									class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
									onclick={(e) => e.stopPropagation()}
								></textarea>
							</div>
							{#if node.data.options}
								<div>
									<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Options</label>
									<div class="flex flex-wrap gap-1.5">
										{#each node.data.options as opt}
											<span class="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{opt}</span>
										{/each}
									</div>
								</div>
							{/if}
						{:else if node.type === 'condition'}
							<div class="grid grid-cols-3 gap-2">
								<div>
									<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1">Var</label>
									<input type="text" bind:value={node.data.variable} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" onclick={(e) => e.stopPropagation()} />
								</div>
								<div>
									<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1">Op</label>
									<select bind:value={node.data.operator} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" onclick={(e) => e.stopPropagation()}>
										<option value="equals">=</option>
										<option value="not_equals">!=</option>
										<option value="contains">has</option>
									</select>
								</div>
								<div>
									<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1">Val</label>
									<input type="text" bind:value={node.data.value} class="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" onclick={(e) => e.stopPropagation()} />
								</div>
							</div>
						{:else if node.type === 'action'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Action Type</label>
								<select bind:value={node.data.actionType} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" onclick={(e) => e.stopPropagation()}>
									<option value="set_variable">Set Variable</option>
									<option value="api_call">API Call</option>
									<option value="redirect">Redirect to Flow</option>
									<option value="send_gallery">Send Gallery</option>
								</select>
							</div>
						{:else if node.type === 'delay'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Delay (seconds)</label>
								<input type="number" bind:value={node.data.delaySeconds} min={1} max={300} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" onclick={(e) => e.stopPropagation()} />
							</div>
						{:else if node.type === 'handoff'}
							<div>
								<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Message</label>
								<textarea bind:value={node.data.content} rows={2} class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Transfer to human agent" onclick={(e) => e.stopPropagation()}></textarea>
							</div>
						{/if}

						<!-- Delete -->
						<button
							onclick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
							class="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition mt-1"
						>
							<Trash2 class="w-3 h-3" />
							Delete node
						</button>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Mobile Chat Preview -->
		<div class="border-t border-border mt-4">
			<div class="px-4 py-3 bg-card/50">
				<h2 class="text-sm font-display font-bold text-foreground uppercase tracking-wider">Conversation Preview</h2>
				<p class="text-[10px] text-muted-foreground mt-0.5">Simulated flow walkthrough</p>
			</div>
			<div class="px-4 py-4 space-y-3">
				{#each chatMessages as msg}
					{#if msg.type === 'label'}
						<div class="flex items-center gap-2 py-1">
							<div class="flex-1 h-px bg-border"></div>
							<span class="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{msg.content}</span>
							<div class="flex-1 h-px bg-border"></div>
						</div>
					{:else if msg.type === 'bot'}
						<div class="flex gap-2 items-start max-w-[85%]">
							<div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
								<Bot class="w-3.5 h-3.5 text-muted-foreground" />
							</div>
							<div class="bg-muted rounded-2xl rounded-tl-md px-3.5 py-2.5">
								<p class="text-xs text-foreground leading-relaxed">{msg.content}</p>
							</div>
						</div>
					{:else if msg.type === 'user'}
						<div class="flex justify-end">
							<div class="bg-primary rounded-2xl rounded-tr-md px-3.5 py-2.5 max-w-[75%]">
								<p class="text-xs text-primary-foreground leading-relaxed">{msg.content}</p>
							</div>
						</div>
					{:else if msg.type === 'system'}
						<div class="flex justify-center">
							<span class="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full italic">{msg.content}</span>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Bottom padding for mobile scroll -->
		<div class="h-8"></div>
	</div>
</div>

<!-- ==================== DESKTOP VIEW ==================== -->
<div class="hidden md:flex flex-col h-screen overflow-hidden">
	<!-- Toolbar -->
	<div
		class="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border shrink-0 z-20"
	>
		<div class="flex items-center gap-3">
			<a
				href="/chatbot"
				class="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<input
				type="text"
				bind:value={flowName}
				class="bg-transparent text-foreground font-display font-bold text-lg uppercase tracking-wider border-none outline-none focus:ring-0 w-48"
			/>
		</div>

		<div class="flex items-center gap-2">
			<!-- Zoom controls -->
			<div class="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
				<button onclick={handleZoomOut} class="p-1 hover:bg-background rounded transition text-muted-foreground hover:text-foreground">
					<Minus class="w-3.5 h-3.5" />
				</button>
				<button
					onclick={handleZoomReset}
					class="px-2 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground transition"
				>
					{Math.round(zoom * 100)}%
				</button>
				<button onclick={handleZoomIn} class="p-1 hover:bg-background rounded transition text-muted-foreground hover:text-foreground">
					<Plus class="w-3.5 h-3.5" />
				</button>
			</div>

			<!-- Add node -->
			<div class="relative">
				<button
					onclick={() => (showAddMenu = !showAddMenu)}
					class="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition"
				>
					<Plus class="w-4 h-4" />
					Add Node
					<ChevronDown class="w-3 h-3" />
				</button>
				{#if showAddMenu}
					<div class="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden">
						{#each Object.entries(nodeTypeConfig) as [type, cfg]}
							<button
								onclick={() => addNode(type as NodeType)}
								class="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition text-left"
							>
								<div class="w-2.5 h-2.5 rounded-full {cfg.color}"></div>
								<cfg.icon class="w-4 h-4 text-muted-foreground" />
								{cfg.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Chat Preview Toggle -->
			<button
				onclick={() => (showChatPreview = !showChatPreview)}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition {showChatPreview ? 'bg-primary/10 text-primary border border-primary/30' : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'}"
			>
				{#if showChatPreview}
					<EyeOff class="w-3.5 h-3.5" />
				{:else}
					<Eye class="w-3.5 h-3.5" />
				{/if}
				Preview
			</button>

			<a
				href="/chatbot/preview"
				class="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
			>
				<Play class="w-3.5 h-3.5" />
				Test
			</a>
			<button
				class="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20"
			>
				<Save class="w-3.5 h-3.5" />
				Save
			</button>
		</div>
	</div>

	<!-- Canvas + Sidebar + Chat Preview -->
	<div class="flex flex-1 overflow-hidden relative">
		<!-- Canvas -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex-1 relative overflow-hidden cursor-grab select-none"
			class:cursor-grabbing={isPanning}
			onmousedown={handleCanvasMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			role="application"
			aria-label="Flow editor canvas"
		>
			<!-- Grid background -->
			<div
				class="absolute inset-0 pointer-events-none"
				style="background-image: radial-gradient(circle, hsl(0 0% 20%) 1px, transparent 1px); background-size: {20 * zoom}px {20 * zoom}px; background-position: {panOffset.x}px {panOffset.y}px;"
			></div>

			<!-- SVG edges layer -->
			<svg
				class="absolute inset-0 w-full h-full pointer-events-none z-0"
				style="overflow: visible;"
			>
				<g
					transform="translate({panOffset.x}, {panOffset.y}) scale({zoom})"
				>
					{#each edges as edge (edge.id)}
						{@const sourceNode = nodes.find((n) => n.id === edge.source)}
						{@const targetNode = nodes.find((n) => n.id === edge.target)}
						{#if sourceNode && targetNode}
							<path
								d={getEdgePath(sourceNode, targetNode)}
								fill="none"
								stroke={getEdgeColor(edge.id)}
								stroke-width={2}
								stroke-opacity={0.6}
							/>
						{/if}
					{/each}
				</g>
			</svg>

			<!-- Nodes layer -->
			<div
				class="absolute inset-0 z-10"
				style="transform: translate({panOffset.x}px, {panOffset.y}px) scale({zoom}); transform-origin: 0 0;"
			>
				{#each nodes as node (node.id)}
					{@const config = nodeTypeConfig[node.type]}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flow-node absolute w-[200px] rounded-lg border bg-card shadow-lg transition-shadow duration-150"
						class:ring-2={selectedNodeId === node.id}
						class:ring-primary={selectedNodeId === node.id}
						class:border-border={selectedNodeId !== node.id}
						class:border-primary={selectedNodeId === node.id}
						style="left: {node.position.x}px; top: {node.position.y}px;"
						onmousedown={(e) => handleNodeMouseDown(e, node.id)}
						onclick={() => selectNode(node.id)}
						role="button"
						tabindex="0"
					>
						<!-- Input handle -->
						<div
							class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-card {config.color} z-20"
						></div>

						<!-- Header -->
						<div class="flex items-center gap-2 px-3 py-2 rounded-t-lg {config.color}">
							<config.icon class="w-3.5 h-3.5 text-white" />
							<span class="text-xs font-semibold text-white uppercase tracking-wide truncate"
								>{config.label}</span
							>
						</div>

						<!-- Body -->
						<div class="px-3 py-2.5 space-y-1.5">
							<p class="text-xs font-medium text-foreground truncate">{node.data.label}</p>

							{#if node.type === 'trigger'}
								<p class="text-[10px] text-muted-foreground">
									When: <span class="text-yellow-400">{node.data.content}</span>
								</p>
							{:else if node.type === 'message'}
								<p class="text-[10px] text-muted-foreground line-clamp-2">
									{node.data.content}
								</p>
							{:else if node.type === 'question'}
								<p class="text-[10px] text-muted-foreground truncate">{node.data.content}</p>
								{#if node.data.options}
									<div class="flex flex-wrap gap-1 mt-1">
										{#each node.data.options.slice(0, 3) as opt}
											<span
												class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20"
												>{opt}</span
											>
										{/each}
										{#if node.data.options.length > 3}
											<span class="text-[9px] text-muted-foreground">+{node.data.options.length - 3}</span>
										{/if}
									</div>
								{/if}
							{:else if node.type === 'condition'}
								<p class="text-[10px] text-muted-foreground">
									If: <span class="text-orange-400">{node.data.variable}</span>
									{node.data.operator}
									<span class="text-orange-400">{node.data.value}</span>
								</p>
							{:else if node.type === 'action'}
								<p class="text-[10px] text-muted-foreground">
									Action: <span class="text-purple-400">{node.data.actionType ?? 'configure'}</span>
								</p>
							{:else if node.type === 'delay'}
								<p class="text-[10px] text-muted-foreground">
									Wait: <span class="text-cyan-400">{node.data.delaySeconds ?? 2}s</span>
								</p>
							{:else if node.type === 'handoff'}
								<p class="text-[10px] text-muted-foreground">Transfer to human agent</p>
							{/if}
						</div>

						<!-- Output handle -->
						<div
							class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-card {config.color} z-20"
						></div>
					</div>
				{/each}
			</div>

			<!-- Minimap -->
			<div class="absolute bottom-4 right-4 w-36 h-24 bg-card/80 backdrop-blur border border-border rounded-lg overflow-hidden z-30 pointer-events-none">
				<svg class="w-full h-full" viewBox="{minimapBounds.minX} {minimapBounds.minY} {minimapBounds.maxX - minimapBounds.minX} {minimapBounds.maxY - minimapBounds.minY}">
					{#each edges as edge}
						{@const src = nodes.find((n) => n.id === edge.source)}
						{@const tgt = nodes.find((n) => n.id === edge.target)}
						{#if src && tgt}
							<line
								x1={src.position.x + 100}
								y1={src.position.y + 40}
								x2={tgt.position.x + 100}
								y2={tgt.position.y}
								stroke="hsl(0 0% 30%)"
								stroke-width={4}
							/>
						{/if}
					{/each}
					{#each minimapNodes as mn}
						<rect x={mn.x} y={mn.y} width={200} height={60} rx={6} fill={mn.color} opacity={0.5} />
					{/each}
					<!-- viewport indicator -->
					<rect
						x={-panOffset.x / zoom}
						y={-panOffset.y / zoom}
						width={800 / zoom}
						height={600 / zoom}
						fill="none"
						stroke="hsl(0 72% 51%)"
						stroke-width={6}
						rx={4}
						opacity={0.5}
					/>
				</svg>
			</div>
		</div>

		<!-- Node Properties Sidebar -->
		{#if sidebarOpen && selectedNode}
			{@const cfg = nodeTypeConfig[selectedNode.type]}
			<div class="w-80 bg-card border-l border-border shrink-0 flex flex-col overflow-y-auto z-20">
				<!-- Sidebar header -->
				<div class="flex items-center justify-between px-4 py-3 border-b border-border">
					<div class="flex items-center gap-2">
						<div class="w-2.5 h-2.5 rounded-full {cfg.color}"></div>
						<span class="text-sm font-semibold text-foreground">{cfg.label} Node</span>
					</div>
					<button onclick={closeSidebar} class="p-1 hover:bg-muted rounded transition text-muted-foreground">
						<X class="w-4 h-4" />
					</button>
				</div>

				<div class="p-4 space-y-4 flex-1">
					<!-- Label -->
					<div>
						<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Label</label>
						<input
							type="text"
							bind:value={selectedNode.data.label}
							class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
						/>
					</div>

					<!-- Type-specific config -->
					{#if selectedNode.type === 'trigger'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Keywords</label>
							<input
								type="text"
								bind:value={selectedNode.data.content}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
								placeholder="comma separated keywords"
							/>
						</div>
					{:else if selectedNode.type === 'message'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Message Content</label>
							<textarea
								bind:value={selectedNode.data.content}
								rows={5}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
							></textarea>
						</div>
					{:else if selectedNode.type === 'question'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Question</label>
							<textarea
								bind:value={selectedNode.data.content}
								rows={3}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
							></textarea>
						</div>
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Options</label>
							<div class="space-y-1.5">
								{#if selectedNode.data.options}
									{#each selectedNode.data.options as _opt, idx}
										<div class="flex items-center gap-1.5">
											<input
												type="text"
												bind:value={selectedNode.data.options[idx]}
												class="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
											/>
											<button
												onclick={() => removeOption(selectedNode!, idx)}
												class="p-1 text-destructive hover:bg-destructive/10 rounded transition"
											>
												<X class="w-3 h-3" />
											</button>
										</div>
									{/each}
								{/if}
							</div>
							<button
								onclick={() => addOption(selectedNode!)}
								class="flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 transition"
							>
								<Plus class="w-3 h-3" />
								Add option
							</button>
						</div>
					{:else if selectedNode.type === 'condition'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Variable</label>
							<input
								type="text"
								bind:value={selectedNode.data.variable}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
							/>
						</div>
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Operator</label>
							<select
								bind:value={selectedNode.data.operator}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
							>
								<option value="equals">equals</option>
								<option value="not_equals">not equals</option>
								<option value="contains">contains</option>
								<option value="starts_with">starts with</option>
								<option value="exists">exists</option>
							</select>
						</div>
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Value</label>
							<input
								type="text"
								bind:value={selectedNode.data.value}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
							/>
						</div>
					{:else if selectedNode.type === 'action'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Action Type</label>
							<select
								bind:value={selectedNode.data.actionType}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
							>
								<option value="set_variable">Set Variable</option>
								<option value="api_call">API Call</option>
								<option value="redirect">Redirect to Flow</option>
								<option value="send_gallery">Send Gallery</option>
							</select>
						</div>
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</label>
							<textarea
								bind:value={selectedNode.data.content}
								rows={3}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
							></textarea>
						</div>
					{:else if selectedNode.type === 'delay'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Delay (seconds)</label>
							<input
								type="number"
								bind:value={selectedNode.data.delaySeconds}
								min={1}
								max={300}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
							/>
						</div>
					{:else if selectedNode.type === 'handoff'}
						<div>
							<label class="block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Handoff Message</label>
							<textarea
								bind:value={selectedNode.data.content}
								rows={3}
								class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
								placeholder="Transfer to human agent"
							></textarea>
						</div>
					{/if}
				</div>

				<!-- Delete button -->
				<div class="p-4 border-t border-border">
					<button
						onclick={() => deleteNode(selectedNode!.id)}
						class="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg transition"
					>
						<Trash2 class="w-3.5 h-3.5" />
						Delete Node
					</button>
				</div>
			</div>
		{/if}

		<!-- Chat Preview Panel (Desktop) -->
		{#if showChatPreview}
			<div class="w-80 bg-card border-l border-border shrink-0 flex flex-col overflow-hidden z-20">
				<!-- Header -->
				<div class="flex items-center justify-between px-4 py-3 border-b border-border">
					<div>
						<h3 class="text-sm font-semibold text-foreground">Flow Preview</h3>
						<p class="text-[10px] text-muted-foreground">{flowName}</p>
					</div>
					<button onclick={() => (showChatPreview = false)} class="p-1 hover:bg-muted rounded transition text-muted-foreground">
						<X class="w-4 h-4" />
					</button>
				</div>

				<!-- Chat Messages -->
				<div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
					{#each chatMessages as msg}
						{#if msg.type === 'label'}
							<div class="flex items-center gap-2 py-1">
								<div class="flex-1 h-px bg-border"></div>
								<span class="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{msg.content}</span>
								<div class="flex-1 h-px bg-border"></div>
							</div>
						{:else if msg.type === 'bot'}
							<div class="flex gap-2 items-start">
								<div class="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
									<Bot class="w-3.5 h-3.5 text-muted-foreground" />
								</div>
								<div class="bg-muted rounded-2xl rounded-tl-md px-3 py-2 max-w-[85%]">
									<p class="text-xs text-foreground leading-relaxed">{msg.content}</p>
								</div>
							</div>
						{:else if msg.type === 'user'}
							<div class="flex justify-end">
								<div class="bg-primary rounded-2xl rounded-tr-md px-3 py-2 max-w-[80%]">
									<p class="text-xs text-primary-foreground leading-relaxed">{msg.content}</p>
								</div>
							</div>
						{:else if msg.type === 'system'}
							<div class="flex justify-center">
								<span class="text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full italic">{msg.content}</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
