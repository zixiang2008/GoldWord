const I18N = (function() {
    const STORAGE_KEY = 'goldword_language';
    let lang = localStorage.getItem(STORAGE_KEY) || 'zh-CN';
    let dict = null;
    async function load() {
        try {
            const res = await fetch('language-system.json');
            dict = await res.json();
        } catch (e) {
            dict = { languages: { 'zh-CN': { name: '简体中文' }, 'en-US': { name: 'English' } }, translations: {} };
        }
    }
    function apply() {
        if (!dict) return;
        const t = (dict.translations && dict.translations[lang]) || {};
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const parts = key.split('.');
            let cur = t;
            for (const p of parts) cur = (cur || {})[p];
            if (typeof cur === 'string') el.textContent = cur;
        });
        document.documentElement.dir = ((dict.languages[lang] || {}).rtl ? 'rtl' : 'ltr');
    }
    function setLanguage(code) {
        lang = code; localStorage.setItem(STORAGE_KEY, lang); apply();
    }
    async function init() { await load(); apply(); }
    return { init, setLanguage };
})();
window.I18N = I18N;
