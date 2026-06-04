// background.js - Универсальный сервис-воркер для всех браузеров
'use strict';

// Определение API браузера
const browserAPI = (function() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        return chrome;
    }
    if (typeof browser !== 'undefined' && browser.runtime) {
        return browser;
    }
    return null;
})();

if (!browserAPI) {
    console.error('GRND.GG: Браузер не поддерживается');
}

// Универсальное хранилище
const storage = {
    sync: {
        get: (keys) => new Promise((resolve) => {
            browserAPI.storage.sync.get(keys, resolve);
        }),
        set: (items) => new Promise((resolve) => {
            browserAPI.storage.sync.set(items, resolve);
        })
    },
    local: {
        get: (keys) => new Promise((resolve) => {
            browserAPI.storage.local.get(keys, resolve);
        }),
        set: (items) => new Promise((resolve) => {
            browserAPI.storage.local.set(items, resolve);
        })
    }
};

let monitoringInterval = null;
let isChecking = false;
let lastCheckedCount = 0;
let lastCheckedMaxId = null;

// Определение браузера (работает в Service Worker)
function getBrowserInfo() {
    try {
        if (typeof navigator !== 'undefined' && navigator.userAgent) {
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes('firefox')) return 'firefox';
            if (userAgent.includes('edg')) return 'edge';
            if (userAgent.includes('opr') || userAgent.includes('opera')) return 'opera';
            if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
            if (userAgent.includes('yabrowser')) return 'yandex';
            if (userAgent.includes('chrome')) return 'chrome';
        }
    } catch(e) {}
    
    if (typeof browser !== 'undefined' && browser.runtime && typeof chrome === 'undefined') {
        return 'firefox';
    }
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
            if (navigator.userAgent?.includes('Edg')) return 'edge';
        } catch(e) {}
        return 'chrome';
    }
    return 'unknown';
}

const browserName = getBrowserInfo();
console.log(`GRND.GG: Обнаружен браузер: ${browserName}`);

// Универсальная функция показа уведомления
async function showUniversalNotification(complaintId, complaintData) {
    console.log(`GRND.GG: Показываем уведомление для #${complaintId} в ${browserName}`);
    
    const notificationSent = await storage.local.get(`notification_sent_${complaintId}`);
    if (notificationSent[`notification_sent_${complaintId}`]) {
        console.log('GRND.GG: Уведомление уже отправлено');
        return;
    }
    
    await storage.local.set({ [`notification_sent_${complaintId}`]: true });
    setTimeout(async () => {
        await storage.local.remove(`notification_sent_${complaintId}`);
    }, 30000);
    
    const message = `Новая жалоба #${complaintId}\nОт: ${complaintData?.complainant || '?'}\nНа: ${complaintData?.accused || '?'}`;
    
    let notificationCreated = false;
    
    // СПОСОБ 1: chrome.notifications / browser.notifications
    if (browserAPI.notifications && browserName !== 'safari') {
        try {
            const notificationId = `complaint_${complaintId}_${Date.now()}`;
            await browserAPI.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: browserAPI.runtime.getURL('icons/grndlogo.png'),
                title: '🔔 НОВАЯ ЖАЛОБА!',
                message: message,
                priority: 2,
                buttons: [{ title: '📋 Открыть' }],
                requireInteraction: true,
                silent: false
            });
            
            await storage.local.set({ [`notification_${notificationId}`]: complaintId });
            console.log(`GRND.GG: ${browserName} уведомление создано`);
            notificationCreated = true;
            
            setTimeout(() => {
                if (browserAPI.notifications.clear) {
                    browserAPI.notifications.clear(notificationId).catch(() => {});
                }
            }, 20000);
        } catch (e) {
            console.log(`GRND.GG: Notifications API не поддерживается: ${e.message}`);
        }
    }
    
    // СПОСОБ 2: Всплывающее окно на активной вкладке
    if (!notificationCreated) {
        try {
            const tabs = await getActiveTab();
            if (tabs && tabs.id) {
                await executeScriptInTab(tabs.id, function(complaintId, complainant, accused) {
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 100000;
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        border-left: 4px solid #ff4444;
                        border-radius: 12px;
                        padding: 16px 20px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        color: white;
                        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                        min-width: 280px;
                        max-width: 350px;
                        animation: slideIn 0.3s ease-out;
                        cursor: pointer;
                    `;
                    notification.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 28px;">🔔</div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #ff4444;">НОВАЯ ЖАЛОБА!</div>
                                <div style="font-size: 18px; font-weight: bold;">#${complaintId}</div>
                                <div style="font-size: 11px; color: #aaa;">📤 ${complainant} → 📥 ${accused}</div>
                            </div>
                            <button id="closeToast" style="background: none; border: none; color: #888; font-size: 18px; cursor: pointer;">✕</button>
                        </div>
                        <style>
                            @keyframes slideIn {
                                from { transform: translateX(100%); opacity: 0; }
                                to { transform: translateX(0); opacity: 1; }
                            }
                        </style>
                    `;
                    document.body.appendChild(notification);
                    const closeBtn = notification.querySelector('#closeToast');
                    closeBtn.onclick = (e) => { e.stopPropagation(); notification.remove(); };
                    notification.onclick = (e) => { if (e.target !== closeBtn) window.location.reload(); };
                    setTimeout(() => notification.remove(), 8000);
                }, [complaintId, complaintData?.complainant || '?', complaintData?.accused || '?']);
                
                console.log('GRND.GG: Уведомление через executeScript отправлено');
                notificationCreated = true;
            }
        } catch (e) {
            console.log('GRND.GG: executeScript не сработал:', e.message);
        }
    }
    
    // СПОСОБ 3: Сохранение в storage для Safari
    if (!notificationCreated && browserName === 'safari') {
        try {
            const pending = await storage.local.get('pendingNotifications');
            const pendingList = pending.pendingNotifications || [];
            pendingList.unshift({
                id: complaintId,
                complainant: complaintData?.complainant || '?',
                accused: complaintData?.accused || '?',
                time: Date.now()
            });
            while (pendingList.length > 10) pendingList.pop();
            await storage.local.set({ pendingNotifications: pendingList });
            console.log('GRND.GG: Уведомление сохранено в storage для Safari');
            notificationCreated = true;
        } catch (e) {
            console.log('GRND.GG: Ошибка сохранения в storage:', e.message);
        }
    }
    
    // Звук
    try {
        await playNotificationSound();
    } catch (e) {
        console.log('GRND.GG: Звук не воспроизведен:', e.message);
    }
    
    return notificationCreated;
}

// Вспомогательные функции для работы с вкладками
async function getActiveTab() {
    try {
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
    } catch (e) {
        console.log('Ошибка получения активной вкладки:', e);
        return null;
    }
}

async function executeScriptInTab(tabId, func, args) {
    try {
        await browserAPI.scripting.executeScript({
            target: { tabId: tabId },
            func: func,
            args: args
        });
    } catch (e) {
        console.log('Ошибка выполнения скрипта:', e);
        throw e;
    }
}

// Функция проверки новых жалоб
async function checkForNewComplaints() {
    if (isChecking) {
        console.log('GRND.GG: Проверка уже выполняется');
        return;
    }
    isChecking = true;
    
    try {
        const result = await storage.sync.get(['monitoringSettings']);
        const monitoringSettings = result.monitoringSettings;
        
        if (!monitoringSettings || !monitoringSettings.enabled) {
            console.log('GRND.GG: Мониторинг выключен');
            return;
        }
        
        console.log('GRND.GG: Проверка таблицы жалоб...');
        
        let tabsWithComplaints = [];
        try {
            tabsWithComplaints = await browserAPI.tabs.query({ url: "https://grnd.gg/admin/complaints" });
        } catch (e) {
            console.log('GRND.GG: Ошибка поиска вкладок:', e);
        }
        
        let tableData = null;
        
        if (tabsWithComplaints.length > 0) {
            const complaintTab = tabsWithComplaints[0];
            try {
                const response = await sendMessageToTab(complaintTab.id, { action: 'getComplaintsTableData' });
                tableData = response;
            } catch (error) {
                console.log('GRND.GG: Не удалось получить данные:', error);
                try {
                    await browserAPI.scripting.executeScript({
                        target: { tabId: complaintTab.id },
                        files: ['content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const response = await sendMessageToTab(complaintTab.id, { action: 'getComplaintsTableData' });
                    tableData = response;
                } catch (injError) {
                    console.error('GRND.GG: Ошибка инжекта:', injError);
                }
            }
        } else {
            console.log('GRND.GG: Нет открытой вкладки, мониторинг продолжает работу');
            isChecking = false;
            return;
        }
        
        if (!tableData || !tableData.success) {
            console.log('GRND.GG: Не удалось получить данные таблицы');
            return;
        }
        
        const currentCount = tableData.count;
        const currentMaxId = tableData.maxId;
        const firstComplaint = tableData.firstComplaint;
        
        console.log(`GRND.GG: Всего жалоб: ${currentCount}, Максимальный ID: ${currentMaxId}`);
        
        let hasNewComplaint = false;
        let newComplaintId = null;
        
        if (lastCheckedCount > 0 && currentCount > lastCheckedCount) {
            hasNewComplaint = true;
            newComplaintId = currentMaxId;
            console.log(`🎉 НОВАЯ ЖАЛОБА! Количество увеличилось: ${lastCheckedCount} -> ${currentCount}`);
        } else if (lastCheckedMaxId && currentMaxId && currentMaxId > lastCheckedMaxId) {
            hasNewComplaint = true;
            newComplaintId = currentMaxId;
            console.log(`🎉 НОВАЯ ЖАЛОБА! ID увеличился: ${lastCheckedMaxId} -> ${currentMaxId}`);
        }
        
        if (hasNewComplaint && newComplaintId) {
            console.log(`🔔 Обнаружена новая жалоба #${newComplaintId}`);
            
            if (monitoringSettings.notificationsEnabled !== false) {
                await showUniversalNotification(newComplaintId, firstComplaint);
            }
            
            lastCheckedCount = currentCount;
            lastCheckedMaxId = currentMaxId;
            await storage.local.set({ 
                lastCheckedCount: currentCount,
                lastCheckedMaxId: currentMaxId
            });
            
        } else if (lastCheckedCount === 0) {
            lastCheckedCount = currentCount;
            lastCheckedMaxId = currentMaxId;
            await storage.local.set({ 
                lastCheckedCount: currentCount,
                lastCheckedMaxId: currentMaxId
            });
            console.log(`GRND.GG: Начальное состояние: ${currentCount} жалоб, макс ID: ${currentMaxId}`);
        }
        
    } catch (error) {
        console.error('GRND.GG: Ошибка проверки:', error);
    } finally {
        isChecking = false;
    }
}

// Отправка сообщения в tab
async function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        browserAPI.tabs.sendMessage(tabId, message, (response) => {
            if (browserAPI.runtime.lastError) {
                reject(browserAPI.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

// Функция для обновления страницы
async function refreshComplaintsListPage() {
    try {
        const tabsWithComplaints = await browserAPI.tabs.query({ url: "https://grnd.gg/admin/complaints" });
        if (tabsWithComplaints.length === 0) return false;
        
        const complaintTab = tabsWithComplaints[0];
        console.log('GRND.GG: Обновляем страницу списка жалоб...');
        await browserAPI.tabs.reload(complaintTab.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    } catch (error) {
        console.error('GRND.GG: Ошибка обновления:', error);
        return false;
    }
}

// Основная функция мониторинга
async function monitorWithRefresh() {
    const result = await storage.sync.get(['monitoringSettings']);
    const monitoringSettings = result.monitoringSettings;
    
    if (!monitoringSettings || !monitoringSettings.enabled) {
        console.log('GRND.GG: Мониторинг выключен');
        return;
    }
    
    await checkForNewComplaints();
    
    if (monitoringSettings.autoRefresh) {
        await refreshComplaintsListPage();
    }
}

// Воспроизведение звука (универсальное)
async function playNotificationSound() {
    try {
        // Для Firefox используем Web Audio API
        if (browserName === 'firefox') {
            // В Firefox service worker не имеет доступа к AudioContext
            // Отправляем сообщение в активную вкладку для воспроизведения звука
            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0 && tabs[0].id) {
                await executeScriptInTab(tabs[0].id, function() {
                    try {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        const audioCtx = new AudioContext();
                        const oscillator = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        oscillator.connect(gain);
                        gain.connect(audioCtx.destination);
                        oscillator.frequency.value = 880;
                        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + 0.2);
                        if (audioCtx.state === 'suspended') audioCtx.resume();
                    } catch(e) { console.log('Sound error:', e); }
                }, []);
            }
        } else {
            // Для Chrome/Edge/Opera используем offscreen document
            try {
                const offscreenUrl = browserAPI.runtime.getURL('offscreen.html');
                const existingContexts = await browserAPI.runtime.getContexts({
                    contextTypes: ['OFFSCREEN_DOCUMENT']
                });
                
                if (existingContexts.length === 0) {
                    await browserAPI.offscreen.createDocument({
                        url: offscreenUrl,
                        reasons: ['AUDIO_PLAYBACK'],
                        justification: 'Воспроизведение звука уведомления о новой жалобе'
                    });
                }
                
                await browserAPI.runtime.sendMessage({ action: 'playSound', type: 'notification' });
            } catch(e) {
                console.log('Offscreen error:', e);
            }
        }
        console.log('GRND.GG: Команда на воспроизведение звука отправлена');
    } catch (error) {
        console.log('GRND.GG: Ошибка воспроизведения звука:', error);
    }
}

function startMonitoring(intervalSeconds = 10) {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
    
    console.log(`GRND.GG: Запуск мониторинга (интервал: ${intervalSeconds}с) в ${browserName}`);
    setTimeout(() => monitorWithRefresh(), 1000);
    monitoringInterval = setInterval(() => monitorWithRefresh(), intervalSeconds * 1000);
}

function stopMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log('GRND.GG: Мониторинг остановлен');
    }
}

// Обработка кликов по уведомлениям
if (browserAPI.notifications) {
    if (browserAPI.notifications.onButtonClicked) {
        browserAPI.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
            if (buttonIndex === 0) {
                const data = await storage.local.get([`notification_${notificationId}`]);
                const tabs = await browserAPI.tabs.query({ url: "https://grnd.gg/admin/complaints*" });
                if (tabs.length > 0) {
                    await browserAPI.tabs.update(tabs[0].id, { active: true });
                } else {
                    await browserAPI.tabs.create({ url: "https://grnd.gg/admin/complaints" });
                }
            }
            if (browserAPI.notifications.clear) {
                browserAPI.notifications.clear(notificationId);
            }
        });
    }
    
    if (browserAPI.notifications.onClicked) {
        browserAPI.notifications.onClicked.addListener(async (notificationId) => {
            const tabs = await browserAPI.tabs.query({ url: "https://grnd.gg/admin/complaints*" });
            if (tabs.length > 0) {
                await browserAPI.tabs.update(tabs[0].id, { active: true });
            } else {
                await browserAPI.tabs.create({ url: "https://grnd.gg/admin/complaints" });
            }
            if (browserAPI.notifications.clear) {
                browserAPI.notifications.clear(notificationId);
            }
        });
    }
}

// Установка расширения
browserAPI.runtime.onInstalled.addListener(async () => {
    console.log(`GRND.GG: Расширение установлено в ${browserName}`);
    
    const savedCount = await storage.local.get('lastCheckedCount');
    const savedMaxId = await storage.local.get('lastCheckedMaxId');
    
    if (savedCount.lastCheckedCount) lastCheckedCount = savedCount.lastCheckedCount;
    if (savedMaxId.lastCheckedMaxId) lastCheckedMaxId = savedMaxId.lastCheckedMaxId;
    
    const settings = await storage.sync.get(['monitoringSettings']);
    if (!settings.monitoringSettings) {
        await storage.sync.set({
            monitoringSettings: {
                enabled: false,
                interval: 10,
                notificationsEnabled: true,
                autoRefresh: true
            }
        });
    } else if (settings.monitoringSettings.enabled) {
        startMonitoring(settings.monitoringSettings.interval || 10);
    }
});

// Обработка сообщений
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('GRND.GG: Сообщение:', request.action);
    
    if (request.action === 'startMonitoring') {
        startMonitoring(request.interval || 10);
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'stopMonitoring') {
        stopMonitoring();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'getMonitoringStatus') {
        sendResponse({
            isRunning: monitoringInterval !== null,
            lastCount: lastCheckedCount,
            lastMaxId: lastCheckedMaxId,
            browser: browserName
        });
        return true;
    }
    
    if (request.action === 'saveMonitoringSettings') {
        storage.sync.set({ monitoringSettings: request.settings }, () => {
            if (request.settings.enabled) {
                startMonitoring(request.settings.interval || 10);
            } else {
                stopMonitoring();
            }
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'manualCheck') {
        checkForNewComplaints();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'testSound') {
        playNotificationSound();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'testPageNotification') {
        console.log('GRND.GG: Тест уведомления');
        const testId = Math.floor(Math.random() * 1000);
        showUniversalNotification(testId, { complainant: 'Тестовый', accused: 'Пользователь' });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'getTemplates') {
        storage.sync.get(['responseTemplates'], (result) => {
            sendResponse({ templates: result.responseTemplates || [] });
        });
        return true;
    }
    
    if (request.action === 'saveTemplates') {
        storage.sync.set({ responseTemplates: request.templates }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'getApprovedTemplates') {
        storage.sync.get(['approvedTemplates'], (result) => {
            sendResponse({ templates: result.approvedTemplates || [] });
        });
        return true;
    }
    
    if (request.action === 'saveApprovedTemplates') {
        storage.sync.set({ approvedTemplates: request.templates }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'getRejectedTemplates') {
        storage.sync.get(['rejectedTemplates'], (result) => {
            sendResponse({ templates: result.rejectedTemplates || [] });
        });
        return true;
    }
    
    if (request.action === 'saveRejectedTemplates') {
        storage.sync.set({ rejectedTemplates: request.templates }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    return false;
});
