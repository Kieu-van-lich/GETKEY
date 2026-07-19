const crypto = require('crypto');

// Secret key to generate the daily hash (User should set this in Vercel)
const DAILY_SECRET = process.env.DAILY_SECRET || 'ONLYTRIS_SECRET_123';

function getDailyKey() {
    // Get current date string (YYYY-MM-DD) based on UTC+7 (Vietnam time)
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vnTime = new Date(utcTime + (3600000 * 7));
    const dateStr = vnTime.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Generate SHA-256 hash of Date + Secret
    const hashBuffer = crypto.createHash('sha256').update(dateStr + DAILY_SECRET).digest();
    
    // Convert to base64, remove non-alphanumeric chars
    let base64str = hashBuffer.toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    
    // Format the key: FREEKEY_[13 chars]
    return 'FREEKEY_' + base64str.substring(0, 13);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Key' });
    }

    try {
        const expectedDailyKey = getDailyKey();

        if (key === expectedDailyKey) {
            return res.status(200).json({ 
                status: 'success', 
                message: 'Authentication successful. Key is valid for today.'
            });
        } else {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Key không hợp lệ hoặc đã hết hạn (Key reset vào 0h00 mỗi ngày).'
            });
        }

    } catch (err) {
        console.error('Check key error:', err);
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
}
