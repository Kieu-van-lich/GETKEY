document.addEventListener('DOMContentLoaded', () => {
    const statusContainer = document.getElementById('status-container');
    const statusText = document.getElementById('status-text');
    const statusTitle = document.getElementById('status-title');
    const statusIcon = document.getElementById('status-icon');
    const getKeyBtns = document.querySelectorAll('.btn-get-key');

    // Remove HWID check logic. Set system to ready by default.
    statusContainer.classList.add('ready');
    statusIcon.className = 'fas fa-check-circle';
    statusTitle.textContent = 'Hệ Thống Sẵn Sàng';
    statusText.innerHTML = 'Key tự động làm mới vào 0h00 mỗi ngày.';
    
    // Enable all buttons
    getKeyBtns.forEach(btn => btn.disabled = false);

    getKeyBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gameId = btn.getAttribute('data-game');
            const originalText = btn.innerHTML;
            
            // Disable all buttons during request
            getKeyBtns.forEach(b => b.disabled = true);
            btn.querySelector('span').innerText = 'ĐANG TẠO...';
            
            try {
                // Call generate_link without HWID
                const response = await fetch(`/api/generate_link?game=${encodeURIComponent(gameId)}`);
                const data = await response.json();

                if (data.success && data.redirect_url) {
                    statusText.innerHTML = 'Đang chuyển hướng đến trang lấy Key...';
                    window.location.href = data.redirect_url;
                } else {
                    statusContainer.classList.remove('ready');
                    statusContainer.classList.add('error');
                    statusIcon.className = 'fas fa-exclamation-triangle';
                    statusTitle.textContent = 'Lỗi Tạo Link';
                    statusText.innerHTML = `[LỖI] ${data.error || 'Tạo link thất bại'}`;
                    
                    // Re-enable buttons
                    getKeyBtns.forEach(b => b.disabled = false);
                    btn.innerHTML = originalText;
                }
            } catch (error) {
                statusContainer.classList.remove('ready');
                statusContainer.classList.add('error');
                statusIcon.className = 'fas fa-exclamation-triangle';
                statusTitle.textContent = 'Lỗi Kết Nối';
                statusText.innerHTML = `[LỖI] Mất kết nối máy chủ.`;
                
                // Re-enable buttons
                getKeyBtns.forEach(b => b.disabled = false);
                btn.innerHTML = originalText;
            }
        });
    });
});
