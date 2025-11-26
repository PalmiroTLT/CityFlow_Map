import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  email: string;
  language?: string;
  email_type: 'verification' | 'recovery' | 'email_change';
  confirmation_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    console.log('Sending email:', payload.email_type, 'to:', payload.email);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine template type
    let templateType = 'email_verification';
    if (payload.email_type === 'recovery') {
      templateType = 'password_recovery';
    } else if (payload.email_type === 'email_change') {
      templateType = 'email_change';
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine user language (default to Serbian)
    const userLanguage = payload.language || 'sr';
    
    let subject = template.subject_sr;
    let body = template.body_sr;

    if (userLanguage === 'ru') {
      subject = template.subject_ru;
      body = template.body_ru;
    } else if (userLanguage === 'en') {
      subject = template.subject_en;
      body = template.body_en;
    }

    // Replace template variables with confirmation URL if provided
    if (payload.confirmation_url) {
      body = body.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, payload.confirmation_url);
    }

    // Send email using Brevo
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'Retro City Map',
          email: 'guide.maps.travel@gmail.com',
        },
        to: [
          {
            email: payload.email,
            name: payload.email,
          },
        ],
        subject: subject,
        htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background-color: #f5f5f5;">
            <p style="margin: 0; white-space: pre-wrap;">${body}</p>
          </div>
        </div>`,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Email send failed:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log('Email sent successfully via Brevo');
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-custom-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});