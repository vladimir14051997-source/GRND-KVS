// popup.js - Универсальная версия для всех браузеров
document.addEventListener('DOMContentLoaded', function () {
    // Универсальное API
    const getAPI = () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) return chrome;
        if (typeof browser !== 'undefined' && browser.runtime) return browser;
        return null;
    };
    
    const api = getAPI();
    if (!api) {
        console.error('GRND.GG: API не найдено');
        return;
    }
    
    const storage = api.storage;
    const runtime = api.runtime;
    
    // DOM элементы
    const templatesDiv = document.getElementById('templates');
    const approvedTemplatesDiv = document.getElementById('approvedTemplatesList');
    const rejectedTemplatesDiv = document.getElementById('rejectedTemplatesList');
    const punishmentsDiv = document.getElementById('punishmentsList');
    
    // Кнопки добавления
    const addTemplateButton = document.getElementById('addTemplate');
    const addApprovedTemplateButton = document.getElementById('addApprovedTemplate');
    const addRejectedTemplateButton = document.getElementById('addRejectedTemplate');
    const addPunishmentButton = document.getElementById('addPunishment');
    
    // Модальные окна
    const templateModal = document.getElementById('templateModal');
    const approvedModal = document.getElementById('approvedModal');
    const rejectedModal = document.getElementById('rejectedModal');
    const punishmentModal = document.getElementById('punishmentModal');
    
    // Кнопки закрытия модальных окон
    const closeModal = document.querySelector('#templateModal .close');
    const closeApprovedModal = document.querySelector('#approvedModal .close-approved-modal');
    const closeRejectedModal = document.querySelector('#rejectedModal .close-rejected-modal');
    const closePunishmentModal = document.querySelector('#punishmentModal .close-punishment-modal');
    
    // Кнопки сохранения
    const saveTemplateButton = document.getElementById('saveTemplate');
    const saveApprovedButton = document.getElementById('saveApproved');
    const saveRejectedButton = document.getElementById('saveRejected');
    const savePunishmentButton = document.getElementById('savePunishment');
    
    // Поля ввода для шаблонов
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const templateText = document.getElementById('templateText');
    const modalTitle = document.getElementById('modalTitle');
    
    const approvedName = document.getElementById('approvedName');
    const approvedDescription = document.getElementById('approvedDescription');
    const approvedText = document.getElementById('approvedText');
    const approvedModalTitle = document.getElementById('approvedModalTitle');
    
    const rejectedName = document.getElementById('rejectedName');
    const rejectedDescription = document.getElementById('rejectedDescription');
    const rejectedText = document.getElementById('rejectedText');
    const rejectedModalTitle = document.getElementById('rejectedModalTitle');
    
    const punishmentName = document.getElementById('punishmentName');
    const punishmentDescription = document.getElementById('punishmentDescription');
    const punishmentDuration = document.getElementById('punishmentDuration');
    const punishmentModalTitle = document.getElementById('punishmentModalTitle');
    
    // Табы
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Переменные для редактирования
    let editIndex = null;
    let editApprovedIndex = null;
    let editRejectedIndex = null;
    let editPunishmentIndex = null;
    
    // ========== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ==========
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const activeTab = document.getElementById(`${tabId}Tab`);
            if (activeTab) activeTab.classList.add('active');
        });
    });
    
    // ========== ОБЫЧНЫЕ ШАБЛОНЫ ==========
    function loadTemplates() {
        if (!templatesDiv) return;
        storage.sync.get(['responseTemplates'], function (result) {
            templatesDiv.innerHTML = '';
            const templates = result.responseTemplates || [];
            templates.forEach((template, index) => {
                createTemplateElement(template, index);
            });
        });
    }
    
    function createTemplateElement(template, index) {
        const div = document.createElement('div');
        div.classList.add('template');
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = template.name;
        nameDiv.classList.add('template-name');
        nameDiv.addEventListener('click', function () {
            openEditModal(template, index);
        });
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.textContent = template.description || '—';
        descriptionDiv.classList.add('template-description');
        descriptionDiv.addEventListener('click', function () {
            openEditModal(template, index);
        });
        
        const textDiv = document.createElement('div');
        textDiv.textContent = template.text.length > 50 ? template.text.substring(0, 50) + '...' : template.text;
        textDiv.classList.add('template-text');
        textDiv.addEventListener('click', function () {
            openEditModal(template, index);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'УДАЛИТЬ';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
                deleteTemplate(index);
            }
        });
        
        div.appendChild(nameDiv);
        div.appendChild(descriptionDiv);
        div.appendChild(textDiv);
        div.appendChild(deleteButton);
        templatesDiv.appendChild(div);
    }
    
    function openEditModal(template, index) {
        editIndex = index;
        modalTitle.textContent = 'Редактировать шаблон';
        templateName.value = template.name;
        templateDescription.value = template.description || '';
        templateText.value = template.text;
        templateModal.style.display = 'block';
    }
    
    function deleteTemplate(index) {
        storage.sync.get(['responseTemplates'], function (result) {
            const templates = result.responseTemplates || [];
            templates.splice(index, 1);
            storage.sync.set({ responseTemplates: templates }, function () {
                loadTemplates();
            });
        });
    }
    
    // ========== ОДОБРИТЕЛЬНЫЕ ШАБЛОНЫ ==========
    const defaultApprovedTemplates = [
        { name: "2.1 ОП (оск)", description: "Оскорбление", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде мута сроком на 30 минут по причине 2.1 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "2.1 ОП (упом)", description: "Упоминание родных", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде мута сроком на 90 минут по причине 2.1 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "2.1 ОП (оск родных)", description: "Оскорбление родных", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде бана сроком на 10 дней по причине 2.1 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "3.2 ОП (мут)", description: "Спам/флуд", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде мута сроком на 60 минут по причине 3.2 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "3.2 ОП (бан)", description: "Тяжёлый спам/флуд", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде бана сроком на 7 дней по причине 3.2 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "5.2 ОП (варн)", description: "Незначительное нарушение", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде варна по причине 5.2 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "5.2 ОП (софт)", description: "Использование софта", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде бана сроком на 31 день по причине 5.2 ОП. \nС уважением, администрация Grand Mobile." },
        { name: "DM", description: "Deathmatch", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 60 минут по причине DM. \nС уважением, администрация Grand Mobile." },
        { name: "DB", description: "Drive-by", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 30 минут по причине DB. \nС уважением, администрация Grand Mobile." },
        { name: "SK", description: "Spawnkill", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 120 минут, а так же варн по причине SK. \nС уважением, администрация Grand Mobile." },
        { name: "TK", description: "Teamkill", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 30 минут по причине TK. \nС уважением, администрация Grand Mobile." },
        { name: "1.1 ЗЗ", description: "Использование багов/глитчей", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 60 минут, а так же варн по причине 1.1 ЗЗ. \nС уважением, администрация Grand Mobile." },
        { name: "1.2 ЗЗ", description: "Реклама/провокация", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде варна по причине 1.2 ЗЗ. \nС уважением, администрация Grand Mobile." },
        { name: "1.4 GZ", description: "Грубость/оскорбление администрации", text: "Приветствую, уважаемый {complain_from}. \nВаша жалоба {complain_number} была рассмотрена и получила статус «Одобрено». Игрок {complain_on} получит наказание в виде деморгана сроком на 30 минут, а так же варн по причине 1.4 GZ. \nС уважением, администрация Grand Mobile." }
    ];
    
    function loadApprovedTemplates() {
        if (!approvedTemplatesDiv) return;
        storage.sync.get(['approvedTemplates'], function (result) {
            let approvedTemplates = result.approvedTemplates;
            
            if (!approvedTemplates || approvedTemplates.length === 0) {
                approvedTemplates = defaultApprovedTemplates;
                storage.sync.set({ approvedTemplates: defaultApprovedTemplates });
            }
            
            approvedTemplatesDiv.innerHTML = '';
            approvedTemplates.forEach((template, index) => {
                createApprovedTemplateElement(template, index);
            });
        });
    }
    
    function createApprovedTemplateElement(template, index) {
        const div = document.createElement('div');
        div.classList.add('template');
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = template.name;
        nameDiv.classList.add('template-name');
        nameDiv.addEventListener('click', function () {
            openApprovedEditModal(template, index);
        });
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.textContent = template.description || '—';
        descriptionDiv.classList.add('template-description');
        descriptionDiv.addEventListener('click', function () {
            openApprovedEditModal(template, index);
        });
        
        const textDiv = document.createElement('div');
        textDiv.textContent = template.text.length > 50 ? template.text.substring(0, 50) + '...' : template.text;
        textDiv.classList.add('template-text');
        textDiv.addEventListener('click', function () {
            openApprovedEditModal(template, index);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'УДАЛИТЬ';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (confirm('Вы уверены, что хотите удалить это одобрение?')) {
                deleteApprovedTemplate(index);
            }
        });
        
        div.appendChild(nameDiv);
        div.appendChild(descriptionDiv);
        div.appendChild(textDiv);
        div.appendChild(deleteButton);
        approvedTemplatesDiv.appendChild(div);
    }
    
    function openApprovedEditModal(template, index) {
        editApprovedIndex = index;
        approvedModalTitle.textContent = 'Редактировать одобрение';
        approvedName.value = template.name;
        approvedDescription.value = template.description || '';
        approvedText.value = template.text;
        approvedModal.style.display = 'block';
    }
    
    function deleteApprovedTemplate(index) {
        storage.sync.get(['approvedTemplates'], function (result) {
            const templates = result.approvedTemplates || [];
            templates.splice(index, 1);
            storage.sync.set({ approvedTemplates: templates }, function () {
                loadApprovedTemplates();
            });
        });
    }
    
    // ========== ШАБЛОНЫ ОТКЛОНЕНИЙ ==========
    const defaultRejectedTemplates = [
        { name: "1.2.2 ппж (обрезан скрин)", description: "Обрезанный скриншот", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.2 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "1.2.3 ппж (нет сути)", description: "Нет сути жалобы", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.3 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "1.2.4 ппж (от 3-го лица)", description: "Жалоба от 3-го лица", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.4 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "1.2.6 ппж (более 2-х дней)", description: "Просроченная жалоба", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.6 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "1.2.7 ппж (оск в жалобе)", description: "Оскорбление в жалобе", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.7 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "1.2.9 ппж (дубликат)", description: "Дубликат жалобы", text: "Приветствую, уважаемый {complain_from}. \nБлагодарим вас за жалобу {complain_number}, но в вашей жалобе отказано согласно пункту 1.2.9 правил подачи жалоб. \nС уважением, администрация Grand Mobile." },
        { name: "Нет нарушений", description: "Нарушений не обнаружено", text: "Приветствую, уважаемый {complain_from}. \nМы внимательно изучили вашу жалобу {complain_number} и пришли к выводу, что на предоставленных вами доказательствах нет нарушений правил проекта со стороны игрока {complain_on}. \nС уважением, администрация Grand Mobile." },
        { name: "Нехватка", description: "Недостаточно доказательств", text: "Приветствую, уважаемый {complain_from}. Благодарим вас за вашу жалобу {complain_number}.\nВаша жалоба была рассмотрена и получила статус «Отказано». Недостаточно доказательств для принятия соответствующих мер в отношении данного игрока, просим вас предоставить нам больше информации и доказательств. \nС уважением, администрация Grand Mobile." }
    ];
    
    function loadRejectedTemplates() {
        if (!rejectedTemplatesDiv) return;
        storage.sync.get(['rejectedTemplates'], function (result) {
            let rejectedTemplates = result.rejectedTemplates;
            
            if (!rejectedTemplates || rejectedTemplates.length === 0) {
                rejectedTemplates = defaultRejectedTemplates;
                storage.sync.set({ rejectedTemplates: defaultRejectedTemplates });
            }
            
            rejectedTemplatesDiv.innerHTML = '';
            rejectedTemplates.forEach((template, index) => {
                createRejectedTemplateElement(template, index);
            });
        });
    }
    
    function createRejectedTemplateElement(template, index) {
        const div = document.createElement('div');
        div.classList.add('template');
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = template.name;
        nameDiv.classList.add('template-name');
        nameDiv.addEventListener('click', function () {
            openRejectedEditModal(template, index);
        });
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.textContent = template.description || '—';
        descriptionDiv.classList.add('template-description');
        descriptionDiv.addEventListener('click', function () {
            openRejectedEditModal(template, index);
        });
        
        const textDiv = document.createElement('div');
        textDiv.textContent = template.text.length > 50 ? template.text.substring(0, 50) + '...' : template.text;
        textDiv.classList.add('template-text');
        textDiv.addEventListener('click', function () {
            openRejectedEditModal(template, index);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'УДАЛИТЬ';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (confirm('Вы уверены, что хотите удалить это отклонение?')) {
                deleteRejectedTemplate(index);
            }
        });
        
        div.appendChild(nameDiv);
        div.appendChild(descriptionDiv);
        div.appendChild(textDiv);
        div.appendChild(deleteButton);
        rejectedTemplatesDiv.appendChild(div);
    }
    
    function openRejectedEditModal(template, index) {
        editRejectedIndex = index;
        rejectedModalTitle.textContent = 'Редактировать отклонение';
        rejectedName.value = template.name;
        rejectedDescription.value = template.description || '';
        rejectedText.value = template.text;
        rejectedModal.style.display = 'block';
    }
    
    function deleteRejectedTemplate(index) {
        storage.sync.get(['rejectedTemplates'], function (result) {
            const templates = result.rejectedTemplates || [];
            templates.splice(index, 1);
            storage.sync.set({ rejectedTemplates: templates }, function () {
                loadRejectedTemplates();
            });
        });
    }
    
    // ========== НАКАЗАНИЯ ==========
    function loadPunishments() {
        if (!punishmentsDiv) return;
        storage.sync.get(['punishments'], function (result) {
            punishmentsDiv.innerHTML = '';
            const punishments = result.punishments || [];
            if (punishments.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.textContent = 'Нет добавленных наказаний. Нажмите "➕ Добавить наказание"';
                emptyMsg.style.cssText = 'text-align: center; padding: 20px; color: #aaa;';
                punishmentsDiv.appendChild(emptyMsg);
            } else {
                punishments.forEach((punishment, index) => {
                    createPunishmentElement(punishment, index);
                });
            }
        });
    }
    
    function createPunishmentElement(punishment, index) {
        const div = document.createElement('div');
        div.classList.add('template');
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = punishment.name;
        nameDiv.classList.add('template-name');
        nameDiv.addEventListener('click', function () {
            openPunishmentEditModal(punishment, index);
        });
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.textContent = punishment.description || '—';
        descriptionDiv.classList.add('template-description');
        descriptionDiv.addEventListener('click', function () {
            openPunishmentEditModal(punishment, index);
        });
        
        const durationDiv = document.createElement('div');
        durationDiv.textContent = punishment.duration || '—';
        durationDiv.classList.add('template-text');
        durationDiv.addEventListener('click', function () {
            openPunishmentEditModal(punishment, index);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'УДАЛИТЬ';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (confirm('Вы уверены, что хотите удалить это наказание?')) {
                deletePunishment(index);
            }
        });
        
        div.appendChild(nameDiv);
        div.appendChild(descriptionDiv);
        div.appendChild(durationDiv);
        div.appendChild(deleteButton);
        punishmentsDiv.appendChild(div);
    }
    
    function openPunishmentEditModal(punishment, index) {
        editPunishmentIndex = index;
        punishmentModalTitle.textContent = 'Редактировать наказание';
        punishmentName.value = punishment.name || '';
        punishmentDescription.value = punishment.description || '';
        punishmentDuration.value = punishment.duration || '';
        punishmentModal.style.display = 'block';
    }
    
    function deletePunishment(index) {
        storage.sync.get(['punishments'], function (result) {
            const punishments = result.punishments || [];
            punishments.splice(index, 1);
            storage.sync.set({ punishments: punishments }, function () {
                loadPunishments();
            });
        });
    }
    
    // ========== СОХРАНЕНИЕ ОБЫЧНЫХ ШАБЛОНОВ ==========
    if (saveTemplateButton) {
        saveTemplateButton.addEventListener('click', function () {
            const name = templateName.value.trim();
            const description = templateDescription.value.trim();
            const text = templateText.value.trim();
            if (name && text) {
                storage.sync.get(['responseTemplates'], function (result) {
                    const templates = result.responseTemplates || [];
                    const template = { name, description, text };
                    
                    if (editIndex !== null) {
                        templates[editIndex] = template;
                    } else {
                        templates.push(template);
                    }
                    
                    storage.sync.set({ responseTemplates: templates }, function () {
                        loadTemplates();
                        templateModal.style.display = 'none';
                        alert('Шаблон успешно сохранен');
                        editIndex = null;
                        templateName.value = '';
                        templateDescription.value = '';
                        templateText.value = '';
                    });
                });
            } else {
                alert('Заполните название и текст!');
            }
        });
    }
    
    // ========== СОХРАНЕНИЕ ОДОБРИТЕЛЬНЫХ ШАБЛОНОВ ==========
    if (saveApprovedButton) {
        saveApprovedButton.addEventListener('click', function () {
            const name = approvedName.value.trim();
            const description = approvedDescription.value.trim();
            const text = approvedText.value.trim();
            if (name && text) {
                storage.sync.get(['approvedTemplates'], function (result) {
                    const templates = result.approvedTemplates || [];
                    const template = { name, description, text };
                    
                    if (editApprovedIndex !== null) {
                        templates[editApprovedIndex] = template;
                    } else {
                        templates.push(template);
                    }
                    
                    storage.sync.set({ approvedTemplates: templates }, function () {
                        loadApprovedTemplates();
                        approvedModal.style.display = 'none';
                        alert('Одобрение успешно сохранено');
                        editApprovedIndex = null;
                        approvedName.value = '';
                        approvedDescription.value = '';
                        approvedText.value = '';
                    });
                });
            } else {
                alert('Заполните название и текст!');
            }
        });
    }
    
    // ========== СОХРАНЕНИЕ ШАБЛОНОВ ОТКЛОНЕНИЙ ==========
    if (saveRejectedButton) {
        saveRejectedButton.addEventListener('click', function () {
            const name = rejectedName.value.trim();
            const description = rejectedDescription.value.trim();
            const text = rejectedText.value.trim();
            if (name && text) {
                storage.sync.get(['rejectedTemplates'], function (result) {
                    const templates = result.rejectedTemplates || [];
                    const template = { name, description, text };
                    
                    if (editRejectedIndex !== null) {
                        templates[editRejectedIndex] = template;
                    } else {
                        templates.push(template);
                    }
                    
                    storage.sync.set({ rejectedTemplates: templates }, function () {
                        loadRejectedTemplates();
                        rejectedModal.style.display = 'none';
                        alert('Отклонение успешно сохранено');
                        editRejectedIndex = null;
                        rejectedName.value = '';
                        rejectedDescription.value = '';
                        rejectedText.value = '';
                    });
                });
            } else {
                alert('Заполните название и текст!');
            }
        });
    }
    
    // ========== СОХРАНЕНИЕ НАКАЗАНИЙ ==========
    if (savePunishmentButton) {
        savePunishmentButton.addEventListener('click', function () {
            const name = punishmentName.value.trim();
            const description = punishmentDescription.value.trim();
            const duration = punishmentDuration.value.trim();
            
            if (name) {
                storage.sync.get(['punishments'], function (result) {
                    const punishments = result.punishments || [];
                    const punishment = { name, description, duration };
                    
                    if (editPunishmentIndex !== null) {
                        punishments[editPunishmentIndex] = punishment;
                    } else {
                        punishments.push(punishment);
                    }
                    
                    storage.sync.set({ punishments: punishments }, function () {
                        loadPunishments();
                        punishmentModal.style.display = 'none';
                        alert('Наказание успешно сохранено');
                        editPunishmentIndex = null;
                        punishmentName.value = '';
                        punishmentDescription.value = '';
                        punishmentDuration.value = '';
                    });
                });
            } else {
                alert('Введите название наказания!');
            }
        });
    }
    
    // ========== ОТКРЫТИЕ МОДАЛЬНЫХ ОКОН ==========
    if (addTemplateButton) {
        addTemplateButton.addEventListener('click', function () {
            editIndex = null;
            modalTitle.textContent = 'Добавить новый шаблон';
            templateName.value = '';
            templateDescription.value = '';
            templateText.value = '';
            templateModal.style.display = 'block';
        });
    }
    
    if (addApprovedTemplateButton) {
        addApprovedTemplateButton.addEventListener('click', function () {
            editApprovedIndex = null;
            approvedModalTitle.textContent = 'Добавить одобрение';
            approvedName.value = '';
            approvedDescription.value = '';
            approvedText.value = '';
            approvedModal.style.display = 'block';
        });
    }
    
    if (addRejectedTemplateButton) {
        addRejectedTemplateButton.addEventListener('click', function () {
            editRejectedIndex = null;
            rejectedModalTitle.textContent = 'Добавить отклонение';
            rejectedName.value = '';
            rejectedDescription.value = '';
            rejectedText.value = '';
            rejectedModal.style.display = 'block';
        });
    }
    /*
    if (addPunishmentButton) {
        addPunishmentButton.addEventListener('click', function () {
            editPunishmentIndex = null;
            punishmentModalTitle.textContent = 'Добавить наказание';
            punishmentName.value = '';
            punishmentDescription.value = '';
            punishmentDuration.value = '';
            punishmentModal.style.display = 'block';
        });
    }
    */
    // ========== ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ==========
    if (closeModal) closeModal.addEventListener('click', function () { templateModal.style.display = 'none'; });
    if (closeApprovedModal) closeApprovedModal.addEventListener('click', function () { approvedModal.style.display = 'none'; });
    if (closeRejectedModal) closeRejectedModal.addEventListener('click', function () { rejectedModal.style.display = 'none'; });
    if (closePunishmentModal) closePunishmentModal.addEventListener('click', function () { punishmentModal.style.display = 'none'; });
    
    window.addEventListener('click', function (event) {
        if (event.target == templateModal) templateModal.style.display = 'none';
        if (event.target == approvedModal) approvedModal.style.display = 'none';
        if (event.target == rejectedModal) rejectedModal.style.display = 'none';
        if (event.target == punishmentModal) punishmentModal.style.display = 'none';
    });

    // ========== МОНИТОРИНГ ==========
    const enableMonitoringCheckbox = document.getElementById('enableMonitoring');
    const monitoringIntervalInput = document.getElementById('monitoringInterval');
    const enableNotificationsCheckbox = document.getElementById('enableNotifications');
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    const saveMonitoringBtn = document.getElementById('saveMonitoringBtn');
    const manualCheckBtn = document.getElementById('manualCheckBtn');
    const testSoundBtn = document.getElementById('testSoundBtn');
    const testNotificationBtn = document.getElementById('testNotificationBtn');
    const monitoringStatusDiv = document.getElementById('monitoringStatus');
    const lastComplaintInfoDiv = document.getElementById('lastComplaintInfo');
    // ========== НАСТРОЙКИ ИМЕНИ АДМИНИСТРАТОРА ==========
    const adminNameInput = document.getElementById('adminNameInput');
    const saveAdminNameBtn = document.getElementById('saveAdminNameBtn');
    const testPunishmentBtn = document.getElementById('testPunishmentBtn');
    
    // Загрузка сохраненного имени
    function loadAdminName() {
        storage.local.get(['adminName'], (result) => {
            if (result.adminName && adminNameInput) {
                adminNameInput.value = result.adminName;
            }
        });
    }
    
    // Сохранение имени
    if (saveAdminNameBtn) {
        saveAdminNameBtn.onclick = () => {
            const newName = adminNameInput.value.trim();
            if (newName) {
                storage.local.set({ adminName: newName }, () => {
                    alert(`✅ Имя администратора сохранено: ${newName}`);
                });
            } else {
                alert('❌ Введите имя!');
            }
        };
    }
    
    // Тест команды наказания
    if (testPunishmentBtn) {
        testPunishmentBtn.onclick = () => {
            storage.local.get(['adminName'], (result) => {
                const adminName = result.adminName || 'Admin';
                const testCommand = `/offban PlayerName 7 #123456 by ${adminName}`;
                alert(`📋 Пример команды наказания:\n\n${testCommand}\n\nНа странице жалобы при нажатии на кнопку "Наказание" будет скопирована похожая команда на основе приговора.`);
            });
        };
    }
    
    loadAdminName();
    
    function loadMonitoringSettings() {
        storage.sync.get(['monitoringSettings'], (result) => {
            const settings = result.monitoringSettings || {
                enabled: false,
                interval: 10,
                notificationsEnabled: true,
                autoRefresh: true
            };
            
            if (enableMonitoringCheckbox) enableMonitoringCheckbox.checked = settings.enabled;
            if (monitoringIntervalInput) monitoringIntervalInput.value = settings.interval;
            if (enableNotificationsCheckbox) enableNotificationsCheckbox.checked = settings.notificationsEnabled;
            if (autoRefreshCheckbox) autoRefreshCheckbox.checked = settings.autoRefresh;
            
            updateMonitoringStatus();
        });
    }
    
    function updateMonitoringStatus() {
        runtime.sendMessage({ action: 'getMonitoringStatus' }, (response) => {
            storage.sync.get(['monitoringSettings'], (result) => {
                const settings = result.monitoringSettings || {};
                if (monitoringStatusDiv) {
                    if (settings.enabled) {
                        monitoringStatusDiv.innerHTML = '<span class="status-dot status-on"></span> Мониторинг активен ✅';
                    } else {
                        monitoringStatusDiv.innerHTML = '<span class="status-dot status-off"></span> Мониторинг выключен ⏹️';
                    }
                }
                if (lastComplaintInfoDiv) {
                    if (response && response.lastCount && response.lastMaxId) {
                        lastComplaintInfoDiv.innerHTML = `📊 Жалоб в таблице: ${response.lastCount} | Последний ID: #${response.lastMaxId}<br>🔄 Автообновление: ${settings.autoRefresh ? 'Вкл' : 'Выкл'}`;
                    } else {
                        lastComplaintInfoDiv.innerHTML = '📊 Ждем первой проверки...';
                    }
                }
            });
        });
    }
    
    // КНОПКА СОХРАНЕНИЯ
    if (saveMonitoringBtn) {
        saveMonitoringBtn.onclick = function() {
            console.log('GRND.GG: Кнопка сохранения нажата');
            
            const enabled = enableMonitoringCheckbox ? enableMonitoringCheckbox.checked : false;
            const interval = parseInt(monitoringIntervalInput ? monitoringIntervalInput.value : 10) || 10;
            const notificationsEnabled = enableNotificationsCheckbox ? enableNotificationsCheckbox.checked : true;
            const autoRefresh = autoRefreshCheckbox ? autoRefreshCheckbox.checked : true;
            
            const settings = {
                enabled: enabled,
                interval: interval,
                notificationsEnabled: notificationsEnabled,
                autoRefresh: autoRefresh
            };
            
            console.log('GRND.GG: Отправляем настройки:', settings);
            
            runtime.sendMessage({ 
                action: 'saveMonitoringSettings', 
                settings: settings 
            }, function(response) {
                console.log('GRND.GG: Ответ от background:', response);
                if (response && response.success) {
                    alert('✅ Настройки мониторинга сохранены');
                    updateMonitoringStatus();
                } else {
                    alert('❌ Ошибка: не удалось сохранить настройки');
                }
            });
        };
    }
    
    // КНОПКА ПРОВЕРИТЬ СЕЙЧАС
    if (manualCheckBtn) {
        manualCheckBtn.onclick = function() {
            console.log('GRND.GG: Кнопка проверки нажата');
            
            runtime.sendMessage({ action: 'manualCheck' }, function(response) {
                console.log('GRND.GG: Ответ на manualCheck:', response);
                if (response && response.success) {
                    alert('🔄 Проверка запущена! Смотрите консоль (F12)');
                    setTimeout(updateMonitoringStatus, 2000);
                } else {
                    alert('❌ Ошибка: не удалось запустить проверку');
                }
            });
        };
    }
    
    // ТЕСТ ЗВУКА
    if (testSoundBtn) {
        testSoundBtn.onclick = function() {
            console.log('GRND.GG: Тест звука');
            runtime.sendMessage({ action: 'testSound' }, function(response) {
                if (response && response.success) {
                    alert('🔊 Звук должен воспроизвестись! Проверьте громкость компьютера.');
                } else {
                    alert('⚠️ Не удалось воспроизвести звук. Проверьте настройки звука.');
                }
            });
        };
    }
    
    // ТЕСТ УВЕДОМЛЕНИЯ
    if (testNotificationBtn) {
        testNotificationBtn.onclick = function() {
            console.log('GRND.GG: Тест уведомления');
            const testId = Math.floor(Math.random() * 1000);
            runtime.sendMessage({ 
                action: 'testPageNotification', 
                complaintId: testId 
            }, function(response) {
                if (response && response.success) {
                    alert(`🔔 Тестовое уведомление #${testId} отправлено! Должно появиться всплывающее окно.`);
                } else {
                    alert('⚠️ Не удалось отправить тестовое уведомление.');
                }
            });
        };
    }
    
    // Загружаем всё
    loadTemplates();
    loadApprovedTemplates();
    loadRejectedTemplates();
    loadPunishments();
    loadMonitoringSettings();
    
    console.log('GRND.GG: Popup загружен, всё готово');
});
