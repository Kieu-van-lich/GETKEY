const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Secret key to generate the daily hash (User should set this in Vercel)
const DAILY_SECRET = process.env.DAILY_SECRET || 'ONLYTRIS_SECRET_123';

function getDailyKey() {
    // Get current date string (YYYY-MM-DD) based on UTC+7 (Vietnam time)
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vnTime = new Date(utcTime + (3600000 * 7));
    const dateStr = vnTime.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Generate MD5 hash of Date + Secret
    const hash = crypto.createHash('md5').update(dateStr + DAILY_SECRET).digest('hex');
    
    // Format the key to look cool: TRIS-XXXXXX
    return 'TRIS-' + hash.substring(0, 6).toUpperCase();
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { session } = req.query;

    if (!session) {
        return res.send(getErrorHtml('Invalid or missing session ID. Did you bypass correctly?'));
    }

    try {
        // 1. Check if session exists
        const { data: sessionData, error: sessionError } = await supabase
            .from('link_sessions')
            .select('*')
            .eq('id', session)
            .single();

        if (sessionError || !sessionData) {
            return res.send(getErrorHtml('Session expired or invalid. Please generate a new key.'));
        }

        // Check expiration
        if (new Date(sessionData.expires_at) < new Date()) {
            await supabase.from('link_sessions').delete().eq('id', session);
            return res.send(getErrorHtml('Session expired. Please try again.'));
        }

        // 2. Generate Daily Key (No DB insert needed!)
        const dailyKey = getDailyKey();

        // 3. Delete the used session to prevent reuse
        await supabase.from('link_sessions').delete().eq('id', session);

        // 4. Show success HTML
        return res.send(getSuccessHtml(dailyKey));

    } catch (err) {
        console.error('Verify error:', err);
        return res.send(getErrorHtml('Internal Server Error.'));
    }
}

function getSuccessHtml(key) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Key Generated!</title>
        <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
        <div class="container" style="text-align: center; padding-top: 50px;">
            <div class="glow-box" style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 12px; display: inline-block;">
                <h1 style="color: var(--success); margin-bottom: 20px;">XÁC MINH THÀNH CÔNG</h1>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">Key dùng chung ngày hôm nay của bạn là:</p>
                <div style="background: #111; color: #fff; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 8px; letter-spacing: 2px; margin-bottom: 20px;">
                    ${key}
                </div>
                <p style="color: #ef4444; font-size: 14px; margin-bottom: 30px;">*Lưu ý: Key sẽ tự động thay đổi vào 0h00 mỗi ngày.</p>
                <button onclick="navigator.clipboard.writeText('${key}'); this.innerText='ĐÃ COPY!'" 
                    style="background: var(--primary); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; font-family: inherit;">
                    COPY KEY
                </button>
                <br><br>
                <a href="/" style="color: var(--text-secondary); text-decoration: underline; font-size: 14px;">Quay lại trang chủ</a>
            </div>
        </div>
    </body>
    </html>
    `;
}

function getErrorHtml(message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
        <div class="container" style="text-align: center; padding-top: 50px;">
            <div class="glow-box" style="background: rgba(255,255,255,0.05); padding: 40px; border-radius: 12px; display: inline-block;">
                <h1 style="color: #ef4444; margin-bottom: 20px;">LỖI</h1>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">${message}</p>
                <a href="/" 
                    style="background: #333; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                    QUAY LẠI
                </a>
            </div>
        </div>
    </body>
    </html>
    `;
}
