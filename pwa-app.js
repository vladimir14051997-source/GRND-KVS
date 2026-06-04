// Добавьте это в начало pwa-app.js
function openComplaints() {
    window.location.href = 'https://grnd.gg/admin/complaints';
}

function openExtension() {
    // Открываем настройки расширения
    window.location.href = 'chrome://extensions';
}

function testNotification() {
    // Проверяем, установлено ли расширение
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ action: 'testSound' });
        alert('🔊 Тест звука отправлен в расширение!');
    } else {
        alert('❌ Расширение не установлено!\n\nУстановите расширение через chrome://extensions');
    }
}
