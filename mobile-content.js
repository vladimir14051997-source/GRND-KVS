// mobile-content.js - Мобильная оптимизация
(function() {
    'use strict';
    
    let touchStartY = 0;
    let isMenuOpen = true;
    
    // Функция для определения мобильного устройства
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }
    
    // Добавление поддержки свайпов для закрытия меню
    function addSwipeSupport(menuElement) {
        if (!menuElement || !isMobileDevice()) return;
        
        menuElement.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        
        menuElement.addEventListener('touchmove', (e) => {
            const touchEndY = e.touches[0].clientY;
            const diffY = touchEndY - touchStartY;
            
            if (diffY > 50 && touchStartY > 0) {
                // Свайп вниз - закрываем меню
                menuElement.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    if (menuElement.style.display !== 'none') {
                        menuElement.style.display = 'none';
                    }
                    menuElement.style.transform = '';
                }, 300);
            } else if (diffY < -50) {
                // Свайп вверх - открываем
                menuElement.style.display = 'block';
                menuElement.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Увеличенные кнопки для мобильных
    function enhanceButtonsForMobile() {
        if (!isMobileDevice()) return;
        
        const buttons = document.querySelectorAll('#grnd-floating-menu button');
        buttons.forEach(btn => {
            btn.style.minHeight = '48px';
            btn.style.padding = '12px 16px';
            btn.style.fontSize = '16px';
            
            // Убираем задержку при нажатии
            btn.addEventListener('touchstart', (e) => {
                btn.style.opacity = '0.7';
            });
            btn.addEventListener('touchend', () => {
                btn.style.opacity = '1';
            });
        });
    }
    
    // Улучшенное уведомление для мобильных
    const originalShowPageNotification = window.showPageNotification;
    if (isMobileDevice()) {
        window.showPageNotification = function(complaintId, complainant, accused) {
            // Убираем старые уведомления
            const oldNotifications = document.querySelectorAll('.grnd-page-notification');
            oldNotifications.forEach(n => n.remove());
            
            const notification = document.createElement('div');
            notification.className = 'grnd-page-notification';
            notification.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 20px;
                right: 20px;
                z-index: 100000;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-left: 4px solid #ff4444;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                color: white;
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                animation: grndMobileSlideUp 0.3s ease-out;
                cursor: pointer;
                backdrop-filter: blur(10px);
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-size: 40px;">🔔</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #ff4444; font-size: 16px;">⚠️ НОВАЯ ЖАЛОБА!</div>
                        <div style="font-size: 20px; font-weight: bold; margin: 6px 0;">#${complaintId}</div>
                        <div style="font-size: 13px; color: #ddd;">
                            📤 ${complainant || '?'}<br>
                            📥 ${accused || '?'}
                        </div>
                    </div>
                    <button class="grnd-notification-close" style="background: none; border: none; color: #888; font-size: 28px; cursor: pointer; width: 48px; height: 48px;">✕</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            const closeBtn = notification.querySelector('.grnd-notification-close');
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                notification.remove();
            };
            
            notification.onclick = (e) => {
                if (e.target !== closeBtn) {
                    window.location.reload();
                }
            };
            
            setTimeout(() => notification.remove(), 10000);
        };
    }
    
    // Автоматическое позиционирование меню для мобильных
    function optimizeMenuPosition() {
        if (!isMobileDevice()) return;
        
        const menu = document.getElementById('grnd-floating-menu');
        if (!menu) return;
        
        // Перемещаем меню вниз экрана
        menu.style.position = 'fixed';
        menu.style.bottom = '20px';
        menu.style.top = 'auto';
        menu.style.right = '20px';
        menu.style.left = 'auto';
        menu.style.maxWidth = '400px';
        menu.style.width = 'calc(100% - 40px)';
        
        addSwipeSupport(menu);
    }
    
    // Наблюдатель за появлением меню
    const menuObserver = new MutationObserver(() => {
        const menu = document.getElementById('grnd-floating-menu');
        if (menu && !menu.dataset.mobileOptimized) {
            optimizeMenuPosition();
            enhanceButtonsForMobile();
            menu.dataset.mobileOptimized = 'true';
        }
    });
    
    if (document.body) {
        menuObserver.observe(document.body, { childList: true, subtree: true });
    }
    
    // Добавляем мета-тег для viewport если его нет
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes';
        document.head.appendChild(viewport);
    }
    
    console.log('GRND.GG: Мобильная оптимизация загружена');
})();
