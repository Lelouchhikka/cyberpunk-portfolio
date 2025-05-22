// script.js
document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('.faq-icon');

        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Smooth scrolling for anchor links (if you add any)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header Scroll Effect
    const header = document.querySelector('header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            // Scroll Down
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            // Scroll Up
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        
        lastScroll = currentScroll;
    });

    // Image Lazy Loading
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));

    // Animate Numbers in Stats
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Trigger number animation when stats section is in view
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stats = entry.target.querySelectorAll('span');
                    stats.forEach(stat => {
                        const value = parseInt(stat.textContent);
                        animateValue(stat, 0, value, 2000);
                    });
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(statsSection);
    }

    // Загрузка локализации
    let translations = {};
    let currentLang = 'en';

    // Загрузка файлов локализации
    async function loadTranslations(lang) {
        try {
            const response = await fetch(`locales/${lang}.yml`);
            const text = await response.text();
            translations[lang] = parseYAML(text);
        } catch (error) {
            console.error(`Error loading ${lang} translations:`, error);
        }
    }

    // Парсинг YAML
    function parseYAML(yaml) {
        const result = {};
        const lines = yaml.split('\n');
        let currentPath = [];
        
        lines.forEach(line => {
            if (line.trim() === '') return;
            
            const indent = line.search(/\S|$/);
            const content = line.trim();
            
            if (content.startsWith('-')) {
                // Это элемент массива
                const value = content.substring(1).trim();
                if (currentPath.length > 0) {
                    let current = result;
                    for (let i = 0; i < currentPath.length - 1; i++) {
                        current = current[currentPath[i]];
                    }
                    if (!Array.isArray(current[currentPath[currentPath.length - 1]])) {
                        current[currentPath[currentPath.length - 1]] = [];
                    }
                    current[currentPath[currentPath.length - 1]].push(value);
                }
            } else {
                // Это ключ
                const key = content.split(':')[0].trim();
                const value = content.split(':')[1]?.trim();
                
                if (indent === 0) {
                    currentPath = [key];
                } else {
                    const level = Math.floor(indent / 2);
                    currentPath = currentPath.slice(0, level);
                    currentPath.push(key);
                }
                
                if (value) {
                    let current = result;
                    for (let i = 0; i < currentPath.length - 1; i++) {
                        if (!current[currentPath[i]]) {
                            current[currentPath[i]] = {};
                        }
                        current = current[currentPath[i]];
                    }
                    current[currentPath[currentPath.length - 1]] = value.replace(/^["']|["']$/g, '');
                }
            }
        });
        
        return result;
    }

    // Обновление текста на странице
    function updateContent(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const keys = element.getAttribute('data-i18n').split('.');
            let value = translations[lang];
            
            for (const key of keys) {
                if (value && value[key]) {
                    value = value[key];
                } else {
                    value = null;
                    break;
                }
            }
            
            if (value) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    // Обработчик переключения языка
    function handleLanguageSwitch() {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(button => {
            button.addEventListener('click', async () => {
                const lang = button.getAttribute('data-lang');
                if (lang !== currentLang) {
                    if (!translations[lang]) {
                        await loadTranslations(lang);
                    }
                    currentLang = lang;
                    updateContent(lang);
                    
                    // Обновление активной кнопки
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                }
            });
        });
    }

    // Инициализация
    async function init() {
        await loadTranslations('en');
        await loadTranslations('ru');
        updateContent(currentLang);
        handleLanguageSwitch();
    }

    init();

    // Preloader
    const preloader = document.querySelector('.preloader');
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 2000);

    // Matrix Rain Effect
    class MatrixRain {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.matrixRain = document.querySelector('.matrix-rain');
            this.matrixRain.appendChild(this.canvas);
            
            this.resize();
            this.init();
            
            window.addEventListener('resize', () => this.resize());
        }
        
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        init() {
            this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
            this.fontSize = 14;
            this.columns = this.canvas.width / this.fontSize;
            this.drops = [];
            
            for(let i = 0; i < this.columns; i++) {
                this.drops[i] = 1;
            }
            
            this.draw();
        }
        
        draw() {
            this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#00ff9d';
            this.ctx.font = this.fontSize + 'px monospace';
            
            for(let i = 0; i < this.drops.length; i++) {
                const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
                this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
                
                if(this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }
                
                this.drops[i]++;
            }
            
            requestAnimationFrame(() => this.draw());
        }
    }

    // Initialize Matrix Rain
    new MatrixRain();

    // Typing Effect
    class TypingEffect {
        constructor(element, text, speed = 50) {
            this.element = element;
            this.text = text;
            this.speed = speed;
            this.index = 0;
            this.type();
        }
        
        type() {
            if(this.index < this.text.length) {
                this.element.textContent += this.text.charAt(this.index);
                this.index++;
                setTimeout(() => this.type(), this.speed);
            }
        }
    }

    // Initialize typing effects
    document.querySelectorAll('.typing-text').forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        new TypingEffect(element, text);
    });

    // Skill Bars Animation
    const animateSkillBars = () => {
        const skillItems = document.querySelectorAll('.skill-item');
        
        skillItems.forEach(item => {
            const level = item.getAttribute('data-level');
            const bar = item.querySelector('.skill-bar');
            bar.style.setProperty('--skill-level', `${level}%`);
        });
    };

    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                if(entry.target.classList.contains('skills-section')) {
                    animateSkillBars();
                }
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Terminal Interface (Easter Egg)
    class Terminal {
        constructor() {
            this.terminal = document.querySelector('.terminal-interface');
            this.input = document.querySelector('.command-input');
            this.output = document.querySelector('.terminal-output');
            this.commands = {
                help: () => this.printHelp(),
                clear: () => this.clear(),
                about: () => this.printAbout(),
                skills: () => this.printSkills(),
                projects: () => this.printProjects(),
                contact: () => this.printContact()
            };
            
            this.init();
        }
        
        init() {
            // Toggle terminal with Ctrl + `
            document.addEventListener('keydown', (e) => {
                if(e.ctrlKey && e.key === '`') {
                    this.terminal.style.display = this.terminal.style.display === 'none' ? 'block' : 'none';
                    if(this.terminal.style.display === 'block') {
                        this.input.focus();
                    }
                }
            });
            
            // Handle commands
            this.input.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    const command = this.input.value.toLowerCase().trim();
                    this.input.value = '';
                    
                    if(this.commands[command]) {
                        this.commands[command]();
                    } else {
                        this.printError(`Command not found: ${command}`);
                    }
                }
            });
        }
        
        print(text) {
            const line = document.createElement('div');
            line.textContent = text;
            this.output.appendChild(line);
            this.output.scrollTop = this.output.scrollHeight;
        }
        
        printError(text) {
            const line = document.createElement('div');
            line.textContent = `Error: ${text}`;
            line.style.color = '#ff0000';
            this.output.appendChild(line);
            this.output.scrollTop = this.output.scrollHeight;
        }
        
        clear() {
            this.output.innerHTML = '';
        }
        
        printHelp() {
            this.print('Available commands:');
            Object.keys(this.commands).forEach(cmd => {
                this.print(`- ${cmd}`);
            });
        }
        
        printAbout() {
            this.print('Kelman Erasyl - Software Developer');
            this.print('Full-stack developer with 1.5 years of commercial experience');
            this.print('Passionate about creating innovative and efficient solutions');
        }
        
        printSkills() {
            this.print('Technical Skills:');
            this.print('- PHP (Laravel)');
            this.print('- Python (Django)');
            this.print('- Java (Spring Boot)');
            this.print('- JavaScript (React)');
            this.print('- Databases: PostgreSQL, MySQL');
        }
        
        printProjects() {
            this.print('Featured Projects:');
            this.print('1. Astanu Food Detection System');
            this.print('2. Internet Store Application');
            this.print('3. Task Management Application');
            this.print('4. Job Posting API');
        }
        
        printContact() {
            this.print('Contact Information:');
            this.print('Phone: +7 747 185 76 60');
            this.print('Email: erasyl.kelman@gmail.com');
            this.print('Location: Kazakhstan, Astana-Almaty');
        }
    }

    // Initialize Terminal
    new Terminal();

    // Glitch Effect
    const glitchText = document.querySelector('.glitch-text');
    let glitchInterval;

    const startGlitch = () => {
        glitchInterval = setInterval(() => {
            glitchText.style.textShadow = `
                ${Math.random() * 10}px ${Math.random() * 10}px ${Math.random() * 10}px rgba(0, 255, 157, 0.7),
                ${Math.random() * -10}px ${Math.random() * -10}px ${Math.random() * 10}px rgba(255, 0, 255, 0.7)
            `;
        }, 50);
    };

    const stopGlitch = () => {
        clearInterval(glitchInterval);
        glitchText.style.textShadow = '0 0 10px rgba(0, 255, 157, 0.7)';
    };

    glitchText.addEventListener('mouseenter', startGlitch);
    glitchText.addEventListener('mouseleave', stopGlitch);
});