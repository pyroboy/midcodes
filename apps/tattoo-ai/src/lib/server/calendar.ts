import { google } from 'googleapis';
import { env } from '$env/dynamic/private';

let calendar: any = null;

export function getCalendarClient() {
	if (!calendar) {
		const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

		const auth = new google.auth.GoogleAuth({
			credentials: serviceAccount,
			scopes: ['https://www.googleapis.com/auth/calendar']
		});

		calendar = google.calendar({ version: 'v3', auth });
	}

	return calendar;
}

export async function createCalendarEvent(
	clientName: string,
	clientPhone: string,
	startTime: Date,
	endTime: Date
): Promise<string> {
	const calendarClient = getCalendarClient();

	const event = {
		summary: `Tattoo Session - ${clientName}`,
		description: `Client Phone: ${clientPhone}`,
		start: {
			dateTime: startTime.toISOString()
		},
		end: {
			dateTime: endTime.toISOString()
		}
	};

	const response = await calendarClient.events.insert({
		calendarId: env.GOOGLE_CALENDAR_ID,
		resource: event
	});

	return response.data.id || '';
}

export async function getCalendarEvents(
	timeMin: Date,
	timeMax: Date
): Promise<Array<{ id: string; summary: string; start: any; end: any }>> {
	const calendarClient = getCalendarClient();

	const response = await calendarClient.events.list({
		calendarId: env.GOOGLE_CALENDAR_ID,
		timeMin: timeMin.toISOString(),
		timeMax: timeMax.toISOString(),
		singleEvents: true,
		orderBy: 'startTime'
	});

	return response.data.items || [];
}
