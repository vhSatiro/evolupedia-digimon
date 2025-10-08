export function initializeTheme() {
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeSwitcherLabel = document.getElementById('theme-switcher-label');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeSwitcher.checked = true;
            themeSwitcherLabel.textContent = 'Modo Claro';
        } else {
            body.classList.remove('dark-mode');
            themeSwitcher.checked = false;
            themeSwitcherLabel.textContent = 'Modo Noturno';
        }
        localStorage.setItem('theme', theme);
    };

    const toggleTheme = () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeSwitcher.addEventListener('change', toggleTheme);
}