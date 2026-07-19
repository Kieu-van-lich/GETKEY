const crypto = require('crypto');

// Secret key to generate the daily hash (User should set this in Vercel)
const DAILY_SECRET = process.env.DAILY_SECRET || 'ONLYTRIS_SECRET_123';

// Layma.net API Configuration (User needs to add this to Vercel Environment Variables)
const LAYMA_API_KEY = process.env.LAYMA_API_KEY || '96d08fcbe37f17b9054b60a4993c4308';

function createSessionToken() {
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('md5').update(timestamp + DAILY_SECRET).digest('hex');
    return `${timestamp}-${hash}`;
}



export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // 1. Create a stateless session token
        const sessionToken = createSessionToken();

        // 2. The URL we want layma to redirect to after successful bypass
        const host = req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const returnUrl = `${protocol}://${host}/api/verify_link?session=${sessionToken}`;

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
