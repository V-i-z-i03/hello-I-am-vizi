/* ============================================================
   vizi — сайты под ключ
   Ванильный JS: мобильное меню, reveal-анимации, форма
   ============================================================ */

// ---------- Мобильное меню ----------
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--open');
    menuBtn.setAttribute('aria-expanded', isOpen);
    menuBtn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');

    // Анимация бургера в крестик
    const lines = menuBtn.querySelectorAll('.menu-btn__line');
    if (isOpen) {
        lines[0].style.transform = 'translateY(7px) rotate(45deg)';
        lines[1].style.opacity = '0';
        lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
        lines[0].style.transform = '';
        lines[1].style.opacity = '';
        lines[2].style.transform = '';
    }
});

// Закрываем меню при клике на ссылку внутри него
nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        menuBtn.setAttribute('aria-expanded', 'false');
        const lines = menuBtn.querySelectorAll('.menu-btn__line');
        lines[0].style.transform = '';
        lines[1].style.opacity = '';
        lines[2].style.transform = '';
    });
});

// ---------- Плавное появление блоков при скролле ----------
// fade + сдвиг вверх + лёгкое досжатие масштаба; внутри сеток — каскадная задержка
const revealElements = document.querySelectorAll('.section-title, .service-card, .step, .testimonial, .faq__item, .about__content, .contact-form');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
});

// Каскад: карточки в одной сетке появляются друг за другом с шагом 90 мс.
// Задержка вешается только на reveal-анимацию: после её завершения сбрасываем,
// чтобы не тормозить hover-эффекты.
const revealGroups = document.querySelectorAll('.services__grid, .process__steps, .testimonials__grid, .faq__items');
revealGroups.forEach(group => {
    Array.from(group.children).forEach((child, index) => {
        child.style.transitionDelay = `${index * 90}ms`;
        child.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity') {
                child.style.transitionDelay = '';
            }
        }, { once: true });
    });
});

// ---------- Счётчики цифр в hero (анимация при появлении) ----------
function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1200; // мс
    const start = performance.now();

    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        // ease-out: сначала быстро, потом замедляется
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

// ---------- Плавное открытие FAQ + аккордеон (один открыт за раз) ----------
const faqItems = document.querySelectorAll('.faq__item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    question.addEventListener('click', (e) => {
        e.preventDefault(); // отменяем мгновенное раскрытие details, анимируем сами

        const wasOpen = item.classList.contains('faq__item--open');

        // Закрываем все
        faqItems.forEach(other => {
            other.classList.remove('faq__item--open');
            other.open = false;
            other.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        });

        // Открываем текущий, если он был закрыт
        if (!wasOpen) {
            item.classList.add('faq__item--open');
            item.open = true;
            question.setAttribute('aria-expanded', 'true');
        }
    });
});

// ---------- Отправка формы через Formspree ----------
// Чтобы форма заработала, замените YOUR_FORM_ID в action формы (index.html)
// на ID своей формы из formspree.io: https://formspree.io/f/abcdwxyz
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = form.querySelector('button[type="submit"]');
const submitBtnText = submitBtn.textContent;

function setFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.classList.remove('form__status--ok', 'form__status--error');
    if (type) formStatus.classList.add(`form__status--${type}`);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляю…';
    setFormStatus('', null);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            setFormStatus('Спасибо! Заявка ушла — отвечу в ближайшее время.', 'ok');
            form.reset();
        } else {
            // Formspree возвращает JSON с описанием ошибки
            const data = await response.json().catch(() => null);
            const detail = data && data.errors && data.errors.length
                ? data.errors.map(err => err.message).join(' ')
                : 'Не удалось отправить заявку. Попробуйте ещё раз или напишите в Telegram — @vizi_program.';
            setFormStatus(detail, 'error');
        }
    } catch (error) {
        // Сеть недоступна или запрос заблокирован
        setFormStatus('Нет связи с сервером. Проверьте интернет или напишите в Telegram — @vizi_program.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnText;
    }
});

// ---------- Закрытие меню по Escape ----------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        menuBtn.setAttribute('aria-expanded', 'false');
        const lines = menuBtn.querySelectorAll('.menu-btn__line');
        lines[0].style.transform = '';
        lines[1].style.opacity = '';
        lines[2].style.transform = '';
    }
});

// ---------- Тень у шапки после прокрутки ----------
const header = document.getElementById('header');

function updateHeaderShadow() {
    header.classList.toggle('header--scrolled', window.scrollY > 8);
}

window.addEventListener('scroll', updateHeaderShadow, { passive: true });
updateHeaderShadow();

// ---------- Подсветка активного пункта меню при скролле ----------
const navLinks = Array.from(document.querySelectorAll('.nav__link'));
const sectionsById = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('nav__link--active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'true');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    });
}, {
    // Секция считается активной, когда её верх пересекает середину экрана
    rootMargin: '-45% 0px -50% 0px',
    threshold: 0
});

sectionsById.forEach(section => sectionObserver.observe(section));