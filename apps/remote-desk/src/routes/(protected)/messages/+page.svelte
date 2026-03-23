<script lang="ts">
	import { roleStore } from '$lib/stores/role.svelte';
	import {
		Hash,
		Users,
		Megaphone,
		Send,
		Plus,
		SmilePlus,
		Paperclip,
		Pin,
		Bell,
		Search,
		AtSign,
		Settings,
		ChevronDown,
		UserPlus,
		Volume2,
		Mic,
		Headphones,
		Image,
		Gift,
		Sticker,
		Reply,
		MoreHorizontal,
		ThumbsUp,
		Heart,
		Laugh,
		Eye,
		Lock,
		ArrowDown,
		Loader2
	} from 'lucide-svelte';

	interface Channel {
		id: string;
		name: string;
		icon: typeof Hash;
		unread: number;
		description: string;
		category: string;
	}

	interface Message {
		id: string;
		sender: string;
		initials: string;
		content: string;
		time: string;
		date?: string;
		isOwn: boolean;
		channel: string;
		reactions?: { emoji: string; count: number; reacted: boolean }[];
		replyTo?: string;
		isSystem?: boolean;
		attachment?: { name: string; size: string; type: string };
	}

	interface Member {
		name: string;
		initials: string;
		role: string;
		status: 'online' | 'idle' | 'dnd' | 'offline';
	}

	const channels: Channel[] = [
		{ id: 'general', name: 'general', icon: Hash, unread: 2, description: 'Company-wide discussions', category: 'TEXT CHANNELS' },
		{ id: 'team', name: 'team-updates', icon: Hash, unread: 0, description: 'Team status and updates', category: 'TEXT CHANNELS' },
		{ id: 'announcements', name: 'announcements', icon: Megaphone, unread: 1, description: 'Official company announcements', category: 'TEXT CHANNELS' },
		{ id: 'tagbilaran', name: 'tagbilaran-branch', icon: Hash, unread: 0, description: 'Tagbilaran branch chat', category: 'BRANCHES' },
		{ id: 'panglao', name: 'panglao-branch', icon: Hash, unread: 3, description: 'Panglao branch chat', category: 'BRANCHES' },
		{ id: 'random', name: 'random', icon: Hash, unread: 0, description: 'Off-topic and fun stuff', category: 'SOCIAL' }
	];

	const members: Member[] = [
		{ name: 'Admin John', initials: 'AJ', role: 'Admin', status: 'online' },
		{ name: 'Maria R.', initials: 'MR', role: 'Manager', status: 'online' },
		{ name: 'Rico C.', initials: 'RC', role: 'Staff', status: 'online' },
		{ name: 'Ana S.', initials: 'AS', role: 'Staff', status: 'idle' },
		{ name: 'Liza P.', initials: 'LP', role: 'Staff', status: 'online' },
		{ name: 'Ken M.', initials: 'KM', role: 'Manager', status: 'dnd' },
		{ name: 'Diana T.', initials: 'DT', role: 'Staff', status: 'offline' },
		{ name: 'Ben G.', initials: 'BG', role: 'Staff', status: 'offline' }
	];

	// 100 mock messages for #general
	const mockGeneralMessages: Message[] = [
		{ id: 'g0', sender: '', initials: '', content: 'Welcome to #general! This is the start of the channel.', time: '', isOwn: false, channel: 'general', isSystem: true },
		{ id: 'g1', sender: 'Maria R.', initials: 'MR', content: 'Good morning everyone! Hope you all had a good rest. Ready for another day!', time: '7:02 AM', date: 'Today', isOwn: false, channel: 'general' },
		{ id: 'g2', sender: 'Rico C.', initials: 'RC', content: 'Morning Maria! I got here early, already prepping the grill stations.', time: '7:05 AM', isOwn: false, channel: 'general' },
		{ id: 'g3', sender: 'Liza P.', initials: 'LP', content: 'Good morning! Just clocked in. The dining area looks great after last night\'s deep clean.', time: '7:08 AM', isOwn: false, channel: 'general' },
		{ id: 'g4', sender: 'Ben G.', initials: 'BG', content: 'Morning team. Heading to the warehouse first to check on the delivery that came in late last night.', time: '7:12 AM', isOwn: false, channel: 'general' },
		{ id: 'g5', sender: 'You', initials: 'AJ', content: 'Good morning everyone! Quick reminder: we have the monthly inventory count today. Please prioritize your sections.', time: '7:15 AM', isOwn: true, channel: 'general' },
		{ id: 'g6', sender: 'Ana S.', initials: 'AS', content: 'Morning! Noted on the inventory. I\'ll start with the frozen goods section right after the team huddle.', time: '7:18 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '👍', count: 2, reacted: false }] },
		{ id: 'g7', sender: 'Ken M.', initials: 'KM', content: 'Good morning. Just a heads up — I\'ll be in a meeting with the supplier from 8-9 AM. Reach me after that.', time: '7:22 AM', isOwn: false, channel: 'general' },
		{ id: 'g8', sender: 'Diana T.', initials: 'DT', content: 'Morning! I\'m on the late shift today but checking in early. Any updates I should know about?', time: '7:25 AM', isOwn: false, channel: 'general' },
		{ id: 'g9', sender: 'Maria R.', initials: 'MR', content: '@Diana nothing major, just the inventory count today. Your section is beverages and condiments.', time: '7:28 AM', isOwn: false, channel: 'general' },
		{ id: 'g10', sender: 'Rico C.', initials: 'RC', content: 'Guys, the charcoal stock is looking low. We might need to reorder before the weekend rush.', time: '7:35 AM', isOwn: false, channel: 'general' },
		{ id: 'g11', sender: 'You', initials: 'AJ', content: 'Rico, how many bags do we have left? I\'ll check with the supplier.', time: '7:37 AM', isOwn: true, channel: 'general' },
		{ id: 'g12', sender: 'Rico C.', initials: 'RC', content: 'About 15 bags. We usually go through 8-10 on a busy weekend. So we\'re cutting it close.', time: '7:39 AM', isOwn: false, channel: 'general' },
		{ id: 'g13', sender: 'Ken M.', initials: 'KM', content: 'I\'ll add charcoal to my supplier meeting agenda. Should be able to get rush delivery by Friday.', time: '7:42 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '🙏', count: 3, reacted: true }] },
		{ id: 'g14', sender: 'Liza P.', initials: 'LP', content: 'Also, we\'re running low on the samgyupsal sauce packets. The small ones for takeout.', time: '7:45 AM', isOwn: false, channel: 'general' },
		{ id: 'g15', sender: 'Maria R.', initials: 'MR', content: 'Noted Liza. I\'ll add that to the order list. @Ken can you check sauce packets too?', time: '7:48 AM', isOwn: false, channel: 'general' },
		{ id: 'g16', sender: 'Ken M.', initials: 'KM', content: 'Will do. Anyone else need anything ordered? Speak now or forever hold your peace until next week 😄', time: '7:50 AM', isOwn: false, channel: 'general' },
		{ id: 'g17', sender: 'Ben G.', initials: 'BG', content: 'We need more takeout containers — the medium size. We\'re down to maybe 2 days\' worth.', time: '7:53 AM', isOwn: false, channel: 'general' },
		{ id: 'g18', sender: 'Ana S.', initials: 'AS', content: 'And napkins! We always forget napkins until we\'re literally on the last pack 😅', time: '7:55 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '😂', count: 4, reacted: true }] },
		{ id: 'g19', sender: 'You', initials: 'AJ', content: 'Great, let\'s compile the full order list by 9 AM. Ken, I\'ll send you the consolidated list before your meeting.', time: '7:58 AM', isOwn: true, channel: 'general' },
		{ id: 'g20', sender: 'Ken M.', initials: 'KM', content: 'Perfect, thanks AJ. Heading into the meeting room now. BRB.', time: '8:00 AM', isOwn: false, channel: 'general' },
		{ id: 'g21', sender: 'Maria R.', initials: 'MR', content: 'Team huddle in 5 minutes at the main floor! Quick one, I promise.', time: '8:05 AM', isOwn: false, channel: 'general' },
		{ id: 'g22', sender: 'Rico C.', initials: 'RC', content: 'On my way!', time: '8:06 AM', isOwn: false, channel: 'general' },
		{ id: 'g23', sender: 'Liza P.', initials: 'LP', content: 'Coming!', time: '8:06 AM', isOwn: false, channel: 'general' },
		{ id: 'g24', sender: 'Ana S.', initials: 'AS', content: 'Be right there, just finishing up something.', time: '8:07 AM', isOwn: false, channel: 'general' },
		{ id: 'g25', sender: 'Ben G.', initials: 'BG', content: 'Quick update from the warehouse — last night\'s delivery is all accounted for. 50 kg pork belly, 30 kg beef, 20 kg chicken. All properly stored.', time: '8:15 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '✅', count: 2, reacted: false }] },
		{ id: 'g26', sender: 'You', initials: 'AJ', content: 'Nice, thanks Ben! That matches the PO. Can you log it in the system when you get a chance?', time: '8:18 AM', isOwn: true, channel: 'general' },
		{ id: 'g27', sender: 'Ben G.', initials: 'BG', content: 'Already on it. Should be logged within the hour.', time: '8:20 AM', isOwn: false, channel: 'general' },
		{ id: 'g28', sender: 'Maria R.', initials: 'MR', content: 'Great huddle everyone. To recap: inventory count by EOD, section assignments are posted on the board. Let\'s crush it! 💪', time: '8:25 AM', isOwn: false, channel: 'general' },
		{ id: 'g29', sender: 'Diana T.', initials: 'DT', content: 'Thanks for the recap Maria! I\'ll handle my section when I come in at noon.', time: '8:28 AM', isOwn: false, channel: 'general' },
		{ id: 'g30', sender: 'Liza P.', initials: 'LP', content: 'Starting my section now — tableware and kitchen utensils. This might take a while, lots of small items 😩', time: '8:35 AM', isOwn: false, channel: 'general' },
		{ id: 'g31', sender: 'Rico C.', initials: 'RC', content: 'I\'ll help you after I finish the grill equipment count. Should be done in about 30 min.', time: '8:38 AM', isOwn: false, channel: 'general' },
		{ id: 'g32', sender: 'Liza P.', initials: 'LP', content: 'You\'re a lifesaver Rico! Thanks!', time: '8:39 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '❤️', count: 1, reacted: false }] },
		{ id: 'g33', sender: 'Ana S.', initials: 'AS', content: 'Frozen goods section update: found 3 boxes of pork that are near expiry (March 25). Should we prioritize using these?', time: '8:50 AM', isOwn: false, channel: 'general' },
		{ id: 'g34', sender: 'Maria R.', initials: 'MR', content: 'Yes, definitely. Let\'s use those first this week. I\'ll adjust the menu prep accordingly.', time: '8:52 AM', isOwn: false, channel: 'general' },
		{ id: 'g35', sender: 'You', initials: 'AJ', content: 'Good catch Ana. Maria, can you also flag this in the waste tracking sheet? We need to monitor near-expiry items better.', time: '8:55 AM', isOwn: true, channel: 'general' },
		{ id: 'g36', sender: 'Maria R.', initials: 'MR', content: 'On it. I\'ll set up a weekly check for items within 5 days of expiry.', time: '8:57 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '👏', count: 3, reacted: true }] },
		{ id: 'g37', sender: 'Ken M.', initials: 'KM', content: 'Back from the supplier meeting! Good news: they can do rush delivery for charcoal and sauce packets by Friday morning. Takeout containers will arrive Thursday.', time: '9:05 AM', isOwn: false, channel: 'general' },
		{ id: 'g38', sender: 'Ben G.', initials: 'BG', content: 'Nice! What about the napkins?', time: '9:07 AM', isOwn: false, channel: 'general' },
		{ id: 'g39', sender: 'Ken M.', initials: 'KM', content: 'Napkins are coming with the containers on Thursday. Got a bulk deal too — 20% off for ordering 50 packs.', time: '9:08 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '🔥', count: 5, reacted: true }] },
		{ id: 'g40', sender: 'You', initials: 'AJ', content: 'Excellent work Ken! That bulk deal is great. I\'ll approve the PO now.', time: '9:10 AM', isOwn: true, channel: 'general' },
		{ id: 'g41', sender: 'Ana S.', initials: 'AS', content: 'Frozen section inventory done! Uploading the sheet now.', time: '9:25 AM', isOwn: false, channel: 'general', attachment: { name: 'frozen-inventory-march21.xlsx', size: '187 KB', type: 'spreadsheet' } },
		{ id: 'g42', sender: 'Rico C.', initials: 'RC', content: 'Grill equipment done too. All 12 grills accounted for, 2 need burner replacement soon.', time: '9:30 AM', isOwn: false, channel: 'general' },
		{ id: 'g43', sender: 'You', initials: 'AJ', content: 'Rico, can you submit an expense request for the burner replacements? Let\'s get that sorted before the weekend.', time: '9:33 AM', isOwn: true, channel: 'general' },
		{ id: 'g44', sender: 'Rico C.', initials: 'RC', content: 'Sure thing. I\'ll get quotes from two vendors and submit the request by lunch.', time: '9:35 AM', isOwn: false, channel: 'general' },
		{ id: 'g45', sender: 'Liza P.', initials: 'LP', content: 'Tableware count is... intense. We have 847 pieces across all categories. Rico, still coming to help? 😭', time: '9:40 AM', isOwn: false, channel: 'general' },
		{ id: 'g46', sender: 'Rico C.', initials: 'RC', content: 'Heading over now! Let\'s knock this out together.', time: '9:42 AM', isOwn: false, channel: 'general' },
		{ id: 'g47', sender: 'Maria R.', initials: 'MR', content: 'Quick question for everyone — who wants what for lunch? I\'m doing a group order from the bakery next door.', time: '10:00 AM', isOwn: false, channel: 'general' },
		{ id: 'g48', sender: 'Ben G.', initials: 'BG', content: 'Chicken sandwich for me please! And an iced coffee.', time: '10:02 AM', isOwn: false, channel: 'general' },
		{ id: 'g49', sender: 'Ana S.', initials: 'AS', content: 'Tuna pandesal and a calamansi juice! Thanks Maria 🥰', time: '10:03 AM', isOwn: false, channel: 'general' },
		{ id: 'g50', sender: 'Rico C.', initials: 'RC', content: 'Pork adobo meal if they have it. If not, whatever\'s good!', time: '10:05 AM', isOwn: false, channel: 'general' },
		{ id: 'g51', sender: 'Liza P.', initials: 'LP', content: 'Bangus sisig for me! And yes to iced coffee too.', time: '10:06 AM', isOwn: false, channel: 'general' },
		{ id: 'g52', sender: 'You', initials: 'AJ', content: 'I\'ll have the beef tapa meal please. Thanks for organizing this Maria!', time: '10:08 AM', isOwn: true, channel: 'general' },
		{ id: 'g53', sender: 'Ken M.', initials: 'KM', content: 'Sinigang na hipon for me. Large rice. I\'m starving from that meeting 😅', time: '10:10 AM', isOwn: false, channel: 'general' },
		{ id: 'g54', sender: 'Maria R.', initials: 'MR', content: 'Got it all! Will order at 11:30 for a noon delivery. Total is around ₱2,800 — I\'ll submit it as a team expense.', time: '10:12 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '🎉', count: 6, reacted: true }] },
		{ id: 'g55', sender: 'Ben G.', initials: 'BG', content: 'Warehouse inventory is fully logged in the system now. Everything matches the delivery receipts.', time: '10:30 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '✅', count: 3, reacted: false }] },
		{ id: 'g56', sender: 'You', initials: 'AJ', content: 'Perfect. Ben, can you also check if we have the receipt for last Tuesday\'s delivery? Finance is asking for it.', time: '10:35 AM', isOwn: true, channel: 'general' },
		{ id: 'g57', sender: 'Ben G.', initials: 'BG', content: 'Let me check the filing cabinet... give me 10 minutes.', time: '10:37 AM', isOwn: false, channel: 'general' },
		{ id: 'g58', sender: 'Liza P.', initials: 'LP', content: 'UPDATE: Tableware count complete! Thanks to Rico, we finished in half the time. Final count: 847 pieces, 12 damaged (need replacement).', time: '10:45 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '💪', count: 4, reacted: true }, { emoji: '👏', count: 2, reacted: false }] },
		{ id: 'g59', sender: 'Rico C.', initials: 'RC', content: 'Teamwork makes the dream work! Those chipped plates need to go though, some are actually sharp. Safety hazard.', time: '10:47 AM', isOwn: false, channel: 'general' },
		{ id: 'g60', sender: 'You', initials: 'AJ', content: 'Good call Rico. Dispose of the damaged ones and add plate replacement to the order. How many do we need?', time: '10:50 AM', isOwn: true, channel: 'general' },
		{ id: 'g61', sender: 'Rico C.', initials: 'RC', content: '12 pieces chipped + I\'d say get 8 extra as buffer. So 20 plates total.', time: '10:52 AM', isOwn: false, channel: 'general' },
		{ id: 'g62', sender: 'Ken M.', initials: 'KM', content: 'I can add plates to the Thursday order. Same supplier has them. @Rico send me the exact specs?', time: '10:55 AM', isOwn: false, channel: 'general' },
		{ id: 'g63', sender: 'Rico C.', initials: 'RC', content: 'DMing you the details now!', time: '10:56 AM', isOwn: false, channel: 'general' },
		{ id: 'g64', sender: 'Ben G.', initials: 'BG', content: 'Found the receipt! Scanning it now and sending to finance.', time: '11:00 AM', isOwn: false, channel: 'general', attachment: { name: 'delivery-receipt-march18.pdf', size: '1.2 MB', type: 'pdf' } },
		{ id: 'g65', sender: 'You', initials: 'AJ', content: 'Thanks Ben! Forward that to accounting@wtfsamgyupsal.com please.', time: '11:02 AM', isOwn: true, channel: 'general' },
		{ id: 'g66', sender: 'Ana S.', initials: 'AS', content: 'Hey everyone, the walk-in freezer temp is reading 2 degrees higher than usual. It\'s at -16°C instead of -18°C. Should we be concerned?', time: '11:10 AM', isOwn: false, channel: 'general' },
		{ id: 'g67', sender: 'Maria R.', initials: 'MR', content: 'That\'s a bit high. @Ken can we get the HVAC tech to check it? Don\'t want to risk food safety.', time: '11:12 AM', isOwn: false, channel: 'general' },
		{ id: 'g68', sender: 'Ken M.', initials: 'KM', content: 'Calling them now. In the meantime, don\'t open the freezer door unnecessarily. Let\'s minimize temp fluctuation.', time: '11:14 AM', isOwn: false, channel: 'general', reactions: [{ emoji: '👍', count: 5, reacted: true }] },
		{ id: 'g69', sender: 'You', initials: 'AJ', content: 'Good protocol everyone. Ana, can you monitor the temp every 30 minutes until the tech arrives? Log the readings.', time: '11:16 AM', isOwn: true, channel: 'general' },
		{ id: 'g70', sender: 'Ana S.', initials: 'AS', content: 'Already set a timer! Will post updates here.', time: '11:17 AM', isOwn: false, channel: 'general' },
		{ id: 'g71', sender: 'Diana T.', initials: 'DT', content: 'Just got in! Starting my shift. Catching up on messages now... wow, busy morning!', time: '12:00 PM', isOwn: false, channel: 'general' },
		{ id: 'g72', sender: 'Maria R.', initials: 'MR', content: 'Welcome Diana! Lunch just arrived too, perfect timing. Your order is on the break room table.', time: '12:02 PM', isOwn: false, channel: 'general' },
		{ id: 'g73', sender: 'Liza P.', initials: 'LP', content: 'This bangus sisig is SO good today 😍', time: '12:10 PM', isOwn: false, channel: 'general' },
		{ id: 'g74', sender: 'Ben G.', initials: 'BG', content: 'Facts! The chicken sandwich hits different when you\'ve been counting boxes all morning 😂', time: '12:12 PM', isOwn: false, channel: 'general', reactions: [{ emoji: '😂', count: 5, reacted: true }] },
		{ id: 'g75', sender: 'Rico C.', initials: 'RC', content: 'They didn\'t have adobo so I got the lechon kawali instead. No regrets.', time: '12:15 PM', isOwn: false, channel: 'general' },
		{ id: 'g76', sender: 'Ana S.', initials: 'AS', content: 'Freezer update: temp is back to -17.5°C. Trending in the right direction!', time: '12:30 PM', isOwn: false, channel: 'general', reactions: [{ emoji: '✅', count: 3, reacted: false }] },
		{ id: 'g77', sender: 'Ken M.', initials: 'KM', content: 'HVAC tech says a minor sensor issue. They\'ll be here at 2 PM to fix it. Nothing serious.', time: '12:35 PM', isOwn: false, channel: 'general' },
		{ id: 'g78', sender: 'You', initials: 'AJ', content: 'Great news on the freezer. Thanks for staying on top of it everyone.', time: '12:38 PM', isOwn: true, channel: 'general' },
		{ id: 'g79', sender: 'Diana T.', initials: 'DT', content: 'Starting my inventory section now — beverages and condiments. Will update in about an hour.', time: '12:45 PM', isOwn: false, channel: 'general' },
		{ id: 'g80', sender: 'Maria R.', initials: 'MR', content: 'Expense update: lunch team expense submitted (₱2,800). Also submitted the weekly cleaning supplies (₱1,200). Awaiting approval.', time: '1:00 PM', isOwn: false, channel: 'general' },
		{ id: 'g81', sender: 'You', initials: 'AJ', content: 'Both approved. Thanks Maria!', time: '1:05 PM', isOwn: true, channel: 'general', reactions: [{ emoji: '🙌', count: 2, reacted: false }] },
		{ id: 'g82', sender: 'Rico C.', initials: 'RC', content: 'Expense request for grill burner replacement submitted. Got quotes from 2 vendors: ₱4,500 vs ₱5,200. Recommend the cheaper one, same quality.', time: '1:15 PM', isOwn: false, channel: 'general', attachment: { name: 'grill-burner-quotes.pdf', size: '340 KB', type: 'pdf' } },
		{ id: 'g83', sender: 'Ken M.', initials: 'KM', content: 'I know that first vendor — they\'re reliable. I\'d go with them too.', time: '1:18 PM', isOwn: false, channel: 'general' },
		{ id: 'g84', sender: 'You', initials: 'AJ', content: 'Approved. Go with the ₱4,500 quote. Rico, can you coordinate the replacement schedule?', time: '1:20 PM', isOwn: true, channel: 'general' },
		{ id: 'g85', sender: 'Rico C.', initials: 'RC', content: 'Will do! I\'ll schedule it for Monday morning before we open. Should take about an hour per grill.', time: '1:22 PM', isOwn: false, channel: 'general' },
		{ id: 'g86', sender: 'Ana S.', initials: 'AS', content: 'Freezer at -18°C! Back to normal. Crisis averted 🎉', time: '1:30 PM', isOwn: false, channel: 'general', reactions: [{ emoji: '🎉', count: 6, reacted: true }, { emoji: '❄️', count: 2, reacted: false }] },
		{ id: 'g87', sender: 'Liza P.', initials: 'LP', content: 'Does anyone know where we keep the extra menu holders? A customer accidentally broke one at table 7.', time: '1:45 PM', isOwn: false, channel: 'general' },
		{ id: 'g88', sender: 'Ben G.', initials: 'BG', content: 'Storage room A, second shelf from the top. Should be a box of 10 there.', time: '1:47 PM', isOwn: false, channel: 'general' },
		{ id: 'g89', sender: 'Liza P.', initials: 'LP', content: 'Found them! Thanks Ben!', time: '1:50 PM', isOwn: false, channel: 'general' },
		{ id: 'g90', sender: 'Diana T.', initials: 'DT', content: 'Beverages section done! All counts match the system. Moving to condiments now.', time: '2:00 PM', isOwn: false, channel: 'general', reactions: [{ emoji: '👍', count: 2, reacted: false }] },
		{ id: 'g91', sender: 'Maria R.', initials: 'MR', content: 'Reminder: we\'re expecting a large party tonight — 25 pax, 7 PM reservation. All hands on deck for prep starting at 5 PM.', time: '2:15 PM', isOwn: false, channel: 'general' },
		{ id: 'g92', sender: 'Rico C.', initials: 'RC', content: 'I\'ll make sure all grills are extra clean and ready. Do we know what they pre-ordered?', time: '2:18 PM', isOwn: false, channel: 'general' },
		{ id: 'g93', sender: 'Maria R.', initials: 'MR', content: 'They ordered the unlimited samgyupsal package + extra sides. I\'ll prep the meat portions now.', time: '2:20 PM', isOwn: false, channel: 'general' },
		{ id: 'g94', sender: 'You', initials: 'AJ', content: 'Let\'s make sure we have enough banchan prepped. That\'s usually where we fall short with big groups. Diana, can you help Maria with sides prep after your count?', time: '2:25 PM', isOwn: true, channel: 'general' },
		{ id: 'g95', sender: 'Diana T.', initials: 'DT', content: 'Absolutely! Condiments count is almost done. I\'ll join Maria by 3 PM.', time: '2:28 PM', isOwn: false, channel: 'general' },
		{ id: 'g96', sender: 'Ken M.', initials: 'KM', content: 'HVAC tech just finished. Freezer sensor replaced, everything\'s running perfectly now. Invoice is ₱3,500.', time: '2:45 PM', isOwn: false, channel: 'general' },
		{ id: 'g97', sender: 'You', initials: 'AJ', content: 'Thanks Ken. Submit the invoice through the expense system and I\'ll approve it right away.', time: '2:48 PM', isOwn: true, channel: 'general' },
		{ id: 'g98', sender: 'Diana T.', initials: 'DT', content: 'Condiments inventory complete! Found a discrepancy — system shows 24 bottles of soy sauce but we only have 20. Could be a logging error or someone forgot to record usage.', time: '3:00 PM', isOwn: false, channel: 'general' },
		{ id: 'g99', sender: 'Maria R.', initials: 'MR', content: 'Hmm, that might be from Wednesday\'s spill. Ben cleaned up 3 bottles that broke. Did anyone log that?', time: '3:03 PM', isOwn: false, channel: 'general' },
		{ id: 'g100', sender: 'Ben G.', initials: 'BG', content: 'Oh... I think I forgot to log that. My bad! I\'ll update the system now. That accounts for 3 of the 4 missing.', time: '3:05 PM', isOwn: false, channel: 'general', reactions: [{ emoji: '👀', count: 2, reacted: false }] },
	];

	// Other channel messages
	const otherMessages: Message[] = [
		{ id: 't1', sender: 'Ken M.', initials: 'KM', content: 'New shift schedule for next week has been posted. Please review and confirm by end of day Thursday.', time: '8:30 AM', date: 'Today', isOwn: false, channel: 'team', attachment: { name: 'schedule-week-13.pdf', size: '89 KB', type: 'pdf' } },
		{ id: 't2', sender: 'Maria R.', initials: 'MR', content: 'Confirmed for my shifts. Thanks!', time: '9:45 AM', isOwn: false, channel: 'team', reactions: [{ emoji: '👍', count: 4, reacted: true }] },
		{ id: 'a1', sender: 'HR Admin', initials: 'HR', content: 'Monthly attendance report is now available. Managers, please check and sign off by Friday.', time: '8:00 AM', date: 'Today', isOwn: false, channel: 'announcements' },
		{ id: 'a2', sender: 'HR Admin', initials: 'HR', content: 'Happy birthday to Diana T.! Wishing you a wonderful day! 🎉', time: '7:00 AM', date: 'Yesterday', isOwn: false, channel: 'announcements', reactions: [{ emoji: '🎂', count: 6, reacted: true }, { emoji: '🎉', count: 5, reacted: false }, { emoji: '❤️', count: 3, reacted: false }] },
	];

	let messages = $state<Message[]>([...mockGeneralMessages, ...otherMessages]);
	let selectedChannel = $state(channels[0]);
	let messageInput = $state('');
	let showMembers = $state(true);
	let hoveredMessage = $state<string | null>(null);
	let visibleCount = $state(20);
	let loadingOlder = $state(false);
	let scrollContainer = $state<HTMLDivElement | null>(null);
	let isAtBottom = $state(true);
	let sentinelEl = $state<HTMLDivElement | null>(null);

	let channelMessages = $derived(messages.filter((m) => m.channel === selectedChannel.id));
	let visibleMessages = $derived(channelMessages.slice(Math.max(0, channelMessages.length - visibleCount)));
	let hasMoreMessages = $derived(visibleCount < channelMessages.length);
	let channelCategories = $derived([...new Set(channels.map(c => c.category))]);

	// Count messages below current view when scrolled up
	let unreadBelowCount = $state(0);

	const avatarColors = [
		'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
		'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500'
	];

	function getAvatarColor(initials: string): string {
		const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
		return avatarColors[hash % avatarColors.length];
	}

	const statusDot: Record<string, string> = {
		online: 'bg-emerald-500',
		idle: 'bg-amber-400',
		dnd: 'bg-red-500',
		offline: 'bg-slate-400'
	};

	const onlineCount = $derived(members.filter(m => m.status === 'online').length);

	let isReadOnlyChannel = $derived(
		roleStore.role === 'staff' && selectedChannel.id === 'announcements'
	);

	function scrollToBottom(smooth = true) {
		if (scrollContainer) {
			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: smooth ? 'smooth' : 'instant'
			});
		}
	}

	function handleSend() {
		if (messageInput.trim() && !isReadOnlyChannel) {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours % 12 || 12;
			const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

			const newMsg: Message = {
				id: `user-${Date.now()}`,
				sender: 'You',
				initials: 'AJ',
				content: messageInput.trim(),
				time: timeStr,
				isOwn: true,
				channel: selectedChannel.id
			};
			messages = [...messages, newMsg];
			messageInput = '';
			// Reset unread count since we're sending
			unreadBelowCount = 0;
			// Scroll to bottom after next render
			requestAnimationFrame(() => scrollToBottom());
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

		if (isAtBottom) {
			unreadBelowCount = 0;
		}

		// Load older messages when scrolled to top
		if (scrollTop < 50 && hasMoreMessages && !loadingOlder) {
			loadOlderMessages();
		}
	}

	function loadOlderMessages() {
		loadingOlder = true;
		const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;

		setTimeout(() => {
			visibleCount = Math.min(visibleCount + 20, channelMessages.length);
			loadingOlder = false;

			// Maintain scroll position after loading older messages
			requestAnimationFrame(() => {
				if (scrollContainer) {
					const newScrollHeight = scrollContainer.scrollHeight;
					scrollContainer.scrollTop = newScrollHeight - prevScrollHeight;
				}
			});
		}, 600);
	}

	// Auto-scroll to bottom on mount and channel change
	$effect(() => {
		// Track channel change
		const _channel = selectedChannel.id;
		visibleCount = 20;
		unreadBelowCount = 0;
		isAtBottom = true;
		// Scroll to bottom after render
		requestAnimationFrame(() => {
			scrollToBottom(false);
		});
	});

	// Track new messages while scrolled up
	$effect(() => {
		const _len = channelMessages.length;
		if (!isAtBottom && scrollContainer) {
			unreadBelowCount += 1;
		}
	});
</script>

<!-- Full-height Discord-style layout — no page padding, fills the container -->
<div class="flex h-full">
	<!-- Channel Sidebar -->
	<div class="hidden w-60 flex-shrink-0 flex-col border-r bg-muted/30 dark:bg-muted/10 md:flex">
		<!-- Server Header -->
		<div class="flex h-12 items-center justify-between border-b px-4">
			<h2 class="text-sm font-bold">FlowWork</h2>
			<ChevronDown class="h-4 w-4 text-muted-foreground" />
		</div>

		<!-- Channel List -->
		<div class="flex-1 overflow-y-auto px-2 py-3">
			{#each channelCategories as category}
				<div class="mb-3">
					<div class="mb-1 flex items-center justify-between px-1">
						<span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{category}</span>
						<button class="text-muted-foreground hover:text-foreground">
							<Plus class="h-3.5 w-3.5" />
						</button>
					</div>
					{#each channels.filter(c => c.category === category) as channel}
						{@const ChannelIcon = channel.icon}
						<button
							onclick={() => (selectedChannel = channel)}
							class="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors
								{selectedChannel.id === channel.id
									? 'bg-accent text-foreground font-medium'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						>
							<ChannelIcon class="h-4 w-4 flex-shrink-0 opacity-70" />
							<span class="flex-1 truncate text-left">{channel.name}</span>
							{#if channel.unread > 0}
								<span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
									{channel.unread}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>

		<!-- User Panel (bottom) -->
		<div class="flex items-center gap-2 border-t bg-muted/50 dark:bg-muted/20 px-2 py-2">
			<div class="relative">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">AJ</div>
				<div class="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-muted bg-emerald-500"></div>
			</div>
			<div class="flex-1 min-w-0">
				<p class="truncate text-xs font-semibold">Admin John</p>
				<p class="text-[10px] text-muted-foreground">Online</p>
			</div>
			<div class="flex items-center gap-0.5">
				<button class="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><Mic class="h-3.5 w-3.5" /></button>
				<button class="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><Headphones class="h-3.5 w-3.5" /></button>
			</div>
		</div>
	</div>

	<!-- Main Chat Area -->
	<div class="flex flex-1 flex-col">
		<!-- Channel Header -->
		<div class="flex h-12 items-center justify-between border-b px-4">
			<div class="flex items-center gap-2">
				{#if selectedChannel.icon === Megaphone}
					<Megaphone class="h-5 w-5 text-muted-foreground" />
				{:else}
					<Hash class="h-5 w-5 text-muted-foreground" />
				{/if}
				<span class="font-bold text-sm">{selectedChannel.name}</span>
				<div class="hidden h-6 w-px bg-border sm:block"></div>
				<span class="hidden text-xs text-muted-foreground sm:block">{selectedChannel.description}</span>
			</div>
			<div class="flex items-center gap-1">
				<button class="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><Pin class="h-4 w-4" /></button>
				<button
					onclick={() => (showMembers = !showMembers)}
					class="flex h-8 w-8 items-center justify-center rounded transition-colors {showMembers ? 'text-foreground bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				>
					<Users class="h-4 w-4" />
				</button>
				<div class="relative hidden sm:block">
					<Search class="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search"
						class="h-7 w-36 rounded bg-muted/80 pl-7 pr-2 text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
			</div>
		</div>

		<div class="flex flex-1 overflow-hidden">
			<!-- Messages Area -->
			<div class="flex flex-1 flex-col relative">
				<div
					bind:this={scrollContainer}
					onscroll={handleScroll}
					class="flex-1 overflow-y-auto px-4 py-4"
				>
					<!-- Loading older messages indicator -->
					{#if loadingOlder}
						<div class="flex items-center justify-center gap-2 py-3">
							<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
							<span class="text-xs text-muted-foreground">Loading older messages...</span>
						</div>
					{/if}

					{#if hasMoreMessages && !loadingOlder}
						<div bind:this={sentinelEl} class="flex items-center justify-center py-2">
							<span class="text-xs text-muted-foreground">Scroll up to load more</span>
						</div>
					{/if}

					{#each visibleMessages as message, i (message.id)}
						{#if message.isSystem}
							<!-- System message -->
							<div class="my-4 flex items-center gap-3">
								<div class="h-px flex-1 bg-border"></div>
								<span class="text-xs font-medium text-muted-foreground">{message.content}</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>
						{:else}
							<!-- Date divider -->
							{#if message.date && (i === 0 || visibleMessages[i - 1]?.date !== message.date || visibleMessages[i - 1]?.isSystem)}
								<div class="my-4 flex items-center gap-3">
									<div class="h-px flex-1 bg-border"></div>
									<span class="rounded-full bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm border">{message.date}</span>
									<div class="h-px flex-1 bg-border"></div>
								</div>
							{/if}

							<!-- Message -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="group relative -mx-4 px-4 py-1 transition-colors hover:bg-muted/40"
								onmouseenter={() => (hoveredMessage = message.id)}
								onmouseleave={() => (hoveredMessage = null)}
							>
								<!-- Hover action bar -->
								{#if hoveredMessage === message.id}
									<div class="absolute -top-3 right-4 z-10 flex items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-sm">
										<button class="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" title="React"><SmilePlus class="h-4 w-4" /></button>
										<button class="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" title="Reply"><Reply class="h-4 w-4" /></button>
										<button class="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" title="More"><MoreHorizontal class="h-4 w-4" /></button>
									</div>
								{/if}

								{#if message.replyTo}
									<div class="mb-1 ml-14 flex items-center gap-1.5 text-xs text-muted-foreground">
										<Reply class="h-3 w-3" />
										<span class="font-medium text-primary">{message.replyTo}</span>
									</div>
								{/if}

								<div class="flex gap-3">
									<!-- Avatar -->
									<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white {getAvatarColor(message.initials)}">
										{message.initials}
									</div>

									<!-- Content -->
									<div class="min-w-0 flex-1">
										<div class="flex items-baseline gap-2">
											<span class="text-sm font-semibold {message.isOwn ? 'text-primary' : 'text-foreground'}">{message.sender}</span>
											<span class="text-[11px] text-muted-foreground">{message.time}</span>
										</div>
										<p class="mt-0.5 text-sm leading-relaxed text-foreground/90">{message.content}</p>

										<!-- Attachment -->
										{#if message.attachment}
											<div class="mt-2 inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
												<div class="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
													<Paperclip class="h-4 w-4" />
												</div>
												<div>
													<p class="text-xs font-semibold text-primary hover:underline cursor-pointer">{message.attachment.name}</p>
													<p class="text-[10px] text-muted-foreground">{message.attachment.size}</p>
												</div>
											</div>
										{/if}

										<!-- Reactions -->
										{#if message.reactions}
											<div class="mt-1.5 flex flex-wrap gap-1">
												{#each message.reactions as reaction}
													<button class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors {reaction.reacted ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/20'}">
														<span>{reaction.emoji}</span>
														<span class="font-medium">{reaction.count}</span>
													</button>
												{/each}
												<button class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-muted-foreground opacity-0 transition-all hover:border-border hover:bg-muted group-hover:opacity-100">
													<SmilePlus class="h-3.5 w-3.5" />
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>

				<!-- Scroll to bottom button -->
				{#if !isAtBottom}
					<button
						onclick={() => { scrollToBottom(); unreadBelowCount = 0; }}
						class="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 rounded-full border bg-card px-3 py-2 shadow-lg transition-all hover:bg-muted"
					>
						<ArrowDown class="h-4 w-4 text-muted-foreground" />
						{#if unreadBelowCount > 0}
							<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
								{unreadBelowCount}
							</span>
						{/if}
					</button>
				{/if}

				<!-- Message Input Area -->
				<div class="flex-shrink-0 border-t px-4 py-3">
					{#if isReadOnlyChannel}
						<div class="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
							<Lock class="h-4 w-4" />
							<span>This channel is read-only for staff</span>
						</div>
					{:else}
						<div class="flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
							<button class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
								<Plus class="h-5 w-5" />
							</button>
							<input
								type="text"
								bind:value={messageInput}
								placeholder="Message #{selectedChannel.name}"
								class="flex-1 bg-transparent py-1 text-sm placeholder-muted-foreground focus:outline-none"
								onkeydown={(e) => e.key === 'Enter' && handleSend()}
							/>
							<div class="flex items-center gap-0.5">
								<button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><Image class="h-5 w-5" /></button>
								<button class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><SmilePlus class="h-5 w-5" /></button>
								{#if messageInput.trim()}
									<button
										onclick={handleSend}
										class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:opacity-90"
									>
										<Send class="h-4 w-4" />
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Members Sidebar -->
			{#if showMembers}
				<div class="hidden w-56 flex-shrink-0 overflow-y-auto border-l bg-muted/20 px-3 py-4 lg:block">
					<p class="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Online — {onlineCount}
					</p>
					{#each members.filter(m => m.status === 'online' || m.status === 'idle' || m.status === 'dnd') as member}
						<div class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
							<div class="relative">
								<div class="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white {getAvatarColor(member.initials)}">{member.initials}</div>
								<div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-muted {statusDot[member.status]}"></div>
							</div>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium {member.status === 'idle' ? 'text-muted-foreground' : ''}">{member.name}</p>
								<p class="text-[10px] text-muted-foreground">{member.role}</p>
							</div>
						</div>
					{/each}

					<p class="mb-2 mt-5 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Offline — {members.filter(m => m.status === 'offline').length}
					</p>
					{#each members.filter(m => m.status === 'offline') as member}
						<div class="group flex items-center gap-2 rounded-md px-2 py-1.5 opacity-50 hover:bg-muted hover:opacity-70">
							<div class="relative">
								<div class="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white {getAvatarColor(member.initials)}">{member.initials}</div>
								<div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-muted {statusDot[member.status]}"></div>
							</div>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{member.name}</p>
								<p class="text-[10px] text-muted-foreground">{member.role}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
