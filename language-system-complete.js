/**
 * GoldWord 完整多语言国际化系统
 * Complete Internationalization System
 * 
 * 功能：
 * - 多语言支持 (12种语言)
 * - AI自动翻译
 * - 界面语言切换
 * - 翻译缓存
 * - 批量翻译
 * - 翻译统计
 * 
 * 使用方法：
 * 1. 在HTML中引入此文件
 * 2. 调用 LanguageSystem.init() 初始化
 * 3. 使用 t('key') 函数获取翻译
 * 4. 使用 LanguageUI 组件进行界面操作
 */

const LanguageSystem = {
    // 系统配置
    config: {
        version: '1.0.0',
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN', 'zh-TW', 'en-US', 'en-GB', 'th', 'ja', 'es', 'fr', 'de', 'ko', 'ar', 'ru'],
        rtlLanguages: ['ar'],
        cacheKeys: {
            language: 'goldword_user_language',
            translations: 'goldword_language_data',
            translationCache: 'goldword_translation_cache',
            translationHistory: 'goldword_translation_history'
        }
    },
    
    // 系统状态
    status: {
        initialized: false,
        currentLanguage: 'zh-CN',
        translations: {},
        translationCache: {},
        translationHistory: []
    },
    
    // 初始化整个语言系统
    async init(options = {}) {
        try {
            console.log('🌍 初始化GoldWord多语言系统...');
            
            // 合并配置
            this.config = { ...this.config, ...options };
            
            // 1. 初始化语言管理器
            await this.initLanguageManager();
            
            // 2. 初始化AI翻译服务
            await this.initAITranslationService();
            
            // 3. 初始化UI组件
            await this.initUIComponents();
            
            // 4. 重构现有界面
            await this.refactorExistingUI();
            
            // 5. 添加语言切换功能
            await this.addLanguageSwitching();
            
            // 6. 设置事件监听
            this.setupEventListeners();
            
            this.status.initialized = true;
            console.log('✅ GoldWord多语言系统初始化完成');
            console.log(`🗣️ 当前语言: ${this.status.currentLanguage}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ 多语言系统初始化失败:', error);
            return false;
        }
    },
    
    // 初始化语言管理器
    async initLanguageManager() {
        try {
            // 加载用户选择的语言
            const savedLanguage = localStorage.getItem(this.config.cacheKeys.language);
            if (savedLanguage && this.config.supportedLanguages.includes(savedLanguage)) {
                this.status.currentLanguage = savedLanguage;
            } else {
                // 检测浏览器语言
                this.status.currentLanguage = this.detectBrowserLanguage();
            }
            
            // 加载翻译数据
            await this.loadTranslations();
            
            // 应用语言设置
            this.applyLanguageSettings();
            
            console.log('✅ 语言管理器初始化完成');
            
        } catch (error) {
            console.error('语言管理器初始化失败:', error);
            throw error;
        }
    },
    
    // 初始化AI翻译服务
    async initAITranslationService() {
        try {
            // 加载翻译缓存
            this.loadTranslationCache();
            
            // 加载翻译历史
            this.loadTranslationHistory();
            
            console.log('✅ AI翻译服务初始化完成');
            
        } catch (error) {
            console.error('AI翻译服务初始化失败:', error);
            // 不中断系统初始化
        }
    },
    
    // 初始化UI组件
    async initUIComponents() {
        try {
            // 创建语言选择器
            this.createLanguageSelector();
            
            // 创建翻译控制面板
            this.createTranslationPanel();
            
            console.log('✅ UI组件初始化完成');
            
        } catch (error) {
            console.error('UI组件初始化失败:', error);
            throw error;
        }
    },
    
    // 重构现有界面
    async refactorExistingUI() {
        try {
            // 1. 更新页面标题
            this.updatePageTitle();
            
            // 2. 更新按钮文本
            this.updateButtonTexts();
            
            // 3. 更新选择器选项
            this.updateSelectOptions();
            
            // 4. 更新统计信息
            this.updateStatsTexts();
            
            // 5. 更新设置界面
            this.updateSettingsUI();
            
            console.log('✅ 界面重构完成');
            
        } catch (error) {
            console.error('界面重构失败:', error);
            throw error;
        }
    },
    
    // 检测浏览器语言
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'zh-CN';
        
        const langMap = {
            'zh-CN': ['zh-CN', 'zh'],
            'zh-TW': ['zh-TW', 'zh-HK', 'zh-MO'],
            'en-US': ['en-US', 'en'],
            'en-GB': ['en-GB', 'en-UK'],
            'th': ['th'],
            'ja': ['ja'],
            'es': ['es'],
            'fr': ['fr'],
            'de': ['de'],
            'ko': ['ko'],
            'ar': ['ar'],
            'ru': ['ru']
        };
        
        for (const [appLang, browserLangs] of Object.entries(langMap)) {
            if (browserLangs.some(lang => browserLang.startsWith(lang))) {
                return appLang;
            }
        }
        
        return this.config.defaultLanguage;
    },
    
    // 加载翻译数据
    async loadTranslations() {
        try {
            // 尝试从缓存加载
            const cachedData = localStorage.getItem(this.config.cacheKeys.translations);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                if (data.version === this.config.version) {
                    this.status.translations = data.translations;
                    return;
                }
            }
            
            // 从服务器加载基础翻译数据
            await this.loadBaseTranslations();
            
            // 缓存数据
            this.cacheTranslations();
            
        } catch (error) {
            console.error('加载翻译数据失败:', error);
            this.loadDefaultTranslations();
        }
    },
    
    // 加载基础翻译数据
    async loadBaseTranslations() {
        try {
            const response = await fetch('language-system.json');
            if (response.ok) {
                const data = await response.json();
                this.status.translations = data.translations || {};
            } else {
                throw new Error('无法加载翻译文件');
            }
        } catch (error) {
            console.error('加载基础翻译失败:', error);
            this.loadDefaultTranslations();
        }
    },
    
    // 加载默认翻译
    loadDefaultTranslations() {
        this.status.translations = {
            'zh-CN': {
                app: {
                    title: 'GoldWord — 每一个记住的单词，都是一枚金币'
                },
                buttons: {
                    autoPlay: '▶️ 自动播放',
                    flipCard: '🔁 翻转卡片',
                    remember: '记得',
                    speakWord: '读单词',
                    personalCenter: '个人中心'
                }
            }
        };
    },
    
    // 缓存翻译数据
    cacheTranslations() {
        const data = {
            version: this.config.version,
            translations: this.status.translations,
            timestamp: Date.now()
        };
        localStorage.setItem(this.config.cacheKeys.translations, JSON.stringify(data));
    },
    
    // 应用语言设置
    applyLanguageSettings() {
        // 设置HTML lang属性
        document.documentElement.lang = this.status.currentLanguage;
        
        // 处理RTL语言
        if (this.config.rtlLanguages.includes(this.status.currentLanguage)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
    },
    
    // 更新页面标题
    updatePageTitle() {
        const title = this.t('app.title', 'GoldWord');
        document.title = title;
    },
    
    // 更新按钮文本
    updateButtonTexts() {
        const buttonMappings = {
            'autoPlayBtn': 'buttons.autoPlay',
            'flip-button': 'buttons.flipCard',
            'correctBtn': 'buttons.remember',
            'speak-button': 'buttons.speakWord',
            'dontRememberBtn': 'buttons.dontRemember',
            'addNewWordBtn': 'buttons.addNewWord',
            'openAuthPageMainBtn': 'buttons.personalCenter'
        };
        
        Object.entries(buttonMappings).forEach(([selector, key]) => {
            const elements = document.querySelectorAll(`.${selector}, #${selector}`);
            elements.forEach(element => {
                const translation = this.t(key);
                this.updateElementText(element, translation);
            });
        });
    },
    
    // 更新元素文本（保留emoji）
    updateElementText(element, newText) {
        const currentText = element.textContent || element.innerText;
        const emojiMatch = currentText.match(/^[▶️🔁👍👎👤📊🔁📅🧪]\s*/);
        
        if (emojiMatch) {
            element.innerHTML = emojiMatch[0] + ' ' + newText.replace(/^[▶️🔁👍👎👤📊🔁📅🧪]\s*/, '');
        } else {
            element.textContent = newText;
        }
    },
    
    // 更新选择器选项
    updateSelectOptions() {
        const selectMappings = {
            'learnMode': {
                'en1': 'learning.mode.en1',
                'en1zh1': 'learning.mode.en1zh1',
                'en2': 'learning.mode.en2',
                'en2zh1': 'learning.mode.en2zh1'
            },
            'accent': {
                'en-US': 'learning.accent.en-US',
                'en-GB': 'learning.accent.en-GB'
            },
            'accentZh': {
                'zh-CN': 'learning.chineseAccent.zh-CN',
                'zh-TW': 'learning.chineseAccent.zh-TW',
                'zh': 'learning.chineseAccent.zh'
            }
        };
        
        Object.entries(selectMappings).forEach(([selectId, options]) => {
            const select = document.getElementById(selectId);
            if (select) {
                Object.entries(options).forEach(([value, key]) => {
                    const option = select.querySelector(`option[value="${value}"]`);
                    if (option) {
                        option.textContent = this.t(key);
                    }
                });
            }
        });
    },
    
    // 更新统计信息
    updateStatsTexts() {
        const statsMappings = {
            'currentUserPrefix': 'stats.currentUser',
            'totalWordsPrefix': 'stats.totalWords',
            'reviewProgressPrefix': 'stats.reviewProgress',
            'todayStudyPrefix': 'stats.todayStudy',
            'strictCoveragePrefix': 'stats.strictCoverage'
        };
        
        Object.entries(statsMappings).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = this.t(key);
            }
        });
    },
    
    // 更新设置界面
    updateSettingsUI() {
        // 这里可以添加设置界面的多语言支持
        // 由于设置界面比较复杂，可以逐步添加
    },
    
    // 创建语言选择器
    createLanguageSelector() {
        // 在设置面板中添加语言选择器
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            // 查找合适的位置插入语言选择器
            const languageSection = this.createLanguageSection();
            settingsPanel.querySelector('.translation-panel-content').appendChild(languageSection);
        }
    },
    
    // 创建语言区域
    createLanguageSection() {
        const section = document.createElement('div');
        section.className = 'translation-section';
        section.innerHTML = `
            <h4>${this.t('settings.language', '界面语言')}</h4>
            <div class="language-controls">
                <select id="languageSelector" class="language-select">
                    ${this.config.supportedLanguages.map(lang => {
                        const langInfo = this.getLanguageInfo(lang);
                        return `<option value="${lang}" ${lang === this.status.currentLanguage ? 'selected' : ''}>
                            ${langInfo.flag} ${langInfo.name}
                        </option>`;
                    }).join('')}
                </select>
                <button id="openTranslationPanel" class="translate-btn">
                    ${this.t('buttons.translate', '翻译设置')}
                </button>
            </div>
        `;
        
        // 绑定事件
        const languageSelector = section.querySelector('#languageSelector');
        const openTranslationPanel = section.querySelector('#openTranslationPanel');
        
        languageSelector.addEventListener('change', async (e) => {
            await this.setLanguage(e.target.value);
        });
        
        openTranslationPanel.addEventListener('click', () => {
            this.showTranslationPanel();
        });
        
        return section;
    },
    
    // 获取语言信息
    getLanguageInfo(language) {
        const languageInfo = {
            'zh-CN': { name: '简体中文', flag: '🇨🇳' },
            'zh-TW': { name: '繁體中文', flag: '🇭🇰' },
            'en-US': { name: 'English (US)', flag: '🇺🇸' },
            'en-GB': { name: 'English (UK)', flag: '🇬🇧' },
            'th': { name: 'ภาษาไทย', flag: '🇹🇭' },
            'ja': { name: '日本語', flag: '🇯🇵' },
            'es': { name: 'Español', flag: '🇪🇸' },
            'fr': { name: 'Français', flag: '🇫🇷' },
            'de': { name: 'Deutsch', flag: '🇩🇪' },
            'ko': { name: '한국어', flag: '🇰🇷' },
            'ar': { name: 'العربية', flag: '🇸🇦' },
            'ru': { name: 'Русский', flag: '🇷🇺' }
        };
        
        return languageInfo[language] || { name: language, flag: '🏳️' };
    },
    
    // 创建翻译面板
    createTranslationPanel() {
        // 翻译面板将在需要时动态创建
    },
    
    // 显示翻译面板
    showTranslationPanel() {
        if (window.LanguageUI && window.LanguageUI.showTranslationPanel) {
            window.LanguageUI.showTranslationPanel();
        } else {
            console.error('翻译面板UI未加载');
        }
    },
    
    // 添加语言切换功能
    async addLanguageSwitching() {
        // 监听语言切换事件
        document.addEventListener('languageChanged', (event) => {
            console.log(`语言已切换为: ${event.detail.language}`);
            this.refactorExistingUI();
        });
    },
    
    // 设置事件监听器
    setupEventListeners() {
        // 监听系统事件
        window.addEventListener('beforeunload', () => {
            this.saveTranslationCache();
            this.saveTranslationHistory();
        });
        
        // 监听存储事件（用于多标签页同步）
        window.addEventListener('storage', (event) => {
            if (event.key === this.config.cacheKeys.language) {
                const newLanguage = event.newValue;
                if (newLanguage && newLanguage !== this.status.currentLanguage) {
                    this.setLanguage(newLanguage);
                }
            }
        });
    },
    
    // 翻译函数
    t(key, fallback = '') {
        try {
            const keys = key.split('.');
            let value = this.status.translations[this.status.currentLanguage];
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return fallback || key;
                }
            }
            
            return value || fallback || key;
        } catch (error) {
            console.error('翻译错误:', error);
            return fallback || key;
        }
    },
    
    // 切换语言
    async setLanguage(language) {
        if (!this.config.supportedLanguages.includes(language)) {
            console.error(`不支持的语言: ${language}`);
            return false;
        }
        
        try {
            this.status.currentLanguage = language;
            localStorage.setItem(this.config.cacheKeys.language, language);
            
            // 应用语言设置
            this.applyLanguageSettings();
            
            // 重构界面
            await this.refactorExistingUI();
            
            // 触发自定义事件
            this.dispatchLanguageChangeEvent(language);
            
            console.log(`✅ 语言已切换为: ${language}`);
            return true;
            
        } catch (error) {
            console.error('切换语言失败:', error);
            return false;
        }
    },
    
    // 触发自定义事件
    dispatchLanguageChangeEvent(language) {
        const event = new CustomEvent('languageChanged', {
            detail: { language: language }
        });
        document.dispatchEvent(event);
    },
    
    // 加载翻译缓存
    loadTranslationCache() {
        try {
            const cached = localStorage.getItem(this.config.cacheKeys.translationCache);
            if (cached) {
                this.status.translationCache = JSON.parse(cached);
            }
        } catch (error) {
            console.error('加载翻译缓存失败:', error);
            this.status.translationCache = {};
        }
    },
    
    // 加载翻译历史
    loadTranslationHistory() {
        try {
            const history = localStorage.getItem(this.config.cacheKeys.translationHistory);
            if (history) {
                this.status.translationHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('加载翻译历史失败:', error);
            this.status.translationHistory = [];
        }
    },
    
    // 保存翻译缓存
    saveTranslationCache() {
        try {
            localStorage.setItem(this.config.cacheKeys.translationCache, JSON.stringify(this.status.translationCache));
        } catch (error) {
            console.error('保存翻译缓存失败:', error);
        }
    },
    
    // 保存翻译历史
    saveTranslationHistory() {
        try {
            localStorage.setItem(this.config.cacheKeys.translationHistory, JSON.stringify(this.status.translationHistory));
        } catch (error) {
            console.error('保存翻译历史失败:', error);
        }
    },
    
    // 获取系统状态
    getSystemStatus() {
        return {
            initialized: this.status.initialized,
            currentLanguage: this.status.currentLanguage,
            supportedLanguages: this.config.supportedLanguages.length,
            translationKeys: this.countTranslationKeys(this.status.translations[this.status.currentLanguage] || {}),
            cacheSize: Object.keys(this.status.translationCache).length,
            historySize: this.status.translationHistory.length,
            version: this.config.version
        };
    },
    
    // 计算翻译键数量
    countTranslationKeys(obj, count = 0) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                count = this.countTranslationKeys(obj[key], count);
            } else {
                count++;
            }
        }
        return count;
    },
    
    // 导出系统数据
    exportSystemData() {
        const data = {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            status: this.status,
            config: this.config,
            stats: this.getSystemStatus()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goldword_language_system_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // 显示系统信息
    showSystemInfo() {
        const status = this.getSystemStatus();
        const info = `
🌍 GoldWord多语言系统信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
版本: ${status.version}
初始化: ${status.initialized ? '✅' : '❌'}
当前语言: ${status.currentLanguage}
支持语言: ${status.supportedLanguages}种
翻译键数: ${status.translationKeys}
缓存大小: ${status.cacheSize}
历史记录: ${status.historySize}
        `;
        
        console.log(info);
        return status;
    }
};

// 全局翻译函数
window.t = function(key, fallback = '') {
    return LanguageSystem.t(key, fallback);
};

// 初始化系统
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await LanguageSystem.init();
        console.log('🎉 GoldWord多语言国际化系统已就绪！');
        
        // 显示系统信息
        LanguageSystem.showSystemInfo();
        
    } catch (error) {
        console.error('❌ 多语言系统启动失败:', error);
    }
});

// 导出到全局
window.LanguageSystem = LanguageSystem;