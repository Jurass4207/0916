/**
 * 李君衛 (Li Junwei) Personal Web Page & Interactive Real-Time Clock Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let is24HourFormat = true;
    let stopwatchInterval = null;
    let stopwatchStartTime = 0;
    let stopwatchElapsedTime = 0;
    let stopwatchIsRunning = false;
    let lapCount = 0;

    let timerInterval = null;
    let timerTotalSeconds = 25 * 60;
    let timerRemainingSeconds = 25 * 60;
    let timerIsRunning = false;

    // --- DOM Element References ---
    const clockHours = document.getElementById('clock-hours');
    const clockMinutes = document.getElementById('clock-minutes');
    const clockSeconds = document.getElementById('clock-seconds');
    const clockAmPm = document.getElementById('clock-ampm');
    const secondProgress = document.getElementById('second-progress');
    const clockDateCn = document.getElementById('clock-date-cn');
    const clockDateEn = document.getElementById('clock-date-en');
    const timezoneLabel = document.getElementById('timezone-label');
    const dayOfYearElem = document.getElementById('day-of-year');
    const weekNumberElem = document.getElementById('week-number');
    const greetingIcon = document.getElementById('greeting-icon');
    const greetingText = document.getElementById('greeting-text');

    // Cities
    const cityTaipei = document.getElementById('city-taipei');
    const cityTokyo = document.getElementById('city-tokyo');
    const cityLondon = document.getElementById('city-london');
    const cityNy = document.getElementById('city-ny');

    // Progress Bars
    const percentDay = document.getElementById('percent-day');
    const barDay = document.getElementById('bar-day');
    const percentMonth = document.getElementById('percent-month');
    const barMonth = document.getElementById('bar-month');
    const percentYear = document.getElementById('percent-year');
    const barYear = document.getElementById('bar-year');

    // Controls & Modals
    const formatToggleBtn = document.getElementById('format-toggle');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const contactForm = document.getElementById('contact-form');
    const loadTimestampElem = document.getElementById('load-timestamp');
    const backToTopBtn = document.getElementById('back-to-top-btn');

    // Set Initial Load Timestamp
    const nowOnLoad = new Date();
    loadTimestampElem.textContent = nowOnLoad.toLocaleString('zh-TW', { dateStyle: 'full', timeStyle: 'medium' });

    // --- Real-time Clock Engine ---
    function updateClock() {
        const now = new Date();

        // Hours, Minutes, Seconds
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // 12h / 24h format handling
        let ampmStr = '';
        if (!is24HourFormat) {
            ampmStr = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
        }
        clockAmPm.textContent = ampmStr;

        clockHours.textContent = String(hours).padStart(2, '0');
        clockMinutes.textContent = String(minutes).padStart(2, '0');
        clockSeconds.textContent = String(seconds).padStart(2, '0');

        // Circular Seconds Gauge Progress
        // Total dasharray = 534
        const secondsProgressVal = (seconds + milliseconds / 1000) / 60;
        const dashoffset = 534 - (secondsProgressVal * 534);
        if (secondProgress) {
            secondProgress.style.strokeDashoffset = dashoffset;
        }

        // Date String Display
        const dateCnStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
        const dateEnStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        clockDateCn.textContent = dateCnStr;
        clockDateEn.textContent = dateEnStr;

        // Timezone calculation
        const tzOffsetMinutes = -now.getTimezoneOffset();
        const tzHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
        const tzSign = tzOffsetMinutes >= 0 ? '+' : '-';
        timezoneLabel.textContent = `GMT${tzSign}${tzHours}`;

        // Day of Year and Week Number
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const diffDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        dayOfYearElem.textContent = `第 ${diffDays} 天`;

        const weekNum = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        weekNumberElem.textContent = `第 ${weekNum} 週`;

        // Update Greetings & Time-of-Day Icon
        updateGreeting(now.getHours());

        // Update World Clocks
        updateWorldClocks(now);

        // Update Time Progress Bars
        updateTimeProgress(now);
    }

    function updateGreeting(hour) {
        let text = '';
        let iconClass = 'fa-solid fa-sun';

        if (hour >= 5 && hour < 12) {
            text = '早安！美好的一天開始了，祝您工作順心 ☀️';
            iconClass = 'fa-solid fa-sun-plant-wilt';
        } else if (hour >= 12 && hour < 18) {
            text = '午後好！保持專注與創造力，繼續前進 ☕';
            iconClass = 'fa-solid fa-cloud-sun';
        } else if (hour >= 18 && hour < 23) {
            text = '晚上好！享受愜意的靜謐時光與夜色 🌙';
            iconClass = 'fa-solid fa-moon';
        } else {
            text = '深夜了！注意休息，保持充足睡眠 ⭐️';
            iconClass = 'fa-solid fa-bed';
        }

        greetingText.textContent = text;
        greetingIcon.className = `greeting-icon ${iconClass}`;
    }

    function updateWorldClocks(now) {
        const formatOptions = (timeZone) => {
            return new Intl.DateTimeFormat('zh-TW', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: !is24HourFormat
            }).format(now);
        };

        if (cityTaipei) cityTaipei.textContent = formatOptions('Asia/Taipei');
        if (cityTokyo) cityTokyo.textContent = formatOptions('Asia/Tokyo');
        if (cityLondon) cityLondon.textContent = formatOptions('Europe/London');
        if (cityNy) cityNy.textContent = formatOptions('America/New_York');
    }

    function updateTimeProgress(now) {
        // 1. Day progress
        const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const dayPct = ((secondsInDay / 86400) * 100).toFixed(1);
        percentDay.textContent = `${dayPct}%`;
        barDay.style.width = `${dayPct}%`;

        // 2. Month progress
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const monthPct = (((currentDay - 1 + secondsInDay / 86400) / daysInMonth) * 100).toFixed(1);
        percentMonth.textContent = `${monthPct}%`;
        barMonth.style.width = `${monthPct}%`;

        // 3. Year progress
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const totalDaysYear = isLeapYear(currentYear) ? 366 : 365;
        const startOfYear = new Date(currentYear, 0, 1);
        const dayOfYear = (now - startOfYear) / (1000 * 60 * 60 * 24);
        const yearPct = ((dayOfYear / totalDaysYear) * 100).toFixed(1);
        percentYear.textContent = `${yearPct}%`;
        barYear.style.width = `${yearPct}%`;
    }

    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem('user_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    const savedFormat = localStorage.getItem('user_format');
    if (savedFormat !== null) {
        is24HourFormat = savedFormat === '24H';
        formatToggleBtn.querySelector('.btn-text').textContent = is24HourFormat ? '24H' : '12H';
    }

    // Run Clock every 100ms for smooth animations
    setInterval(updateClock, 100);
    updateClock();

    // --- 12H / 24H Format Toggle ---
    formatToggleBtn.addEventListener('click', () => {
        is24HourFormat = !is24HourFormat;
        const fmtText = is24HourFormat ? '24H' : '12H';
        formatToggleBtn.querySelector('.btn-text').textContent = fmtText;
        localStorage.setItem('user_format', fmtText);
        showToast(`已切換為 ${is24HourFormat ? '24 小時制' : '12 小時制'}`);
        updateClock();
    });

    // --- Theme Toggle (Dark / Light) ---
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('user_theme', nextTheme);
        themeToggleBtn.innerHTML = nextTheme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        showToast(`已切換為 ${nextTheme === 'dark' ? '深色模式' : '淺色模式'}`);
    });

    // --- Stopwatch Logic ---
    const swStartBtn = document.getElementById('sw-start-btn');
    const swLapBtn = document.getElementById('sw-lap-btn');
    const swResetBtn = document.getElementById('sw-reset-btn');
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const lapList = document.getElementById('lap-list');

    function formatStopwatchTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        const hundredths = Math.floor((ms % 1000) / 10);

        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');
        const hStr = String(hundredths).padStart(2, '0');

        return `${mStr}:${sStr}<span class="ms-part">.${hStr}</span>`;
    }

    swStartBtn.addEventListener('click', () => {
        if (!stopwatchIsRunning) {
            stopwatchIsRunning = true;
            stopwatchStartTime = Date.now() - stopwatchElapsedTime;
            stopwatchInterval = setInterval(() => {
                stopwatchElapsedTime = Date.now() - stopwatchStartTime;
                stopwatchDisplay.innerHTML = formatStopwatchTime(stopwatchElapsedTime);
            }, 10);
            swStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
            swStartBtn.className = 'btn btn-secondary';
            swLapBtn.disabled = false;
        } else {
            stopwatchIsRunning = false;
            clearInterval(stopwatchInterval);
            swStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> 繼續';
            swStartBtn.className = 'btn btn-primary';
            swLapBtn.disabled = true;
        }
    });

    swLapBtn.addEventListener('click', () => {
        if (stopwatchIsRunning) {
            lapCount++;
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `<span>圈數 #${lapCount}</span><span>${stopwatchDisplay.innerText}</span>`;
            lapList.prepend(lapItem);
        }
    });

    swResetBtn.addEventListener('click', () => {
        stopwatchIsRunning = false;
        clearInterval(stopwatchInterval);
        stopwatchElapsedTime = 0;
        stopwatchDisplay.innerHTML = '00:00:00<span class="ms-part">.00</span>';
        swStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> 開始';
        swStartBtn.className = 'btn btn-primary';
        swLapBtn.disabled = true;
        lapList.innerHTML = '';
        lapCount = 0;
    });

    // --- Focus Countdown Timer Logic ---
    const timerDisplay = document.getElementById('timer-display');
    const timerStartBtn = document.getElementById('timer-start-btn');
    const timerResetBtn = document.getElementById('timer-reset-btn');
    const timerStatus = document.getElementById('timer-status');
    const presetBtns = document.querySelectorAll('.preset-btn');

    function updateTimerDisplay() {
        const mins = Math.floor(timerRemainingSeconds / 60);
        const secs = timerRemainingSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (timerIsRunning) return;
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mins = parseInt(btn.getAttribute('data-mins'));
            timerTotalSeconds = mins * 60;
            timerRemainingSeconds = timerTotalSeconds;
            updateTimerDisplay();
            timerStatus.textContent = `準備開始 ${mins} 分鐘專注模式`;
        });
    });

    timerStartBtn.addEventListener('click', () => {
        if (!timerIsRunning) {
            timerIsRunning = true;
            timerStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
            timerStatus.textContent = '⏱ 專注進行中...保持專心';
            timerInterval = setInterval(() => {
                timerRemainingSeconds--;
                updateTimerDisplay();

                if (timerRemainingSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerIsRunning = false;
                    timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> 開始專注';
                    timerStatus.textContent = '🎉 時間到！辛苦了，給自己休息一下吧！';
                    showToast('🎉 計時結束！完成了一次專注目標！');
                }
            }, 1000);
        } else {
            timerIsRunning = false;
            clearInterval(timerInterval);
            timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> 繼續';
            timerStatus.textContent = '已暫停計時';
        }
    });

    timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerIsRunning = false;
        timerRemainingSeconds = timerTotalSeconds;
        updateTimerDisplay();
        timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> 開始專注';
        timerStatus.textContent = '重置完畢，準備好即可點擊開始';
    });

    // --- Copy Email Action ---
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', () => {
            const email = 'lijunwei@example.com';
            navigator.clipboard.writeText(email).then(() => {
                showToast('📋 已複製 Email：' + email);
            }).catch(() => {
                showToast('複製失敗，請手動選擇複製');
            });
        });
    }

    // --- Contact Form Submission ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value;
            showToast(`✨ 感謝 ${name} 的留言！李君衛會儘快回覆您。`);
            contactForm.reset();
        });
    }

    // --- Back To Top ---
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Toast Notification Helper ---
    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--accent-cyan)"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Background Particle Canvas ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const particleCount = Math.min(width < 768 ? 35 : 70, 100);

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.2
            });
        }

        function renderCanvas() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 242, 254, ${p.alpha})`;
                ctx.fill();
            });

            requestAnimationFrame(renderCanvas);
        }

        renderCanvas();
    }
});
