import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RESEND_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    const { to, subject, html } = await request.json();

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'events@yourdomain.com',
                to,
                subject,
                html,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return json({ success: true });
    } catch (err) {
        console.error('Email sending error:', err);
        return json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
};
