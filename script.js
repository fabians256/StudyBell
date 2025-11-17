// Global variables
let tasks = [];
let currentRecordCount = 0;
let alarmIntervals = new Map();
let activeNotifications = new Map();
let notificationSound = null;
let notificationPermission = 'default';

// Default config for Element SDK
const defaultConfig = {
    app_title: "School-Pal",
    background_color: "#667eea",
    surface_color: "#ffffff",
    text_color: "#1f2937",
    primary_action_color: "#4f46e5",
    secondary_action_color: "#6b7280",
    font_family: "Segoe UI",
    font_size: 16
};

// Dynamic schedule data
let schedule = {
    senin: [
        { id: "sen-1", subject: "Matematika", startTime: "07:00", endTime: "08:30", teacher: "Bu Sari", alarmEnabled: true },
        { id: "sen-2", subject: "Bahasa Indonesia", startTime: "08:30", endTime: "10:00", teacher: "Pak Budi", alarmEnabled: true },
        { id: "sen-3", subject: "IPA", startTime: "10:15", endTime: "11:45", teacher: "Bu Rina", alarmEnabled: true }
    ],
    selasa: [
        { id: "sel-1", subject: "Fisika", startTime: "08:30", endTime: "10:00", teacher: "Bu Rina", alarmEnabled: true },
        { id: "sel-2", subject: "Matematika", startTime: "07:00", endTime: "08:30", teacher: "Bu Sari", alarmEnabled: true },
        { id: "sel-3", subject: "B. Indonesia", startTime: "10:15", endTime: "11:45", teacher: "Pak Budi", alarmEnabled: true }
    ],
    rabu: [
        { id: "rab-1", subject: "IPS", startTime: "07:00", endTime: "08:30", teacher: "Pak Andi", alarmEnabled: true },
        { id: "rab-2", subject: "Bahasa Indonesia", startTime: "08:30", endTime: "10:00", teacher: "Pak Budi", alarmEnabled: true },
        { id: "rab-3", subject: "Matematika", startTime: "10:15", endTime: "11:45", teacher: "Bu Sari", alarmEnabled: true }
    ],
    kamis: [
        { id: "kam-1", subject: "IPA", startTime: "07:00", endTime: "08:30", teacher: "Bu Rina", alarmEnabled: true },
        { id: "kam-2", subject: "Bahasa Inggris", startTime: "08:30", endTime: "10:00", teacher: "Ms. Lisa", alarmEnabled: true },
        { id: "kam-3", subject: "IPS", startTime: "10:15", endTime: "11:45", teacher: "Pak Andi", alarmEnabled: true }
    ],
    jumat: [
        { id: "jum-1", subject: "Agama", startTime: "07:00", endTime: "08:30", teacher: "Pak Hasan", alarmEnabled: true },
        { id: "jum-2", subject: "Matematika", startTime: "08:30", endTime: "10:00", teacher: "Bu Sari", alarmEnabled: true },
        { id: "jum-3", subject: "IPA", startTime: "10:15", endTime: "11:45", teacher: "Bu Rina", alarmEnabled: true }
    ],
    sabtu: [
        { id: "sab-1", subject: "Keterampilan", startTime: "07:00", endTime: "08:30", teacher: "Bu Maya", alarmEnabled: true },
        { id: "sab-2", subject: "Seni Budaya", startTime: "08:30", endTime: "10:00", teacher: "Pak Dedi", alarmEnabled: true },
        { id: "sab-3", subject: "IPS", startTime: "10:15", endTime: "11:45", teacher: "Pak Andi", alarmEnabled: true }
    ],
    minggu: []
};

// Initialize app
function initApp() {
    console.log("🚀 Memulai School-Pal...");
    
    requestNotificationPermission();
    createNotificationSound();
    loadScheduleFromStorage();
    loadTasksFromStorage();
    updateHeaderWithCurrentDate();
    renderAllSections();
    setupEventListeners();
    startScheduleUpdater();
    startAlarmSystem();
    
    // Initialize Element SDK if available
    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange: async (config) => {
                updateUIFromConfig(config);
            },
            mapToCapabilities: (config) => ({
                recolorables: [
                    {
                        get: () => config.background_color || defaultConfig.background_color,
                        set: (value) => {
                            config.background_color = value;
                            window.elementSdk.setConfig({ background_color: value });
                        }
                    },
                    {
                        get: () => config.surface_color || defaultConfig.surface_color,
                        set: (value) => {
                            config.surface_color = value;
                            window.elementSdk.setConfig({ surface_color: value });
                        }
                    },
                    {
                        get: () => config.text_color || defaultConfig.text_color,
                        set: (value) => {
                            config.text_color = value;
                            window.elementSdk.setConfig({ text_color: value });
                        }
                    },
                    {
                        get: () => config.primary_action_color || defaultConfig.primary_action_color,
                        set: (value) => {
                            config.primary_action_color = value;
                            window.elementSdk.setConfig({ primary_action_color: value });
                        }
                    },
                    {
                        get: () => config.secondary_action_color || defaultConfig.secondary_action_color,
                        set: (value) => {
                            config.secondary_action_color = value;
                            window.elementSdk.setConfig({ secondary_action_color: value });
                        }
                    }
                ],
                borderables: [],
                fontEditable: {
                    get: () => config.font_family || defaultConfig.font_family,
                    set: (value) => {
                        config.font_family = value;
                        window.elementSdk.setConfig({ font_family: value });
                    }
                },
                fontSizeable: {
                    get: () => config.font_size || defaultConfig.font_size,
                    set: (value) => {
                        config.font_size = value;
                        window.elementSdk.setConfig({ font_size: value });
                    }
                }
            }),
            mapToEditPanelValues: (config) => new Map([
                ["app_title", config.app_title || defaultConfig.app_title]
            ])
        });
    }
    
    console.log("🎉 Inisialisasi selesai!");
}

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            console.log('✅ Izin notifikasi diberikan');
            showWelcomeNotification();
        } else if (permission === 'denied') {
            console.log('❌ Izin notifikasi ditolak');
            showNotificationPermissionMessage();
        } else {
            console.log('⏳ Izin notifikasi belum diberikan');
        }
    } catch (error) {
        console.log('Error meminta izin notifikasi:', error);
    }
}

// Show welcome notification
function showWelcomeNotification() {
    if (notificationPermission === 'granted') {
        const notification = new Notification('🎓 School-Pal Siap!', {
            body: 'Notifikasi pengingat tugas dan jadwal sudah aktif. Kamu akan mendapat pemberitahuan meski aplikasi tidak dibuka.',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFY1SDE5QzIwLjEgNSAyMSA1LjkgMjEgN1YxOUMyMSAyMC4xIDIwLjEgMjEgMTkgMjFINUMzLjkgMjEgMyAyMC4xIDMgMTlWN0MzIDUuOSAzLjkgNSA1IDVIMTBWNEMxMCAyLjkgMTAuOSAyIDEyIDJaTTEyIDRWNkgxMlY0Wk01IDdWMTlIMTlWN0g1Wk03IDlIMTdWMTFIN1Y5Wk03IDEzSDE3VjE1SDdWMTNaTTcgMTdIMTNWMTlIN1YxN1oiLz4KPC9zdmc+Cjwvc3ZnPgo=',
            badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjVIMTlDMjAuMSA1IDIxIDUuOSAyMSA3VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY3QzMgNS45IDMuOSA1IDUgNUgxMFY0QzEwIDIuOSAxMC45IDIgMTIgMlpNMTIgNFY2SDEyVjRaTTUgN1YxOUgxOVY3SDVaTTcgOUgxN1YxMUg3VjlaTTcgMTNIMTdWMTVIN1YxM1pNNyAxN0gxM1YxOUg3VjE3WiIgZmlsbD0iIzRGNDZFNSIvPgo8L3N2Zz4K',
            tag: 'school-pal-welcome',
            requireInteraction: false,
            silent: false
        });

        notification.onclick = function() {
            window.focus();
            notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

// Show notification permission message
function showNotificationPermissionMessage() {
    const permissionBanner = document.createElement('div');
    permissionBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        padding: 15px 20px;
        text-align: center;
        z-index: 1001;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    permissionBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; max-width: 600px; margin: 0 auto;">
            <div style="flex: 1;">
                <strong>🔔 Aktifkan Notifikasi</strong><br>
                <small>Untuk mendapat pengingat tugas & jadwal meski aplikasi tidak dibuka</small>
            </div>
            <div style="display: flex; gap: 10px; margin-left: 15px;">
                <button onclick="requestNotificationPermission()" style="background: white; color: #d97706; border: none; padding: 8px 15px; border-radius: 5px; font-weight: 600; cursor: pointer;">
                    Aktifkan
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                    Nanti
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(permissionBanner);
}

// Update UI from config
function updateUIFromConfig(config) {
    const baseSize = config.font_size || defaultConfig.font_size;
    const customFont = config.font_family || defaultConfig.font_family;
    const baseFontStack = 'Tahoma, Geneva, Verdana, sans-serif';
    
    // Update app title
    document.getElementById('app-title').textContent = config.app_title || defaultConfig.app_title;
    
    // Update background
    document.body.style.background = `linear-gradient(135deg, ${config.background_color || defaultConfig.background_color} 0%, #764ba2 100%)`;
    
    // Update font family and size
    document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;
    document.body.style.fontSize = `${baseSize}px`;
    
    // Update colors
    const primaryColor = config.primary_action_color || defaultConfig.primary_action_color;
    const surfaceColor = config.surface_color || defaultConfig.surface_color;
    const textColor = config.text_color || defaultConfig.text_color;
    
    // Apply colors to key elements
    document.querySelectorAll('.settings-btn, .fab, .btn-primary').forEach(el => {
        el.style.backgroundColor = primaryColor;
    });
    
    document.querySelectorAll('.container, .modal-content').forEach(el => {
        el.style.backgroundColor = surfaceColor;
    });
    
    document.querySelectorAll('.header h1, .section-title').forEach(el => {
        el.style.color = textColor;
    });
}

// Setup event listeners
function setupEventListeners() {
    const scheduleForm = document.getElementById('schedule-form');
    scheduleForm.addEventListener('submit', handleScheduleSubmit);
    
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', handleTaskSubmit);
    
    console.log("🎯 Event listeners siap");
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();
    console.log("📝 Menambah tugas baru...");
    
    const taskName = document.getElementById('task-name').value.trim();
    const taskSubject = document.getElementById('task-subject').value.trim();
    const taskDeadline = document.getElementById('task-deadline').value;
    const taskDeadlineTime = document.getElementById('task-deadline-time').value;

    if (!taskName || !taskSubject || !taskDeadline || !taskDeadlineTime) {
        showMessage("Mohon lengkapi semua field!", "error");
        return;
    }

    const fullDeadline = `${taskDeadline}T${taskDeadlineTime}`;
    
    showLoading(true);

    const newTask = {
        id: Date.now().toString(),
        name: taskName,
        subject: taskSubject,
        deadline: fullDeadline,
        isComplete: false,
        alarmEnabled: document.getElementById('task-alarm').checked,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasksToStorage();
    currentRecordCount = tasks.length;

    console.log("✅ Tugas berhasil disimpan:", newTask);
    
    document.getElementById('task-form').reset();
    closeAddTaskModal();
    showMessage("Tugas berhasil ditambahkan!", "success");
    
    renderAllSections();
    showLoading(false);
}

// Update header dengan tanggal saat ini
function updateHeaderWithCurrentDate() {
    const now = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = dayNames[now.getDay()];
    const date = now.getDate();
    const monthName = monthNames[now.getMonth()];
    
    const formattedDate = `${dayName}, ${date} ${monthName}`;
    document.getElementById('current-date').textContent = formattedDate;
}

// Render all sections
function renderAllSections() {
    renderUrgentTasks();
    renderTodaySchedule();
    renderOtherTasks();
}

// Render urgent tasks based on deadlines
function renderUrgentTasks() {
    const urgentTasksContainer = document.getElementById('urgent-tasks');
    const dangerZone = document.getElementById('danger-zone');
    const dangerTitle = document.getElementById('danger-title');
    
    const now = new Date();
    const urgentTasks = tasks.filter(task => {
        if (task.isComplete) return false;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        return hoursDiff <= 24 && hoursDiff > 0; // Within 24 hours
    });
    
    if (urgentTasks.length > 0) {
        dangerZone.classList.remove('safe');
        dangerTitle.textContent = '🔴 [!] DEADLINE MENDESAK';
        
        urgentTasksContainer.innerHTML = urgentTasks.map(task => {
            const deadline = new Date(task.deadline);
            const timeDiff = deadline.getTime() - now.getTime();
            const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
            const minutesDiff = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
            
            let timeText = '';
            if (hoursDiff > 0) {
                timeText = `${hoursDiff} jam ${minutesDiff} menit lagi`;
            } else if (minutesDiff > 0) {
                timeText = `${minutesDiff} menit lagi`;
            } else {
                timeText = 'Segera!';
            }
            
            return `
                <div class="urgent-task-card">
                    <span style="color: #dc2626; font-weight: bold;">🔴</span>
                    <span class="urgent-task-name">${escapeHtml(task.name)} ${task.alarmEnabled ? '🔔' : '🔕'}</span>
                    <span class="urgent-task-deadline">${timeText}</span>
                </div>
            `;
        }).join('');
    } else {
        dangerZone.classList.add('safe');
        dangerTitle.textContent = '🟢 ZONA AMAN';
        
        urgentTasksContainer.innerHTML = `
            <div class="safe-message">
                🎉 Tidak ada deadline mendesak! Kamu aman untuk hari ini.
            </div>
        `;
    }
}

// Render jadwal hari ini dengan status realtime
function renderTodaySchedule() {
    const scheduleContainer = document.getElementById('today-schedule');
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = new Date().getDay();
    const todayKey = days[today];
    const todaySchedule = schedule[todayKey] || [];
    
    if (todaySchedule.length === 0) {
        scheduleContainer.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada pelajaran hari ini. Selamat beristirahat! 🎉</p>
            </div>
        `;
        return;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    scheduleContainer.innerHTML = todaySchedule.map(scheduleItem => {
        const [startHour, startMinute] = scheduleItem.startTime.split(':').map(Number);
        const [endHour, endMinute] = scheduleItem.endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMinute;
        const endTimeMinutes = endHour * 60 + endMinute;
        
        let statusClass = '';
        let statusText = '';
        let prefix = '';
        let suffix = '';
        let emoji = '';
        
        if (currentTime >= startTimeMinutes && currentTime < endTimeMinutes) {
            statusClass = 'current';
            statusText = ' (SEKARANG)';
            prefix = '> ';
            suffix = ' <';
            emoji = '🔥 ';
        } else if (currentTime < startTimeMinutes) {
            const minutesUntil = startTimeMinutes - currentTime;
            if (minutesUntil <= 30) {
                statusClass = 'upcoming';
                statusText = ` (${minutesUntil} menit lagi)`;
                emoji = '⏰ ';
            } else {
                statusClass = '';
                emoji = '📚 ';
            }
        } else {
            statusClass = 'past';
            statusText = ' (Selesai)';
            emoji = '✅ ';
        }
        
        return `
            <div class="schedule-item-today ${statusClass}">
                <span class="schedule-time">${prefix}${emoji}${scheduleItem.startTime} - ${scheduleItem.endTime} | ${escapeHtml(scheduleItem.subject)}${statusText}${suffix}</span>
                ${scheduleItem.teacher ? `<div style="font-size: 0.8rem; margin-top: 3px; opacity: 0.8;">👨‍🏫 ${escapeHtml(scheduleItem.teacher)}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Update jadwal setiap menit
function startScheduleUpdater() {
    setInterval(() => {
        renderTodaySchedule();
        renderUrgentTasks();
    }, 60000);
}

// Create notification sound using Web Audio API
function createNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        function playBeep(frequency = 800, duration = 10000) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        }
        
        notificationSound = {
            play: () => {
                // Play alarm sequence: beep-beep-beep
                playBeep(800, 10000);
                setTimeout(() => playBeep(800, 10000), 300);
                setTimeout(() => playBeep(800, 10000), 600);
                setTimeout(() => playBeep(1000, 10000), 900);
            }
        };
    } catch (error) {
        console.log("Audio tidak tersedia:", error);
        notificationSound = { play: () => {} };
    }
}

// Start alarm system
function startAlarmSystem() {
    console.log("🔔 Sistem alarm dimulai");
    
    // Check every minute for alarms
    setInterval(() => {
        checkTaskAlarms();
        checkScheduleAlarms();
    }, 60000);
    
    // Initial check
    setTimeout(() => {
        checkTaskAlarms();
        checkScheduleAlarms();
    }, 5000);
}

// Check task alarms
function checkTaskAlarms() {
    const now = new Date();
    
    tasks.forEach(task => {
        if (task.isComplete || !task.alarmEnabled) return;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        const alarmKey = `task-${task.id}`;
        
        // 20 minutes before
        if (minutesDiff === 20 && !activeNotifications.has(`${alarmKey}-20`)) {
            showTaskNotification(task, 20);
            activeNotifications.set(`${alarmKey}-20`, true);
        }
        
        // 10 minutes before
        if (minutesDiff === 10 && !activeNotifications.has(`${alarmKey}-10`)) {
            showTaskNotification(task, 10);
            activeNotifications.set(`${alarmKey}-10`, true);
        }
        
        // 5 minutes before (final warning)
        if (minutesDiff === 5 && !activeNotifications.has(`${alarmKey}-5`)) {
            showTaskNotification(task, 5);
            activeNotifications.set(`${alarmKey}-5`, true);
        }
    });
}

// Check schedule alarms
function checkScheduleAlarms() {
    const now = new Date();
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = days[now.getDay()];
    const todaySchedule = schedule[today] || [];
    
    todaySchedule.forEach(scheduleItem => {
        if (!scheduleItem.alarmEnabled) return;
        
        const [startHour, startMinute] = scheduleItem.startTime.split(':').map(Number);
        const scheduleTime = new Date(now);
        scheduleTime.setHours(startHour, startMinute, 0, 0);
        
        const timeDiff = scheduleTime.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        const alarmKey = `schedule-${scheduleItem.id}`;
        
        // 20 minutes before
        if (minutesDiff === 20 && !activeNotifications.has(`${alarmKey}-20`)) {
            showScheduleNotification(scheduleItem, 20);
            activeNotifications.set(`${alarmKey}-20`, true);
        }
    });
}

// Show task notification
function showTaskNotification(task, minutesBefore) {
    console.log(`🔔 Alarm tugas: ${task.name} (${minutesBefore} menit lagi)`);
    
    // Show browser notification (works even when app is closed)
    showBrowserNotification(
        `📚 Pengingat Tugas - ${minutesBefore} Menit Lagi!`,
        `${task.name} (${task.subject})\nDeadline: ${new Date(task.deadline).toLocaleString('id-ID')}`,
        'task',
        task.id
    );
    
    if (notificationSound) {
        notificationSound.play();
    }
    
    // Only show in-app modal if app is currently visible
    if (document.visibilityState === 'visible') {
        const modal = document.getElementById('notification-modal');
        const title = document.getElementById('notification-title');
        const content = document.getElementById('notification-content');
        const completeBtn = document.getElementById('complete-btn');
        
        title.textContent = `🔔 Pengingat Tugas - ${minutesBefore} Menit Lagi!`;
        
        content.innerHTML = `
            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border: 2px solid #f59e0b; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #92400e;">📚 ${escapeHtml(task.name)}</h3>
                <p style="margin: 0; color: #92400e; font-weight: 600;">Mata Pelajaran: ${escapeHtml(task.subject)}</p>
                <p style="margin: 5px 0 0 0; color: #92400e;">⏰ Deadline: ${new Date(task.deadline).toLocaleString('id-ID')}</p>
            </div>
            <p style="font-size: 1.1rem; font-weight: 600; color: #dc2626;">
                ⚠️ Tugas ini akan berakhir dalam ${minutesBefore} menit!
            </p>
            <p style="color: #6b7280;">Apakah tugas ini sudah dikerjakan?</p>
        `;
        
        completeBtn.onclick = () => markTaskAsCompleted(task.id);
        
        modal.classList.add('show');
        
        // Store current notification info
        window.currentNotification = {
            type: 'task',
            id: task.id,
            minutesBefore: minutesBefore
        };
    }
}

// Show schedule notification
function showScheduleNotification(scheduleItem, minutesBefore) {
    console.log(`🔔 Alarm jadwal: ${scheduleItem.subject} (${minutesBefore} menit lagi)`);
    
    // Show browser notification (works even when app is closed)
    showBrowserNotification(
        `📖 Pengingat Jadwal - ${minutesBefore} Menit Lagi!`,
        `${scheduleItem.subject} dengan ${scheduleItem.teacher}\nWaktu: ${scheduleItem.startTime} - ${scheduleItem.endTime}`,
        'schedule',
        scheduleItem.id
    );
    
    if (notificationSound) {
        notificationSound.play();
    }
    
    // Only show in-app modal if app is currently visible
    if (document.visibilityState === 'visible') {
        const modal = document.getElementById('notification-modal');
        const title = document.getElementById('notification-title');
        const content = document.getElementById('notification-content');
        const completeBtn = document.getElementById('complete-btn');
        
        title.textContent = `🔔 Pengingat Jadwal - ${minutesBefore} Menit Lagi!`;
        
        content.innerHTML = `
            <div style="background: #dbeafe; padding: 20px; border-radius: 10px; border: 2px solid #3b82f6; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">📖 ${escapeHtml(scheduleItem.subject)}</h3>
                <p style="margin: 0; color: #1e40af; font-weight: 600;">👨‍🏫 Guru: ${escapeHtml(scheduleItem.teacher)}</p>
                <p style="margin: 5px 0 0 0; color: #1e40af;">⏰ Waktu: ${scheduleItem.startTime} - ${scheduleItem.endTime}</p>
            </div>
            <p style="font-size: 1.1rem; font-weight: 600; color: #dc2626;">
                ⚠️ Pelajaran akan dimulai dalam ${minutesBefore} menit!
            </p>
            <p style="color: #6b7280;">Apakah kamu sudah siap untuk pelajaran ini?</p>
        `;
        
        completeBtn.textContent = '✅ Sudah Siap';
        completeBtn.onclick = () => markScheduleAsReady(scheduleItem.id);
        
        modal.classList.add('show');
        
        // Store current notification info
        window.currentNotification = {
            type: 'schedule',
            id: scheduleItem.id,
            minutesBefore: minutesBefore
        };
    }
}

// Mark task as completed
function markTaskAsCompleted(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.isComplete = true;
        saveTasksToStorage();
        renderAllSections();
        
        // Clear all related notifications
        activeNotifications.delete(`task-${taskId}-20`);
        activeNotifications.delete(`task-${taskId}-10`);
        activeNotifications.delete(`task-${taskId}-5`);
        
        showMessage("✅ Tugas ditandai sebagai selesai!", "success");
    }
    dismissNotification();
}

// Mark schedule as ready
function markScheduleAsReady(scheduleId) {
    // Mark as ready (we can store this in localStorage if needed)
    activeNotifications.delete(`schedule-${scheduleId}-20`);
    showMessage("✅ Siap untuk pelajaran!", "success");
    dismissNotification();
}

// Snooze notification (remind again in 5 minutes)
function snoozeNotification() {
    if (!window.currentNotification) return;
    
    const { type, id, minutesBefore } = window.currentNotification;
    
    setTimeout(() => {
        if (type === 'task') {
            const task = tasks.find(t => t.id === id);
            if (task && !task.isComplete) {
                showTaskNotification(task, Math.max(1, minutesBefore - 5));
            }
        } else if (type === 'schedule') {
            const scheduleItem = findScheduleById(id);
            if (scheduleItem) {
                showScheduleNotification(scheduleItem, Math.max(1, minutesBefore - 5));
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    showMessage("⏰ Alarm akan berbunyi lagi dalam 5 menit", "success");
    dismissNotification();
}

// Dismiss notification
function dismissNotification() {
    const modal = document.getElementById('notification-modal');
    modal.classList.remove('show');
    window.currentNotification = null;
}

// Show browser notification (works even when app is closed)
function showBrowserNotification(title, body, type, id) {
    if (notificationPermission !== 'granted') {
        console.log('Notifikasi browser tidak diizinkan');
        return;
    }

    try {
        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiNEQzI2MjYiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNFY1SDE5QzIwLjEgNSAyMSA1LjkgMjEgN1YxOUMyMSAyMC4xIDIwLjEgMjEgMTkgMjFINUMzLjkgMjEgMyAyMC4xIDMgMTlWN0MzIDUuOSAzLjkgNSA1IDVIMTBWNEMxMCAyLjkgMTAuOSAyIDEyIDJaTTEyIDRWNkgxMlY0Wk01IDdWMTlIMTlWN0g1Wk03IDlIMTdWMTFIN1Y5Wk03IDEzSDE3VjE1SDdWMTNaTTcgMTdIMTNWMTlIN1YxN1oiLz4KPC9zdmc+Cjwvc3ZnPgo=',
            badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjVIMTlDMjAuMSA1IDIxIDUuOSAyMSA3VjE5QzIxIDIwLjEgMjAuMSAyMSAxOSAyMUg1QzMuOSAyMSAzIDIwLjEgMyAxOVY3QzMgNS45IDMuOSA1IDUgNUgxMFY0QzEwIDIuOSAxMC45IDIgMTIgMlpNMTIgNFY2SDEyVjRaTTUgN1YxOUgxOVY3SDVaTTcgOUgxN1YxMUg3VjlaTTcgMTNIMTdWMTVIN1YxM1pNNyAxN0gxM1YxOUg3VjE3WiIgZmlsbD0iI0RDMjYyNiIvPgo8L3N2Zz4K',
            tag: `school-pal-${type}-${id}`,
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200, 100, 200],
            data: {
                type: type,
                id: id,
                timestamp: Date.now()
            }
        });

        // Handle notification click
        notification.onclick = function(event) {
            event.preventDefault();
            
            // Focus the window if it exists
            if (window.parent) {
                window.parent.focus();
            }
            window.focus();
            
            // Close the notification
            notification.close();
            
            // Show the in-app modal if the app is open
            if (document.visibilityState === 'visible') {
                if (type === 'task') {
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        showTaskNotificationModal(task);
                    }
                } else if (type === 'schedule') {
                    const scheduleItem = findScheduleById(id);
                    if (scheduleItem) {
                        showScheduleNotificationModal(scheduleItem);
                    }
                }
            }
        };

        // Auto close after 10 seconds if not interacted
        setTimeout(() => {
            notification.close();
        }, 10000);

        console.log(`📱 Notifikasi browser ditampilkan: ${title}`);
        
    } catch (error) {
        console.error('Error menampilkan notifikasi browser:', error);
    }
}

// Show task notification modal (for in-app display)
function showTaskNotificationModal(task) {
    const modal = document.getElementById('notification-modal');
    const title = document.getElementById('notification-title');
    const content = document.getElementById('notification-content');
    const completeBtn = document.getElementById('complete-btn');
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const timeDiff = deadline.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    title.textContent = `🔔 Pengingat Tugas - ${minutesDiff} Menit Lagi!`;
    
    content.innerHTML = `
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border: 2px solid #f59e0b; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">📚 ${escapeHtml(task.name)}</h3>
            <p style="margin: 0; color: #92400e; font-weight: 600;">Mata Pelajaran: ${escapeHtml(task.subject)}</p>
            <p style="margin: 5px 0 0 0; color: #92400e;">⏰ Deadline: ${deadline.toLocaleString('id-ID')}</p>
        </div>
        <p style="font-size: 1.1rem; font-weight: 600; color: #dc2626;">
            ⚠️ Tugas ini akan berakhir dalam ${minutesDiff} menit!
        </p>
        <p style="color: #6b7280;">Apakah tugas ini sudah dikerjakan?</p>
    `;
    
    completeBtn.onclick = () => markTaskAsCompleted(task.id);
    
    modal.classList.add('show');
    
    // Store current notification info
    window.currentNotification = {
        type: 'task',
        id: task.id,
        minutesBefore: minutesDiff
    };
}

// Show schedule notification modal (for in-app display)
function showScheduleNotificationModal(scheduleItem) {
    const modal = document.getElementById('notification-modal');
    const title = document.getElementById('notification-title');
    const content = document.getElementById('notification-content');
    const completeBtn = document.getElementById('complete-btn');
    
    title.textContent = `🔔 Pengingat Jadwal - 20 Menit Lagi!`;
    
    content.innerHTML = `
        <div style="background: #dbeafe; padding: 20px; border-radius: 10px; border: 2px solid #3b82f6; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📖 ${escapeHtml(scheduleItem.subject)}</h3>
            <p style="margin: 0; color: #1e40af; font-weight: 600;">👨‍🏫 Guru: ${escapeHtml(scheduleItem.teacher)}</p>
            <p style="margin: 5px 0 0 0; color: #1e40af;">⏰ Waktu: ${scheduleItem.startTime} - ${scheduleItem.endTime}</p>
        </div>
        <p style="font-size: 1.1rem; font-weight: 600; color: #dc2626;">
            ⚠️ Pelajaran akan dimulai dalam 20 menit!
        </p>
        <p style="color: #6b7280;">Apakah kamu sudah siap untuk pelajaran ini?</p>
    `;
    
    completeBtn.textContent = '✅ Sudah Siap';
    completeBtn.onclick = () => markScheduleAsReady(scheduleItem.id);
    
    modal.classList.add('show');
    
    // Store current notification info
    window.currentNotification = {
        type: 'schedule',
        id: scheduleItem.id,
        minutesBefore: 20
    };
}

// Find schedule by ID
function findScheduleById(scheduleId) {
    for (const daySchedule of Object.values(schedule)) {
        const item = daySchedule.find(s => s.id === scheduleId);
        if (item) return item;
    }
    return null;
}

// Render other tasks
function renderOtherTasks() {
    const otherTasksContainer = document.getElementById('other-tasks');
    
    const now = new Date();
    const otherTasks = tasks.filter(task => {
        if (task.isComplete) return false;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        
        return hoursDiff > 24; // More than 24 hours away
    });
    
    if (otherTasks.length === 0) {
        otherTasksContainer.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada tugas lainnya. Tambah tugas baru dengan tombol + di pojok kanan bawah!</p>
            </div>
        `;
        return;
    }
    
    otherTasksContainer.innerHTML = otherTasks.map(task => {
        const deadline = new Date(task.deadline);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        const dayName = dayNames[deadline.getDay()];
        const date = deadline.getDate();
        const monthName = monthNames[deadline.getMonth()];
        const hours = deadline.getHours().toString().padStart(2, '0');
        const minutes = deadline.getMinutes().toString().padStart(2, '0');
        
        const deadlineText = `${dayName}, ${date} ${monthName} ${hours}:${minutes}`;
        
        return `
            <div class="other-task-card">
                <span style="color: #9ca3af; font-weight: bold;">⚪</span>
                <span class="urgent-task-name" style="color: #4b5563;">${escapeHtml(task.name)} ${task.alarmEnabled ? '🔔' : '🔕'}</span>
                <span class="other-task-deadline">${deadlineText}</span>
            </div>
        `;
    }).join('');
}

// Modal functions
function openAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    modal.classList.add('show');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-deadline').value = today;
    document.getElementById('task-deadline-time').value = '23:59';
}

function closeAddTaskModal() {
    const modal = document.getElementById('add-task-modal');
    modal.classList.remove('show');
    document.getElementById('task-form').reset();
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('show');
    loadDaySchedule();
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('show');
}

// Settings functions
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function loadDaySchedule() {
    const selectedDay = document.getElementById('day-select').value;
    const daySchedule = schedule[selectedDay] || [];
    const scheduleListElement = document.getElementById('settings-schedule-list');
    
    if (daySchedule.length === 0) {
        scheduleListElement.innerHTML = `
            <div class="empty-state">
                <p>Tidak ada jadwal untuk hari ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</p>
            </div>
        `;
        return;
    }
    
    scheduleListElement.innerHTML = daySchedule.map(item => `
        <div class="schedule-item-settings" data-schedule-id="${item.id}">
            <div class="schedule-info">
                <div class="schedule-subject">${escapeHtml(item.subject)} ${item.alarmEnabled !== false ? '🔔' : '🔕'}</div>
                <div class="schedule-time">${item.startTime} - ${item.endTime}</div>
                <div class="schedule-teacher">👨‍🏫 ${escapeHtml(item.teacher)}</div>
            </div>
            <div class="schedule-actions">
                <button class="btn btn-edit" onclick="editScheduleItem('${item.id}')">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger" onclick="deleteScheduleItem('${item.id}')">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Handle schedule form submission
async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const day = document.getElementById('schedule-day').value;
    const subject = document.getElementById('schedule-subject').value.trim();
    const startTime = document.getElementById('schedule-start').value;
    const endTime = document.getElementById('schedule-end').value;
    const teacher = document.getElementById('schedule-teacher').value.trim();
    
    if (!day || !subject || !startTime || !endTime || !teacher) {
        showMessage("Mohon lengkapi semua field!", "error");
        return;
    }
    
    if (startTime >= endTime) {
        showMessage("Jam mulai harus lebih awal dari jam selesai!", "error");
        return;
    }
    
    const scheduleId = `${day}-${Date.now()}`;
    
    const newScheduleItem = {
        id: scheduleId,
        subject: subject,
        startTime: startTime,
        endTime: endTime,
        teacher: teacher,
        alarmEnabled: document.getElementById('schedule-alarm').checked
    };
    
    if (!schedule[day]) {
        schedule[day] = [];
    }
    
    schedule[day].push(newScheduleItem);
    schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    saveScheduleToStorage();
    
    document.getElementById('schedule-form').reset();
    document.getElementById('day-select').value = day;
    loadDaySchedule();
    renderTodaySchedule();
    
    showMessage("Jadwal berhasil ditambahkan!", "success");
}

// Edit schedule item
function editScheduleItem(scheduleId) {
    let foundItem = null;
    let foundDay = null;
    
    for (const [day, daySchedule] of Object.entries(schedule)) {
        const item = daySchedule.find(s => s.id === scheduleId);
        if (item) {
            foundItem = item;
            foundDay = day;
            break;
        }
    }
    
    if (!foundItem) return;
    
    document.getElementById('schedule-day').value = foundDay;
    document.getElementById('schedule-subject').value = foundItem.subject;
    document.getElementById('schedule-start').value = foundItem.startTime;
    document.getElementById('schedule-end').value = foundItem.endTime;
    document.getElementById('schedule-teacher').value = foundItem.teacher;
    document.getElementById('schedule-alarm').checked = foundItem.alarmEnabled !== false;
    
    switchTab('add-schedule');
    deleteScheduleItem(scheduleId, false);
}

// Delete schedule item
function deleteScheduleItem(scheduleId, showConfirmation = true) {
    if (showConfirmation) {
        const scheduleElement = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
        const actionsDiv = scheduleElement.querySelector('.schedule-actions');
        
        actionsDiv.innerHTML = `
            <button class="btn btn-danger" onclick="confirmDeleteSchedule('${scheduleId}')">
                Konfirmasi Hapus?
            </button>
            <button class="btn" onclick="loadDaySchedule()" style="background: #6b7280; color: white;">
                Batal
            </button>
        `;
        return;
    }
    
    confirmDeleteSchedule(scheduleId, false);
}

// Confirm delete schedule
function confirmDeleteSchedule(scheduleId, showMessage = true) {
    for (const [day, daySchedule] of Object.entries(schedule)) {
        const index = daySchedule.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
            daySchedule.splice(index, 1);
            
            saveScheduleToStorage();
            loadDaySchedule();
            renderTodaySchedule();
            
            if (showMessage) {
                showMessage("Jadwal berhasil dihapus!", "success");
            }
            break;
        }
    }
}

// Storage functions
function saveScheduleToStorage() {
    try {
        localStorage.setItem('school-pal-schedule', JSON.stringify(schedule));
    } catch (error) {
        console.error("Error menyimpan jadwal:", error);
    }
}

function loadScheduleFromStorage() {
    try {
        const savedSchedule = localStorage.getItem('school-pal-schedule');
        if (savedSchedule) {
            schedule = JSON.parse(savedSchedule);
        }
    } catch (error) {
        console.error("Error memuat jadwal:", error);
    }
}

function saveTasksToStorage() {
    try {
        localStorage.setItem('school-pal-tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error("Error menyimpan tugas:", error);
    }
}

function loadTasksFromStorage() {
    try {
        const savedTasks = localStorage.getItem('school-pal-tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
            currentRecordCount = tasks.length;
        }
    } catch (error) {
        console.error("Error memuat tugas:", error);
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading(show) {
    const submitBtn = document.querySelector('#task-form button[type="submit"]');
    if (show) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Menyimpan...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '➕ Tambah Tugas';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);