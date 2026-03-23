export type User = {
	fb_id: string;
	name: string;
	phone_number: string;
	created_at: Date;
};

export type InquiryStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type Inquiry = {
	id: string;
	fb_id: string;
	status: InquiryStatus;
	concept: string;
	placement: string;
	size: string;
	reference_image_url: string | null;
	quoted_price: number | null;
	scheduled_at: Date | null;
	gcal_event_id: string | null;
	created_at: Date;
};

export type ChatMessage = {
	id: string;
	fb_id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
};

export type MessengerMessage = {
	sender: {
		id: string;
	};
	recipient: {
		id: string;
	};
	timestamp: number;
	message?: {
		mid: string;
		text?: string;
		attachments?: Array<{
			type: string;
			payload?: {
				url: string;
			};
		}>;
	};
};

export type WebhookEvent = {
	object: string;
	entry: Array<{
		id: string;
		time: number;
		messaging: MessengerMessage[];
	}>;
};
