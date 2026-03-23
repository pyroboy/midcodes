<script lang="ts">
	import {
		Hash,
		Send,
		Menu,
		X,
		Users,
		MapPin,
		ChevronRight,
		MessageSquare
	} from 'lucide-svelte';

	// ==========================================
	// AUTH STATE
	// ==========================================
	let isLoggedIn = $state(false);
	let userName = $state('');
	let loginEmail = $state('');
	let loginPassword = $state('');
	let loginError = $state('');
	let isSignUp = $state(false);
	let signUpName = $state('');

	function handleLogin() {
		if (!loginEmail.trim() || !loginPassword.trim()) {
			loginError = 'Please fill in all fields';
			return;
		}
		// Mock: accept any input
		const namePart = loginEmail.split('@')[0];
		userName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
		isLoggedIn = true;
		loginError = '';
	}

	function handleSignUp() {
		if (!signUpName.trim() || !loginEmail.trim() || !loginPassword.trim()) {
			loginError = 'Please fill in all fields';
			return;
		}
		// Mock: accept any input
		userName = signUpName.trim();
		isLoggedIn = true;
		loginError = '';
	}

	// Alias for compatibility
	let hasJoined = $derived(isLoggedIn);
	let nickname = $derived(userName);

	// ==========================================
	// AVATAR HELPERS
	// ==========================================
	const avatarColors = [
		'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
		'bg-amber-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500',
		'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-lime-500'
	];

	function getAvatarColor(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return avatarColors[Math.abs(hash) % avatarColors.length];
	}

	function getInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}

	// ==========================================
	// CHANNELS
	// ==========================================
	type Channel = {
		id: string;
		name: string;
		category: string;
	};

	const channels: Channel[] = [
		{ id: 'general', name: 'general', category: 'GENERAL' },
		{ id: 'looking-for-game', name: 'looking-for-game', category: 'GENERAL' },
		{ id: 'bgc-pickle', name: 'bgc-pickle', category: 'VENUES' },
		{ id: 'makati-circuit', name: 'makati-circuit', category: 'VENUES' },
		{ id: 'kapitolyo', name: 'kapitolyo', category: 'VENUES' },
		{ id: 'alabang', name: 'alabang', category: 'VENUES' },
		{ id: 'rizal-park', name: 'rizal-park', category: 'VENUES' },
		{ id: 'beginners-corner', name: 'beginners-corner', category: 'SKILL LEVELS' },
		{ id: 'intermediate-rally', name: 'intermediate-rally', category: 'SKILL LEVELS' },
		{ id: 'advanced-play', name: 'advanced-play', category: 'SKILL LEVELS' }
	];

	let activeChannel = $state('general');
	let showMobileSidebar = $state(false);

	let channelsByCategory = $derived.by(() => {
		const grouped: Record<string, Channel[]> = {};
		for (const ch of channels) {
			if (!grouped[ch.category]) grouped[ch.category] = [];
			grouped[ch.category].push(ch);
		}
		return grouped;
	});

	// ==========================================
	// MESSAGE TYPES
	// ==========================================
	type ChatMessage = {
		id: string;
		author: string;
		content: string;
		timestamp: string;
		type: 'message';
	};

	type GameRequest = {
		id: string;
		author: string;
		lookingFor: string;
		when: string;
		where: string;
		level: string;
		spotsNeeded: number;
		timestamp: string;
		type: 'game-request';
	};

	type Message = ChatMessage | GameRequest;

	// ==========================================
	// MOCK MESSAGES
	// ==========================================
	const mockMessages: Record<string, Message[]> = {
		general: [
			{ id: 'g1', author: 'Coach Rey', content: 'Good morning mga picklers! Great weather for outdoor play today \u{1F3D3}', timestamp: '8:02 AM', type: 'message' },
			{ id: 'g2', author: 'Maria B.', content: 'Anyone tried the new courts sa SM Aura? How are they?', timestamp: '8:05 AM', type: 'message' },
			{ id: 'g3', author: 'Paolo G.', content: 'Maganda! Indoor, aircon, but P1,200/hr on weekends', timestamp: '8:07 AM', type: 'message' },
			{ id: 'g4', author: 'JayR', content: 'Worth it naman if split ng 4', timestamp: '8:08 AM', type: 'message' },
			{ id: 'g5', author: 'PickleKing_PH', content: 'Just got back from Cebu tournament. Grabe yung competition!', timestamp: '8:15 AM', type: 'message' },
			{ id: 'g6', author: 'Maria B.', content: 'Nice! What placement?', timestamp: '8:16 AM', type: 'message' },
			{ id: 'g7', author: 'PickleKing_PH', content: '3rd place mixed doubles! \u{1F949}', timestamp: '8:17 AM', type: 'message' },
			{ id: 'g8', author: 'Coach Rey', content: 'Congrats! Cebu picklers are legit', timestamp: '8:18 AM', type: 'message' },
			{ id: 'g9', author: 'NewPlayer_01', content: 'Hi everyone! Just started playing last week. Any beginner tips?', timestamp: '8:25 AM', type: 'message' },
			{ id: 'g10', author: 'JayR', content: 'Welcome! Focus on your dinks and kitchen positioning first', timestamp: '8:27 AM', type: 'message' },
			{ id: 'g11', author: 'Maria B.', content: 'Join the beginner clinic sa BGC every Saturday 9AM', timestamp: '8:28 AM', type: 'message' },
			{ id: 'g12', author: 'Coach Rey', content: 'Also check out Pickle PH Beginners group on FB -- super supportive community', timestamp: '8:30 AM', type: 'message' },
			{ id: 'g13', author: 'Rina S.', content: 'Who has extra paddles? My friend wants to try pickleball for the first time', timestamp: '8:45 AM', type: 'message' },
			{ id: 'g14', author: 'Carlos M.', content: 'I have two spare Selkirks. Hit me up if you need to borrow', timestamp: '8:47 AM', type: 'message' },
			{ id: 'g15', author: 'Bea T.', content: 'Circuit Makati has rental paddles for P100/hr too', timestamp: '8:48 AM', type: 'message' },
			{ id: 'g16', author: 'Manila Pickler', content: 'Heads up -- Kapitolyo courts will be closed for maintenance this Wednesday', timestamp: '9:00 AM', type: 'message' },
			{ id: 'g17', author: 'JayR', content: 'Thanks for the heads up!', timestamp: '9:02 AM', type: 'message' },
			{ id: 'g18', author: 'PickleKing_PH', content: 'Anyone watching the PPA Tour this weekend? Ben Johns vs Tyson McGuffin', timestamp: '9:15 AM', type: 'message' },
			{ id: 'g19', author: 'Coach Rey', content: 'Streaming it at BGC if anyone wants to do a watch party \u{1F3AC}', timestamp: '9:16 AM', type: 'message' },
			{ id: 'g20', author: 'Paolo G.', content: 'Count me in! What time?', timestamp: '9:17 AM', type: 'message' },
			{ id: 'g21', author: 'NewPlayer_01', content: 'What paddle do you guys recommend for a beginner? Budget around P3,000', timestamp: '9:30 AM', type: 'message' },
			{ id: 'g22', author: 'Carlos M.', content: 'JOOLA Ben Johns Hyperion at that range. Great control for learning', timestamp: '9:32 AM', type: 'message' },
			{ id: 'g23', author: 'Maria B.', content: 'Or the Head Radical Tour -- lightweight and forgiving on mishits', timestamp: '9:33 AM', type: 'message' },
			{ id: 'g24', author: 'Rina S.', content: 'Decathlon has decent starter paddles for P1,500 too if you want to test the waters first', timestamp: '9:35 AM', type: 'message' },
			{ id: 'g25', author: 'JayR', content: 'Pro tip: dont spend too much on your first paddle. You will know what you want after a month of playing', timestamp: '9:36 AM', type: 'message' },
			{ id: 'g26', author: 'Coach Rey', content: 'Solid advice. The best paddle is the one that gets you on the court \u{1F44D}', timestamp: '9:38 AM', type: 'message' },
			{ id: 'g27', author: 'Manila Pickler', content: 'Anyone else struggle with their third shot drop? Mine keeps going into the net', timestamp: '9:50 AM', type: 'message' },
			{ id: 'g28', author: 'PickleKing_PH', content: 'Open paddle face more and aim higher -- it should arc over the net, not go straight', timestamp: '9:52 AM', type: 'message' },
			{ id: 'g29', author: 'Bea T.', content: 'Practice with a target on the other side. It helps with consistency!', timestamp: '9:53 AM', type: 'message' },
			{ id: 'g30', author: 'Coach Rey', content: 'Come to my drill session Saturday -- we focus on drops and dinks the entire 2 hours', timestamp: '9:55 AM', type: 'message' },
		],
		'looking-for-game': [
			{ id: 'lfg1', author: 'Marco P.', lookingFor: 'Doubles Partner', when: 'Today, 6:00 PM', where: 'BGC Pickle Arena', level: 'Intermediate', spotsNeeded: 1, timestamp: '7:30 AM', type: 'game-request' },
			{ id: 'lfg2', author: 'Barkada ni Joy', lookingFor: '2 more players', when: 'Tomorrow, 7:00 AM', where: 'Circuit Makati', level: 'All Welcome', spotsNeeded: 2, timestamp: '8:00 AM', type: 'game-request' },
			{ id: 'lfg3', author: 'Carlos M.', lookingFor: 'Singles Match', when: 'Today, 4:00 PM', where: 'Alabang Padel & Pickle Club', level: 'Advanced', spotsNeeded: 1, timestamp: '8:30 AM', type: 'game-request' },
			{ id: 'lfg4', author: 'Rina S.', lookingFor: 'Drill Partner', when: 'Saturday, 9:00 AM', where: 'BGC Pickle Arena', level: 'Intermediate', spotsNeeded: 1, timestamp: '9:00 AM', type: 'game-request' },
			{ id: 'lfg5', author: 'Kapitolyo Crew', lookingFor: '4 players for round robin', when: 'Sunday, 3:00 PM', where: 'Kapitolyo Sports Complex', level: 'All Levels', spotsNeeded: 4, timestamp: '9:15 AM', type: 'game-request' },
			{ id: 'lfg6', author: 'Coach Rey', lookingFor: 'Mixed Doubles Team', when: 'Today, 7:00 PM', where: 'Pickleball Philippines BGC', level: 'Intermediate+', spotsNeeded: 3, timestamp: '9:30 AM', type: 'game-request' },
			{ id: 'lfg7', author: 'NewPlayer_01', lookingFor: 'Patient partner for practice', when: 'Weekday evenings', where: 'Any venue near Pasig', level: 'Beginner', spotsNeeded: 1, timestamp: '9:45 AM', type: 'game-request' },
		],
		'bgc-pickle': [
			{ id: 'bgc1', author: 'Admin_BGC', content: 'Court 3 and 4 have been resurfaced! Much better grip now \u{1F64C}', timestamp: '7:00 AM', type: 'message' },
			{ id: 'bgc2', author: 'Paolo G.', content: 'Finally! Those courts were getting slippery', timestamp: '7:15 AM', type: 'message' },
			{ id: 'bgc3', author: 'Maria B.', content: 'Pro tip: courts 5-6 are usually available during lunch break weekdays. Nobody books them!', timestamp: '7:30 AM', type: 'message' },
			{ id: 'bgc4', author: 'JayR', content: 'Parking update -- they opened the new basement level. Way easier to find spots now', timestamp: '8:00 AM', type: 'message' },
			{ id: 'bgc5', author: 'PickleKing_PH', content: 'Anyone know if they still do the early bird rate? P500 before 7AM?', timestamp: '8:30 AM', type: 'message' },
			{ id: 'bgc6', author: 'Admin_BGC', content: 'Yes! P500/hr before 7AM weekdays. Best deal in BGC for pickle \u{1F389}', timestamp: '8:35 AM', type: 'message' },
			{ id: 'bgc7', author: 'Coach Rey', content: 'The cafe inside now serves smoothie bowls. Perfect post-game fuel', timestamp: '9:00 AM', type: 'message' },
			{ id: 'bgc8', author: 'Bea T.', content: 'Do they have shower facilities? Planning to play before work', timestamp: '9:15 AM', type: 'message' },
			{ id: 'bgc9', author: 'Admin_BGC', content: 'Yes, full locker rooms with showers on the 2nd floor. P50 towel rental available', timestamp: '9:20 AM', type: 'message' },
		],
		'makati-circuit': [
			{ id: 'mk1', author: 'Makati Pickler', content: 'Circuit has the best lighting for evening games. Crystal clear visibility', timestamp: '7:00 AM', type: 'message' },
			{ id: 'mk2', author: 'Carlos M.', content: 'Agreed. Only downside is parking can be tricky during rush hour', timestamp: '7:30 AM', type: 'message' },
			{ id: 'mk3', author: 'Rina S.', content: 'They just added 2 more courts! Total of 8 now', timestamp: '8:00 AM', type: 'message' },
			{ id: 'mk4', author: 'Paolo G.', content: 'Weekend rates went up to P700/hr though \u{1F62C}', timestamp: '8:30 AM', type: 'message' },
			{ id: 'mk5', author: 'JayR', content: 'Still worth it with 4 players. P175 each for an hour is fine', timestamp: '8:45 AM', type: 'message' },
			{ id: 'mk6', author: 'Coach Rey', content: 'They do group discounts for 10+ bookings/month. Ask at the front desk', timestamp: '9:00 AM', type: 'message' },
		],
		'kapitolyo': [
			{ id: 'kap1', author: 'Kapitolyo Regular', content: 'Heads up -- courts closed Wednesday for maintenance', timestamp: '7:00 AM', type: 'message' },
			{ id: 'kap2', author: 'Manila Pickler', content: 'Thanks for the notice! Good thing I didnt book for Wed', timestamp: '7:30 AM', type: 'message' },
			{ id: 'kap3', author: 'Bea T.', content: 'The covered courts are great during rainy season. Never had to cancel!', timestamp: '8:00 AM', type: 'message' },
			{ id: 'kap4', author: 'JayR', content: 'Best food nearby too. Hit Kapitolyo restaurants after playing', timestamp: '8:30 AM', type: 'message' },
			{ id: 'kap5', author: 'Coach Rey', content: 'Only 3 courts so book early. They fill up fast on weekends', timestamp: '9:00 AM', type: 'message' },
		],
		'alabang': [
			{ id: 'alb1', author: 'Alabang Player', content: 'This place is PREMIUM. 10 courts, all indoor, full aircon', timestamp: '7:00 AM', type: 'message' },
			{ id: 'alb2', author: 'Carlos M.', content: 'Worth every peso. The pro shop has great paddle selection too', timestamp: '7:30 AM', type: 'message' },
			{ id: 'alb3', author: 'Rina S.', content: 'They offer coaching sessions for P500/hr. Coach David is excellent', timestamp: '8:00 AM', type: 'message' },
			{ id: 'alb4', author: 'Paolo G.', content: 'Bit far from the city but if you live south, this is THE place', timestamp: '8:30 AM', type: 'message' },
			{ id: 'alb5', author: 'PickleKing_PH', content: 'They host monthly tournaments too. Next one is end of March', timestamp: '9:00 AM', type: 'message' },
		],
		'rizal-park': [
			{ id: 'rz1', author: 'Park Regular', content: 'Outdoor courts so bring sunscreen for morning games!', timestamp: '7:00 AM', type: 'message' },
			{ id: 'rz2', author: 'NewPlayer_01', content: 'Cheapest courts I found at P350/hr. Great for beginners who dont want to spend a lot', timestamp: '7:30 AM', type: 'message' },
			{ id: 'rz3', author: 'Manila Pickler', content: 'Lights are good for evening play up to 9PM', timestamp: '8:00 AM', type: 'message' },
			{ id: 'rz4', author: 'Coach Rey', content: 'Fun community here. Lots of pickup games on weekend mornings', timestamp: '8:30 AM', type: 'message' },
			{ id: 'rz5', author: 'Bea T.', content: 'Bring your own water though. The water station is sometimes out of service', timestamp: '9:00 AM', type: 'message' },
		],
		'beginners-corner': [
			{ id: 'beg1', author: 'Coach Rey', content: 'Welcome beginners! Rule #1: Always be at the kitchen line. Thats where points are won \u{1F3C6}', timestamp: '7:00 AM', type: 'message' },
			{ id: 'beg2', author: 'NewPlayer_01', content: 'What even is the kitchen? I keep hearing this term', timestamp: '7:15 AM', type: 'message' },
			{ id: 'beg3', author: 'Maria B.', content: 'The kitchen (NVZ) is the 7-foot zone on each side of the net. You cant volley while standing in it!', timestamp: '7:20 AM', type: 'message' },
			{ id: 'beg4', author: 'Coach Rey', content: 'Think of it like this: you want to get TO the kitchen line, but dont step IN the kitchen to hit volleys', timestamp: '7:22 AM', type: 'message' },
			{ id: 'beg5', author: 'Bea T.', content: 'I learned the hard way lol. Kept getting foot faults my first month', timestamp: '7:30 AM', type: 'message' },
			{ id: 'beg6', author: 'NewPlayer_01', content: 'Also whats the difference between a dink and a drop?', timestamp: '8:00 AM', type: 'message' },
			{ id: 'beg7', author: 'JayR', content: 'Dink = soft shot at the kitchen line. Drop = soft shot from the baseline that lands in the kitchen area', timestamp: '8:05 AM', type: 'message' },
			{ id: 'beg8', author: 'Maria B.', content: 'Both are about touch and placement, not power. Pickle is a finesse game!', timestamp: '8:07 AM', type: 'message' },
			{ id: 'beg9', author: 'Rina S.', content: 'Best beginner tip I got: just keep the ball in play. Let your opponent make mistakes', timestamp: '8:30 AM', type: 'message' },
			{ id: 'beg10', author: 'Coach Rey', content: 'Exactly! Patience wins games at every level. The best players are the most patient \u{1F9D8}', timestamp: '8:35 AM', type: 'message' },
		],
		'intermediate-rally': [
			{ id: 'int1', author: 'PickleKing_PH', content: 'Intermediate tip: start working on your erne. Its a game changer for doubles', timestamp: '7:00 AM', type: 'message' },
			{ id: 'int2', author: 'Carlos M.', content: 'The erne is so satisfying when you nail it. The look on peoples faces \u{1F602}', timestamp: '7:15 AM', type: 'message' },
			{ id: 'int3', author: 'Coach Rey', content: 'Focus on your serve return depth first. A deep return gives you time to get to the kitchen line', timestamp: '7:30 AM', type: 'message' },
			{ id: 'int4', author: 'Paolo G.', content: 'Been working on my backhand rolls. Any drills you recommend?', timestamp: '8:00 AM', type: 'message' },
			{ id: 'int5', author: 'Maria B.', content: 'Wall drills! 15 min a day of backhand rolls against a wall. You will see improvement in a week', timestamp: '8:05 AM', type: 'message' },
			{ id: 'int6', author: 'JayR', content: 'Also stacking strategy for doubles. Game changer once you and your partner figure it out', timestamp: '8:30 AM', type: 'message' },
			{ id: 'int7', author: 'Rina S.', content: 'Anyone doing the intermediate tournament at Circuit next month?', timestamp: '9:00 AM', type: 'message' },
			{ id: 'int8', author: 'PickleKing_PH', content: 'Signed up already! Lets get a practice group going before then', timestamp: '9:05 AM', type: 'message' },
		],
		'advanced-play': [
			{ id: 'adv1', author: 'PickleKing_PH', content: 'Lets talk strategy: when to speed up vs stay patient in a dink rally?', timestamp: '7:00 AM', type: 'message' },
			{ id: 'adv2', author: 'Carlos M.', content: 'Speed up when opponent is leaning or off balance. But the key is disguise -- same motion, different shot', timestamp: '7:15 AM', type: 'message' },
			{ id: 'adv3', author: 'Coach Rey', content: 'At advanced level, the mental game is 80%. Reading your opponent matters more than raw skill', timestamp: '7:30 AM', type: 'message' },
			{ id: 'adv4', author: 'Paolo G.', content: 'Counterattack off the speed up is where rallies are won. Dont back up, hold your ground', timestamp: '8:00 AM', type: 'message' },
			{ id: 'adv5', author: 'Manila Pickler', content: 'Two-handed backhand counters are the meta right now. So much more power and control', timestamp: '8:30 AM', type: 'message' },
			{ id: 'adv6', author: 'PickleKing_PH', content: 'Anyone analyzing the latest Ben Johns matches? His serve return positioning is next level', timestamp: '9:00 AM', type: 'message' },
			{ id: 'adv7', author: 'Coach Rey', content: 'He uses the middle gap better than anyone. Always targets the confusion zone between partners', timestamp: '9:05 AM', type: 'message' },
			{ id: 'adv8', author: 'Carlos M.', content: 'PH advanced scene is growing fast. We need more 4.5+ level events here', timestamp: '9:30 AM', type: 'message' },
		],
	};

	// ==========================================
	// LOCAL MESSAGES (user can add)
	// ==========================================
	let localMessages = $state<Record<string, Message[]>>({});
	let messageInput = $state('');
	let messageIdCounter = $state(1000);

	function sendMessage() {
		if (!messageInput.trim() || !hasJoined) return;
		const channelId = activeChannel;
		if (!localMessages[channelId]) localMessages[channelId] = [];
		localMessages[channelId] = [
			...localMessages[channelId],
			{
				id: `local-${messageIdCounter++}`,
				author: nickname,
				content: messageInput.trim(),
				timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
				type: 'message'
			}
		];
		messageInput = '';
	}

	let allChannelMessages = $derived.by(() => {
		const result: Record<string, Message[]> = {};
		for (const ch of channels) {
			result[ch.id] = [
				...(mockMessages[ch.id] || []),
				...(localMessages[ch.id] || [])
			];
		}
		return result;
	});

	let currentMessages = $derived(allChannelMessages[activeChannel] || []);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function selectChannel(id: string) {
		activeChannel = id;
		showMobileSidebar = false;
	}

	// Online count
	const onlineCount = 42;

	function levelBadgeColor(level: string): string {
		if (level.includes('Advanced')) return 'bg-red-500/10 text-red-600 border-red-200';
		if (level.includes('Intermediate')) return 'bg-amber-500/10 text-amber-600 border-amber-200';
		if (level.includes('Beginner')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
		return 'bg-violet-500/10 text-violet-600 border-violet-200';
	}
</script>

<svelte:head>
	<title>Community - Court Sniper</title>
</svelte:head>

<!-- LOGIN SCREEN -->
{#if !isLoggedIn}
	<div class="flex h-full items-center justify-center bg-muted/30 p-4">
		<div class="w-full max-w-sm rounded-2xl border-2 border-border bg-background p-6 shadow-2xl">
			<div class="text-center">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
					<MessageSquare class="h-7 w-7 text-primary" />
				</div>
				<h2 class="mt-4 text-xl font-extrabold">
					{isSignUp ? 'Create Account' : 'Sign in to Community'}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{isSignUp ? 'Join the PH pickleball community' : 'Chat with Filipino picklers nationwide'}
				</p>
			</div>

			{#if loginError}
				<div class="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
					{loginError}
				</div>
			{/if}

			<div class="mt-5 space-y-3">
				{#if isSignUp}
					<div>
						<label for="signup-name" class="mb-1 block text-xs font-medium text-muted-foreground">Display Name</label>
						<input
							id="signup-name"
							type="text"
							bind:value={signUpName}
							placeholder="e.g. PickleMaster_PH"
							maxlength={20}
							class="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
						/>
					</div>
				{/if}
				<div>
					<label for="login-email" class="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
					<input
						id="login-email"
						type="email"
						bind:value={loginEmail}
						placeholder="you@example.com"
						onkeydown={(e) => { if (e.key === 'Enter') isSignUp ? handleSignUp() : handleLogin(); }}
						class="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					/>
				</div>
				<div>
					<label for="login-password" class="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
					<input
						id="login-password"
						type="password"
						bind:value={loginPassword}
						placeholder="Enter your password"
						onkeydown={(e) => { if (e.key === 'Enter') isSignUp ? handleSignUp() : handleLogin(); }}
						class="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
					/>
				</div>
			</div>

			<button
				onclick={() => { isSignUp ? handleSignUp() : handleLogin(); }}
				class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:scale-95"
			>
				{isSignUp ? 'Create Account' : 'Sign In'}
				<ChevronRight class="h-4 w-4" />
			</button>

			<p class="mt-4 text-center text-xs text-muted-foreground">
				{#if isSignUp}
					Already have an account?
					<button onclick={() => { isSignUp = false; loginError = ''; }} class="font-bold text-primary hover:underline">
						Sign In
					</button>
				{:else}
					Don't have an account?
					<button onclick={() => { isSignUp = true; loginError = ''; }} class="font-bold text-primary hover:underline">
						Sign Up
					</button>
				{/if}
			</p>
		</div>
	</div>
{:else}
<!-- CHAT LAYOUT -->
<div class="flex h-full flex-col">
	<!-- Top bar -->
	<header class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
		<div class="flex items-center gap-3">
			<button
				onclick={() => { showMobileSidebar = !showMobileSidebar; }}
				class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
			>
				{#if showMobileSidebar}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
			<h1 class="text-base font-extrabold">Pickle Community</h1>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				</span>
				{onlineCount} picklers online
			</div>
ttt<div class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
tttt<div class="flex h-6 w-6 items-center justify-center rounded-full {getAvatarColor(nickname)} text-[10px] font-bold text-white">
ttttt{getInitials(nickname)}
tttt</div>
tttt<span class="hidden sm:inline">{nickname}</span>
ttt</div>
		</div>
	</header>

	<div class="flex flex-1 overflow-hidden">
		<!-- SIDEBAR (channels) -->
		<!-- Mobile overlay -->
		{#if showMobileSidebar}
			<div
				class="fixed inset-0 z-40 bg-black/30 md:hidden"
				onclick={() => { showMobileSidebar = false; }}
				onkeydown={() => {}}
				role="button"
				tabindex="-1"
			></div>
		{/if}

		<aside class="
			{showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
			fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-zinc-900 text-zinc-300 transition-transform duration-200
			md:relative md:translate-x-0
		">
			<div class="flex h-full flex-col overflow-y-auto px-3 py-4">
				{#each Object.entries(channelsByCategory) as [category, chs]}
					<div class="mb-4">
						<p class="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
							{category}
						</p>
						{#each chs as ch}
							<button
								onclick={() => selectChannel(ch.id)}
								class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors {activeChannel === ch.id
									? 'bg-zinc-700/60 font-bold text-white'
									: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
							>
								<Hash class="h-4 w-4 shrink-0 opacity-60" />
								{ch.name}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</aside>

		<!-- MAIN CHAT AREA -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Channel header -->
			<div class="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
				<Hash class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm font-bold">{activeChannel}</span>
				<span class="text-xs text-muted-foreground">
					{#if activeChannel === 'general'}
						General pickleball chat for PH players
					{:else if activeChannel === 'looking-for-game'}
						Find partners and join games
					{:else if activeChannel === 'beginners-corner'}
						Tips and questions for new players
					{:else if activeChannel === 'intermediate-rally'}
						Level up your game
					{:else if activeChannel === 'advanced-play'}
						Strategy and high-level play
					{:else}
						Venue-specific updates and tips
					{/if}
				</span>
			</div>

			<!-- Messages -->
			<div class="flex-1 overflow-y-auto px-4 py-4">
				<div class="space-y-1">
					{#each currentMessages as msg (msg.id)}
						{#if msg.type === 'game-request'}
							<!-- Game Request Card -->
							<div class="my-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
								<div class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
									<MapPin class="h-3.5 w-3.5" />
									GAME REQUEST
								</div>
								<div class="mt-2 flex items-start gap-3">
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full {getAvatarColor(msg.author)} text-xs font-bold text-white">
										{getInitials(msg.author)}
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-bold">{msg.author} is looking for: {msg.lookingFor}</p>
										<div class="mt-1.5 space-y-1 text-xs text-muted-foreground">
											<p>When: {msg.when}</p>
											<p>Where: {msg.where}</p>
											<div class="flex items-center gap-2">
												<span>Level:</span>
												<span class="rounded-full border px-2 py-0.5 text-[10px] font-bold {levelBadgeColor(msg.level)}">{msg.level}</span>
											</div>
											<p>Spots needed: {msg.spotsNeeded}</p>
										</div>
									</div>
								</div>
								<button class="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:-translate-y-0.5 active:scale-95">
									Join Game
								</button>
							</div>
						{:else}
							<!-- Regular Message -->
							<div class="group flex items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {getAvatarColor(msg.author)} text-xs font-bold text-white">
									{getInitials(msg.author)}
								</div>
								<div class="min-w-0">
									<div class="flex items-baseline gap-2">
										<span class="text-sm font-bold {msg.author === nickname ? 'text-primary' : ''}">{msg.author}</span>
										<span class="text-[11px] text-muted-foreground">{msg.timestamp}</span>
									</div>
									<p class="text-sm text-foreground/90">{msg.content}</p>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Message Input -->
			<div class="shrink-0 border-t border-border bg-background p-4">
				
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={messageInput}
							onkeydown={handleKeydown}
							placeholder="Message #{activeChannel}..."
							class="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
						/>
						<button
							onclick={sendMessage}
							disabled={!messageInput.trim()}
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all {messageInput.trim()
								? 'bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 active:scale-95'
								: 'bg-muted text-muted-foreground'}"
						>
							<Send class="h-4 w-4" />
						</button>
					</div>
			</div>
		</div>
	</div>
</div>
{/if}
