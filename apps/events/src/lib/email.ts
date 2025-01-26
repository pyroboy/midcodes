interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            to,
            subject,
            html,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to send email');
    }

    return response.json();
}
