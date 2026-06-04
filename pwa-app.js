// pwa-app.js - Автономная PWA версия
(function() {
    // Сохраняем настройки
    let settings = {
        monitoringEnabled: false,
        interval: 10,
        lastCheckedCount: 0,
        lastCheckedMaxId: null
    };
    
    let monitoringInterval = null;
    
    // Загрузка настроек
    function loadSettings() {
        const saved = localStorage.getItem('grnd_settings');
        if (saved) {
            settings = JSON.parse(saved);
            updateUI();
        }
    }
    
    // Сохранение настроек
    function saveSettings() {
        localStorage.setItem('grnd_settings', JSON.stringify(settings));
    }
    
    // Обновление UI
    function updateUI() {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div>📊 Мониторинг: ${settings.monitoringEnabled ? '✅ Включен' : '❌ Выключен'}</div>
                <div>📝 Последних жалоб: ${settings.lastCheckedCount || 0}</div>
                <div>🆔 Последний ID: ${settings.lastCheckedMaxId || '—'}</div>
            `;
        }
    }
    
    // Проверка новых жалоб (через fetch)
    async function checkNewComplaints() {
        try {
            const response = await fetch('https://grnd.gg/admin/complaints', {
                credentials: 'include'
            });
            const html = await response.text();
            
            // Парсим HTML для поиска жалоб
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Ищем максимальный ID жалобы
            const links = doc.querySelectorAll('a[href*="/admin/complaints/"]');
            let maxId = 0;
            
            links.forEach(link => {
                const match = link.href.match(/\/admin\/complaints\/[^/]+\/(\d+)/);
                if (match && parseInt(match[1]) > maxId) {
                    maxId = parseInt(match[1]);
                }
            });
            
            if (maxId > 0 && maxId > (settings.lastCheckedMaxId || 0)) {
                // Новая жалоба!
                showNotification(maxId);
                settings.lastCheckedCount++;
                settings.lastCheckedMaxId = maxId;
                saveSettings();
                updateUI();
            }
            
        } catch (error) {
            console.error('Ошибка проверки:', error);
        }
    }
    
    // Показ уведомления
    function showNotification(complaintId) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 НОВАЯ ЖАЛОБА!', {
                body: `Жалоба #${complaintId} требует внимания!`,
                icon: 'icons/grndlogo.png',
                vibrate: [200, 100, 200]
            });
        }
        
        // Звук
        const audio = new Audio('data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==');
        audio.play().catch(() => {});
    }
    
    // Запуск мониторинга
    function startMonitoring() {
        if (monitoringInterval) clearInterval(monitoringInterval);
        if (settings.monitoringEnabled) {
            monitoringInterval = setInterval(() => {
                checkNewComplaints();
            }, settings.interval * 1000);
        }
    }
    
    // Запрос разрешения на уведомления
    async function requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Уведомления разрешены');
            }
        }
    }
    
    // Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        requestNotificationPermission();
        
        const openBtn = document.getElementById('openComplaintsBtn');
        const testBtn = document.getElementById('testNotificationBtn');
        
        if (openBtn) {
            openBtn.onclick = () => {
                window.open('https://grnd.gg/admin/complaints', '_blank');
            };
        }
        
        if (testBtn) {
            testBtn.onclick = () => {
                showNotification('TEST');
            };
        }
        
        // Запускаем мониторинг если включен
        if (settings.monitoringEnabled) {
            startMonitoring();
        }
    });
    
    // Сохраняем в глобальный объект для доступа из консоли
    window.GRND = {
        checkNow: checkNewComplaints,
        enableMonitoring: () => {
            settings.monitoringEnabled = true;
            saveSettings();
            startMonitoring();
            updateUI();
        },
        disableMonitoring: () => {
            settings.monitoringEnabled = false;
            saveSettings();
            if (monitoringInterval) clearInterval(monitoringInterval);
            updateUI();
        }
    };
})();
