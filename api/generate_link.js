const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Layma.net API Configuration (User needs to add this to Vercel Environment Variables)
const LAYMA_API_KEY = process.env.LAYMA_API_KEY || '96d08fcbe37f17b9054b60a4993c4308';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // 1. Create a session in Supabase (we still need this to prevent direct access to verify_link)
        // We drop the hwid column usage
        const { data: session, error } = await supabase
            .from('link_sessions')
            .insert([{ hwid: 'daily_user' }]) // using a dummy hwid just in case the db schema requires it
            .select()
            .single();

        if (error) throw error;

        // 2. The URL we want layma to redirect to after successful bypass
        const host = req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const returnUrl = `${protocol}://${host}/api/verify_link?session=${session.id}`;

        // 3. Generate Layma URL
        let redirectUrl = returnUrl; 
        
        // If LAYMA_API_KEY is not empty, generate the short link
        if (LAYMA_API_KEY && LAYMA_API_KEY !== 'placeholder_layma_key') {
            try {
                const apiCall = await fetch(`https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${LAYMA_API_KEY}&format=json&url=${encodeURIComponent(returnUrl)}`);
                const apiData = await apiCall.json();
                
                // Layma specific API response structure
                if (apiData.success === true) {
                    redirectUrl = apiData.html || returnUrl;
                } else {
                    console.error('Layma API Error:', apiData);
                }
            } catch (err) {
                console.error('Fetch error with Layma:', err);
            }
        }

        return res.status(200).json({ 
            success: true, 
            redirect_url: redirectUrl 
        });

    } catch (err) {
        console.error('Error generating link:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
