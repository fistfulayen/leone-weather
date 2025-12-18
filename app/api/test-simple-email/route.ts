import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Louisina <weather@altalanga.love>',
      to: ['hedvigmaigre@me.com'],
      subject: 'Simple Test Message',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body>
          <p>Hello,</p>
          <p>This is a simple test message from Cascina Leone.</p>
          <p>Current temperature: 6°C</p>
          <p>Have a wonderful day!</p>
          <p>- Louisina</p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Simple test email sent successfully',
    });
  } catch (error) {
    console.error('Exception sending email:', error);
    return NextResponse.json({ error: 'Exception occurred', details: String(error) }, { status: 500 });
  }
}
