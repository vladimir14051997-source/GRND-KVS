// content.js - Универсальная версия для всех браузеров
(function() {
    'use strict';

    // Универсальное API хранилища
    const getStorageAPI = () => {
        if (typeof chrome !== 'undefined' && chrome.storage) return chrome;
        if (typeof browser !== 'undefined' && browser.storage) return browser;
        return null;
    };

    const storageAPI = getStorageAPI();
    if (!storageAPI) {
        console.error('GRND.GG: Storage API не найдено');
        return;
    }

    const storage = storageAPI.storage;
    
    let floatingMenu = null;
    let currentComplaintId = null;

    function getCurrentComplaintId() {
        const url = window.location.href;
        let match = url.match(/\/complaints?\/(\d+)/i);
        if (match) return match[1];
        
        match = url.match(/[?&]id=(\d+)/i);
        if (match) return match[1];
        
        const title = document.title;
        match = title.match(/#\s*(\d+)/);
        if (match) return match[1];
        
        const titleElement = document.querySelector('.title');
        if (titleElement) {
            match = titleElement.textContent.trim().match(/#\s*(\d+)/);
            if (match) return match[1];
        }
        
        const bodyText = document.body.innerText;
        match = bodyText.match(/жалоб[аы]\s*#\s*(\d+)/i);
        if (match) return match[1];
        
        return null;
    }

    let lastUrl = window.location.href;
    function checkUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            const newId = getCurrentComplaintId();
            if (newId !== currentComplaintId) {
                currentComplaintId = newId;
                console.log(`GRND.GG: ID жалобы: ${currentComplaintId}`);
            }
            if (floatingMenu) {
                floatingMenu.remove();
                floatingMenu = null;
            }
            createButtons();
            addPunishmentButtonNearVerdict();
        }
    }
    
    const observer = new MutationObserver(() => checkUrlChange());
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    setInterval(checkUrlChange, 1000);
    
    function getComplaintsTableData() {
        try {
            const tbody = document.querySelector('tbody');
            if (!tbody) {
                return { success: false, error: 'Table not found' };
            }
            
            const rows = tbody.querySelectorAll('tr');
            const complaints = [];
            
            for (const row of rows) {
                const links = row.querySelectorAll('a');
                let complaintId = null;
                let complainant = null;
                let accused = null;
                
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && href.match(/\/admin\/complaints\/[^/]+\/(\d+)/)) {
                        const match = href.match(/\/admin\/complaints\/[^/]+\/(\d+)/);
                        if (match) complaintId = match[1];
                    }
                }
                
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const complainantLink = cells[3]?.querySelector('a');
                    const accusedLink = cells[4]?.querySelector('a');
                    complainant = complainantLink ? complainantLink.textContent.trim() : null;
                    accused = accusedLink ? accusedLink.textContent.trim() : null;
                }
                
                if (complaintId) {
                    complaints.push({
                        id: parseInt(complaintId),
                        complainant: complainant,
                        accused: accused
                    });
                }
            }
            
            if (complaints.length === 0) {
                return { success: false, error: 'No complaints found' };
            }
            
            complaints.sort((a, b) => b.id - a.id);
            const maxId = complaints[0].id;
            const firstComplaint = complaints[0];
            
            return {
                success: true,
                count: complaints.length,
                maxId: maxId,
                firstComplaint: firstComplaint,
                allComplaints: complaints
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    function scrollToComplaint(complaintId) {
        try {
            const tbody = document.querySelector('tbody');
            if (!tbody) return;
            
            const rows = tbody.querySelectorAll('tr');
            for (const row of rows) {
                const links = row.querySelectorAll('a');
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href && href.includes(`/${complaintId}`)) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
                        setTimeout(() => { row.style.backgroundColor = ''; }, 3000);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('GRND.GG: Ошибка прокрутки:', error);
        }
    }
    
    function showPageNotification(complaintId, complainant, accused) {
        const oldNotifications = document.querySelectorAll('.grnd-page-notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'grnd-page-notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 100000;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-left: 4px solid #ff4444;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 320px;
            max-width: 400px;
            animation: grndSlideIn 0.3s ease-out;
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 32px;">🔔</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #ff4444; font-size: 14px;">⚠️ НОВАЯ ЖАЛОБА!</div>
                    <div style="font-size: 20px; font-weight: bold; margin: 4px 0;">Жалоба #${complaintId}</div>
                    <div style="font-size: 12px; color: #ddd; margin-top: 6px;">
                        <div>📤 От: ${complainant || 'неизвестен'}</div>
                        <div>📥 На: ${accused || 'неизвестен'}</div>
                    </div>
                    <div style="font-size: 11px; color: #ffd700; margin-top: 8px;">Нажмите для обновления</div>
                </div>
                <button class="grnd-notification-close" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 20px; padding: 4px 8px;">✕</button>
            </div>
        `;
        
        if (!document.querySelector('#grnd-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'grnd-notification-styles';
            style.textContent = `
                @keyframes grndSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes grndSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
                .grnd-page-notification:hover { transform: translateX(-5px); transition: transform 0.2s; }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        const closeBtn = notification.querySelector('.grnd-notification-close');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            notification.style.animation = 'grndSlideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        };
        
        const autoCloseTimer = setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'grndSlideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
        
        notification.onclick = (e) => {
            if (e.target !== closeBtn) {
                clearTimeout(autoCloseTimer);
                window.location.reload();
            }
        };
    }

    function extractComplaintData() {
        let complaintNumber = getCurrentComplaintId() || "не указан";
        let complainant = "не указан";
        let accused = "не указан";
        
        const labels = document.querySelectorAll('.label');
        for (const label of labels) {
            const labelText = label.textContent.trim();
            let valueElement = label.nextElementSibling;
            if (!valueElement || !valueElement.classList.contains('title')) {
                const parent = label.closest('.item');
                if (parent) {
                    const valueDiv = parent.querySelector('.title');
                    if (valueDiv) valueElement = valueDiv;
                }
            }
            if (valueElement) {
                let value = valueElement.textContent.trim().replace('#', '').trim();
                if (labelText === 'Жалоба от') complainant = value;
                else if (labelText === 'Жалоба на') accused = value;
            }
        }
        
        return { complaintNumber, complainant, accused };
    }

    function findTextarea() {
        let textarea = document.querySelector('textarea');
        if (!textarea) {
            const editableDiv = document.querySelector('[contenteditable="true"]');
            if (editableDiv) return editableDiv;
        }
        return textarea;
    }

    function insertText(template, data) {
        const textarea = findTextarea();
        if (!textarea) {
            alert('❌ Не найдено поле для ввода ответа');
            return;
        }
        
        let text = template.text;
        text = text.replace(/\{complain_from\}/gi, data.complainant);
        text = text.replace(/\{complain_number\}/gi, data.complaintNumber);
        text = text.replace(/\{complain_on\}/gi, data.accused);
        
        if (textarea.tagName === 'TEXTAREA') {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            textarea.innerText = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function createApprovedSubmenu(data, templates) {
        if (!templates || templates.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = '⚠️ Нет одобрительных шаблонов';
            emptyDiv.style.cssText = 'color: #ffaa00; font-size: 11px; text-align: center; padding: 5px;';
            return emptyDiv;
        }
        
        const container = document.createElement('div');
        container.style.cssText = 'margin-bottom: 8px;';
        
        const mainBtn = document.createElement('button');
        mainBtn.textContent = `✅ Одобрена (${templates.length}) ▼`;
        mainBtn.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            border: none;
            border-radius: 20px;
            color: white;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 4px;
        `;
        
        const submenu = document.createElement('div');
        submenu.style.cssText = `
            display: none;
            flex-direction: column;
            gap: 4px;
            margin-top: 4px;
            padding: 6px;
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            max-height: 250px;
            overflow-y: auto;
        `;
        
        templates.forEach(template => {
            const subBtn = document.createElement('button');
            subBtn.textContent = template.name;
            subBtn.title = template.description || '';
            subBtn.style.cssText = `
                padding: 8px 10px;
                background: rgba(46, 204, 113, 0.3);
                border: 1px solid #2ecc71;
                border-radius: 16px;
                color: #2ecc71;
                cursor: pointer;
                font-size: 11px;
                text-align: left;
            `;
            subBtn.onclick = () => {
                insertText(template, data);
                subBtn.textContent = '✓';
                setTimeout(() => { subBtn.textContent = template.name; }, 800);
            };
            submenu.appendChild(subBtn);
        });
        
        mainBtn.onclick = (e) => {
            e.stopPropagation();
            const isVisible = submenu.style.display === 'flex';
            submenu.style.display = isVisible ? 'none' : 'flex';
            mainBtn.textContent = isVisible ? `✅ Одобрена (${templates.length}) ▼` : `✅ Одобрена (${templates.length}) ▲`;
        };
        
        container.appendChild(mainBtn);
        container.appendChild(submenu);
        return container;
    }

    function createRejectedSubmenu(data, templates) {
        if (!templates || templates.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.textContent = '⚠️ Нет шаблонов отклонения';
            emptyDiv.style.cssText = 'color: #ffaa00; font-size: 11px; text-align: center; padding: 5px;';
            return emptyDiv;
        }
        
        const container = document.createElement('div');
        container.style.cssText = 'margin-bottom: 8px;';
        
        const mainBtn = document.createElement('button');
        mainBtn.textContent = `❌ Отклонена (${templates.length}) ▼`;
        mainBtn.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            border: none;
            border-radius: 20px;
            color: white;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 4px;
        `;
        
        const submenu = document.createElement('div');
        submenu.style.cssText = `
            display: none;
            flex-direction: column;
            gap: 4px;
            margin-top: 4px;
            padding: 6px;
            background: rgba(0,0,0,0.4);
            border-radius: 12px;
            max-height: 250px;
            overflow-y: auto;
        `;
        
        templates.forEach(template => {
            const subBtn = document.createElement('button');
            subBtn.textContent = template.name;
            subBtn.title = template.description || '';
            subBtn.style.cssText = `
                padding: 8px 10px;
                background: rgba(231, 76, 60, 0.3);
                border: 1px solid #e74c3c;
                border-radius: 16px;
                color: #e74c3c;
                cursor: pointer;
                font-size: 11px;
                text-align: left;
            `;
            subBtn.onclick = () => {
                insertText(template, data);
                subBtn.textContent = '✓';
                setTimeout(() => { subBtn.textContent = template.name; }, 800);
            };
            submenu.appendChild(subBtn);
        });
        
        mainBtn.onclick = (e) => {
            e.stopPropagation();
            const isVisible = submenu.style.display === 'flex';
            submenu.style.display = isVisible ? 'none' : 'flex';
            mainBtn.textContent = isVisible ? `❌ Отклонена (${templates.length}) ▼` : `❌ Отклонена (${templates.length}) ▲`;
        };
        
        container.appendChild(mainBtn);
        container.appendChild(submenu);
        return container;
    }

    function addPunishmentButtonNearVerdict() {
        const verdictButton = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent.trim() === 'Вынести приговор'
        );
        
        if (!verdictButton || document.getElementById('grnd-punishment-btn')) return;
        
        const punishmentBtn = document.createElement('button');
        punishmentBtn.id = 'grnd-punishment-btn';
        punishmentBtn.textContent = '⚖️ Наказание';
        punishmentBtn.style.cssText = `
            background: linear-gradient(135deg, #f39c12, #e67e22);
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            padding: 8px 16px;
            margin-left: 12px;
            transition: all 0.2s ease;
        `;
        
        punishmentBtn.onclick = async () => {
            const complaintNumber = getCurrentComplaintId() || "unknown";
            const data = extractComplaintData();
            await extractAndCopyPunishment(complaintNumber, data.accused);
        };
        
        verdictButton.parentNode.insertBefore(punishmentBtn, verdictButton.nextSibling);
    }

    function findVerdictText() {
        const formControl = document.querySelector('.form-control');
        if (formControl && (formControl.tagName === 'TEXTAREA' || formControl.tagName === 'INPUT')) {
            const value = formControl.value || formControl.innerText;
            if (value && value.trim()) return value.trim();
        }
        
        const textareas = document.querySelectorAll('textarea');
        for (const ta of textareas) {
            if (ta.value && ta.value.trim()) return ta.value.trim();
        }
        
        const editableDiv = document.querySelector('[contenteditable="true"]');
        if (editableDiv && editableDiv.innerText && editableDiv.innerText.trim()) {
            return editableDiv.innerText.trim();
        }
        
        return null;
    }
    
    function parsePunishmentFromVerdict() {
        const verdictText = findVerdictText();
        if (!verdictText) {
            showToastMessage('❌ Не найден текст приговора!', true);
            return null;
        }
        
        const lowerText = verdictText.toLowerCase();
        const punishments = [];
        
        function findDurationNearKeyword(text, keyword, defaultDuration) {
            const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
            if (keywordIndex === -1) return defaultDuration;
            const context = text.substring(keywordIndex, keywordIndex + 60);
            const numberMatch = context.match(/(\d{1,3})/);
            if (numberMatch) {
                const foundNumber = parseInt(numberMatch[1]);
                if (foundNumber < 100 && foundNumber > 0) return foundNumber;
            }
            return defaultDuration;
        }
        
        function findReason(text) {
            const reasonMatch = text.match(/по причине\s+([\d\.]+\s*[А-Яа-яA-Za-z\s]+?)(?=[.,;!]|$)/i);
            if (reasonMatch && reasonMatch[1]) {
                return reasonMatch[1].trim().replace(/\.$/, '').replace(/\s+/g, ' ');
            }
            return null;
        }
        
        if (lowerText.includes('деморган') || lowerText.includes('demorgan')) {
            punishments.push({ type: 'jail', duration: findDurationNearKeyword(verdictText, 'деморган', 60), reason: findReason(verdictText) || 'Нарушение ПД', unit: 'minutes' });
        }
        if (lowerText.includes('mute') || lowerText.includes('мут')) {
            punishments.push({ type: 'mute', duration: findDurationNearKeyword(verdictText, 'мут', 30), reason: findReason(verdictText) || 'Нарушение чата', unit: 'minutes' });
        }
        if (lowerText.includes('ban') || lowerText.includes('бан')) {
            punishments.push({ type: 'ban', duration: findDurationNearKeyword(verdictText, 'бан', 7), reason: findReason(verdictText) || 'Нарушение правил', unit: 'days' });
        }
        if (lowerText.includes('warn') || lowerText.includes('варн')) {
            punishments.push({ type: 'warn', duration: null, reason: findReason(verdictText) || 'Нарушение правил', unit: null });
        }
        if ((lowerText.includes('jail') || lowerText.includes('джаил')) && !lowerText.includes('деморган')) {
            punishments.push({ type: 'jail', duration: findDurationNearKeyword(verdictText, 'джаил', 60), reason: findReason(verdictText) || 'Нарушение ПД', unit: 'minutes' });
        }
        
        const uniquePunishments = [];
        const types = new Set();
        for (const p of punishments) {
            if (!types.has(p.type)) {
                types.add(p.type);
                uniquePunishments.push(p);
            }
        }
        
        if (uniquePunishments.length === 0) {
            showToastMessage('❌ Не удалось определить тип наказания!', true);
            return null;
        }
        
        return uniquePunishments;
    }
    
    async function extractAndCopyPunishment(complaintNumber, accused) {
        try {
            const adminResult = await new Promise((resolve) => {
                storage.local.get(['adminName'], resolve);
            });
            const adminName = adminResult.adminName || 'Admin';
            const punishments = parsePunishmentFromVerdict();
            
            if (!punishments || punishments.length === 0) return;
            
            const commands = [];
            for (const punishment of punishments) {
                const reason = punishment.reason || 'Нарушение';
                let command = '';
                switch (punishment.type) {
                    case 'mute': command = `/offmute ${accused} ${punishment.duration} ${reason} JB#${complaintNumber} by ${adminName}`; break;
                    case 'ban': command = `/offban ${accused} ${punishment.duration} ${reason} JB#${complaintNumber} by ${adminName}`; break;
                    case 'warn': command = `/offwarn ${accused} ${reason} JB#${complaintNumber} by ${adminName}`; break;
                    case 'jail': command = `/offjail ${accused} ${punishment.duration} ${reason} JB#${complaintNumber} by ${adminName}`; break;
                }
                if (command) commands.push(command);
            }
            
            if (commands.length === 0) return;
            
            await navigator.clipboard.writeText(commands.join('\n'));
            showToastMessage(`✅ ${commands.length} команда(ы) скопирована!`);
        } catch (error) {
            showToastMessage('❌ Ошибка при копировании команды', true);
        }
    }
    
    function showToastMessage(message, isError = false) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 100001;
            background: ${isError ? '#e74c3c' : '#2ecc71'};
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-family: monospace;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: fadeInOut 2s ease-in-out;
            white-space: pre-line;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
        
        if (!document.querySelector('#grnd-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'grnd-toast-styles';
            style.textContent = `@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(20px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); } }`;
            document.head.appendChild(style);
        }
    }

    function createButtons() {
        if (document.getElementById('grnd-floating-menu')) return;
        
        const data = extractComplaintData();
        
        storage.local.get(['adminName'], (adminResult) => {
            const adminName = adminResult.adminName || 'Admin';
            
            storage.sync.get(['approvedTemplates', 'rejectedTemplates', 'responseTemplates'], (result) => {
                const approvedTemplates = result.approvedTemplates || [];
                const rejectedTemplates = result.rejectedTemplates || [];
                
                floatingMenu = document.createElement('div');
                floatingMenu.id = 'grnd-floating-menu';
                floatingMenu.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 320px;
                    z-index: 10000;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 12px;
                    border: 1px solid #a6801d;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                `;
                
                const header = document.createElement('div');
                header.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: rgba(166,128,29,0.2);
                    border-radius: 11px 11px 0 0;
                    cursor: move;
                `;
                header.innerHTML = `
                    <div style="color: #ffd700; font-size: 12px; font-weight: bold;">📋 GRND.GG</div>
                    <div style="display: flex; gap: 8px;">
                        <button id="grnd-collapse-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; width: 20px; border-radius: 4px;">−</button>
                        <button id="grnd-close-btn" style="background: rgba(255,255,255,0.1); border: none; color: white; cursor: pointer; width: 20px; border-radius: 4px;">✕</button>
                    </div>
                `;
                
                const content = document.createElement('div');
                content.id = 'grnd-menu-content';
                content.style.cssText = `padding: 10px;`;
                
                const infoBlock = document.createElement('div');
                infoBlock.style.cssText = `background: rgba(255,255,255,0.08); padding: 6px 8px; border-radius: 8px; font-size: 10px; color: #ccc; margin-bottom: 10px;`;
                infoBlock.innerHTML = `<div>📋 № ${data.complaintNumber}</div><div>📤 От: ${data.complainant}</div><div>📥 На: ${data.accused}</div>`;
                content.appendChild(infoBlock);
                
                content.appendChild(createApprovedSubmenu(data, approvedTemplates));
                content.appendChild(createRejectedSubmenu(data, rejectedTemplates));
                
                const userTemplates = result.responseTemplates || [];
                const filteredUserTemplates = userTemplates.filter(t => !t.name.toLowerCase().includes('одобр') && !t.name.toLowerCase().includes('отклон') && !t.name.toLowerCase().includes('отказ'));
                
                if (filteredUserTemplates.length > 0) {
                    const otherLabel = document.createElement('div');
                    otherLabel.textContent = '📄 Другие ответы:';
                    otherLabel.style.cssText = 'font-size: 10px; color: #aaa; margin: 8px 0 4px 0;';
                    content.appendChild(otherLabel);
                    
                    const btnsRow = document.createElement('div');
                    btnsRow.style.cssText = `display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;`;
                    filteredUserTemplates.forEach(template => {
                        const btn = document.createElement('button');
                        btn.textContent = template.name;
                        btn.style.cssText = `padding: 6px 10px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 16px; color: white; cursor: pointer; font-size: 11px;`;
                        btn.onclick = () => { insertText(template, data); btn.textContent = '✓'; setTimeout(() => { btn.textContent = template.name; }, 800); };
                        btnsRow.appendChild(btn);
                    });
                    content.appendChild(btnsRow);
                }
                
                const settingsRow = document.createElement('div');
                settingsRow.style.cssText = `margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(166,128,29,0.3); display: flex; gap: 8px; align-items: center;`;
                settingsRow.innerHTML = `<span style="font-size: 10px; color: #aaa;">👤 Админ:</span><span id="admin-name-display" style="font-size: 11px; color: #ffd700; cursor: pointer; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px;">${adminName}</span><button id="edit-admin-name" style="background: rgba(255,255,255,0.1); border: none; color: #aaa; cursor: pointer; font-size: 11px; padding: 2px 8px; border-radius: 12px;">✎</button>`;
                content.appendChild(settingsRow);
                
                floatingMenu.appendChild(header);
                floatingMenu.appendChild(content);
                document.body.appendChild(floatingMenu);
                
                document.getElementById('edit-admin-name').onclick = () => {
                    const newName = prompt('Введите ваше имя:', adminName);
                    if (newName && newName.trim()) {
                        storage.local.set({ adminName: newName.trim() });
                        document.getElementById('admin-name-display').textContent = newName.trim();
                        showToastMessage(`Имя сохранено: ${newName.trim()}`);
                    }
                };
                
                let isDragging = false, startX, startY, offsetX = 0, offsetY = 0;
                header.onmousedown = (e) => {
                    if (e.target.id === 'grnd-collapse-btn' || e.target.id === 'grnd-close-btn' || e.target.id === 'edit-admin-name') return;
                    isDragging = true;
                    startX = e.clientX - offsetX;
                    startY = e.clientY - offsetY;
                    header.style.cursor = 'grabbing';
                };
                document.onmousemove = (e) => {
                    if (!isDragging) return;
                    offsetX = e.clientX - startX;
                    offsetY = e.clientY - startY;
                    floatingMenu.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                };
                document.onmouseup = () => { isDragging = false; header.style.cursor = 'grab'; };
                
                let collapsed = false;
                document.getElementById('grnd-collapse-btn').onclick = () => {
                    if (collapsed) {
                        content.style.display = 'block';
                        document.getElementById('grnd-collapse-btn').textContent = '−';
                        floatingMenu.style.width = '320px';
                    } else {
                        content.style.display = 'none';
                        document.getElementById('grnd-collapse-btn').textContent = '+';
                        floatingMenu.style.width = 'auto';
                    }
                    collapsed = !collapsed;
                };
                document.getElementById('grnd-close-btn').onclick = () => { floatingMenu.style.display = 'none'; };
            });
        });
    }

    // Обработчик сообщений
    const runtimeAPI = storageAPI?.runtime;
    if (runtimeAPI) {
        runtimeAPI.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getCurrentComplaintId') {
                sendResponse({ complaintId: getCurrentComplaintId() });
            } else if (request.action === 'getComplaintsTableData') {
                sendResponse(getComplaintsTableData());
            } else if (request.action === 'scrollToComplaint') {
                scrollToComplaint(request.complaintId);
                sendResponse({ success: true });
            } else if (request.action === 'showPageNotification') {
                showPageNotification(request.complaintId, request.complainant, request.accused);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    // Запуск
    if (window.location.href.includes('/admin/complaints')) {
        setTimeout(createButtons, 1000);
        setTimeout(createButtons, 2000);
        setTimeout(createButtons, 3000);
        setTimeout(addPunishmentButtonNearVerdict, 1500);
        setTimeout(addPunishmentButtonNearVerdict, 2500);
        setTimeout(addPunishmentButtonNearVerdict, 3500);
    }

})();
