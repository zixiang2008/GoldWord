/**
 * GoldWord 多语言国际化系统
 * Language Manager - 语言管理器
 * 
 * 功能：
 * - 多语言翻译管理
 * - AI翻译集成
 * - 语言切换
 * - 动态文本替换
 * - 缓存机制
 */

const LanguageManager = {
    // 当前语言
    currentLanguage: 'zh-CN',
    
    // 语言配置
    config: {
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN', 'zh-TW', 'en-US', 'en-GB', 'th', 'ja', 'es', 'fr', 'de', 'ko', 'ar', 'ru'],
        rtlLanguages: ['ar'],
        cacheKey: 'goldword_language_data',
        userLanguageKey: 'goldword_user_language'
    },
    
    // 翻译数据缓存
    translations: {},
    
    // 初始化语言系统
    async init() {
        try {
            // 加载用户选择的语言
            const savedLanguage = localStorage.getItem(this.config.userLanguageKey);
            if (savedLanguage && this.config.supportedLanguages.includes(savedLanguage)) {
                this.currentLanguage = savedLanguage;
            } else {
                // 检测浏览器语言
                const browserLang = navigator.language || navigator.userLanguage;
                this.currentLanguage = this.detectLanguage(browserLang);
            }
            
            // 加载翻译数据
            await this.loadTranslations();
            
            // 应用语言设置
            this.applyLanguageSettings();
            
            console.log(`语言系统初始化完成，当前语言: ${this.currentLanguage}`);
            return true;
        } catch (error) {
            console.error('语言系统初始化失败:', error);
            return false;
        }
    },
    
    // 检测语言
    detectLanguage(browserLang) {
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
            const cachedData = localStorage.getItem(this.config.cacheKey);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                if (data.version === this.getDataVersion()) {
                    this.translations = data.translations;
                    return;
                }
            }
            
            // 从服务器加载基础翻译数据
            await this.loadBaseTranslations();
            
            // 缓存数据
            this.cacheTranslations();
            
        } catch (error) {
            console.error('加载翻译数据失败:', error);
            // 使用默认翻译
            this.loadDefaultTranslations();
        }
    },
    
    // 加载基础翻译数据
    async loadBaseTranslations() {
        try {
            const response = await fetch('language-system.json');
            if (response.ok) {
                const data = await response.json();
                this.translations = data.translations || {};
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
        // 这里可以包含最基础的翻译数据作为fallback
        this.translations = {
            'zh-CN': {
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
    
    // 获取数据版本
    getDataVersion() {
        return '1.0.0';
    },
    
    // 缓存翻译数据
    cacheTranslations() {
        const data = {
            version: this.getDataVersion(),
            translations: this.translations,
            timestamp: Date.now()
        };
        localStorage.setItem(this.config.cacheKey, JSON.stringify(data));
    },
    
    // 获取翻译
    t(key, fallback = '') {
        try {
            const keys = key.split('.');
            let value = this.translations[this.currentLanguage];
            
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
            this.currentLanguage = language;
            localStorage.setItem(this.config.userLanguageKey, language);
            
            // 重新加载翻译数据
            await this.loadTranslations();
            
            // 应用语言设置
            this.applyLanguageSettings();
            
            // 触发自定义事件
            this.dispatchLanguageChangeEvent(language);
            
            console.log(`语言已切换为: ${language}`);
            return true;
        } catch (error) {
            console.error('切换语言失败:', error);
            return false;
        }
    },
    
    // 应用语言设置
    applyLanguageSettings() {
        // 设置HTML lang属性
        document.documentElement.lang = this.currentLanguage;
        
        // 处理RTL语言
        if (this.config.rtlLanguages.includes(this.currentLanguage)) {
            document.documentElement.dir = 'rtl';
        } else {
            document.documentElement.dir = 'ltr';
        }
        
        // 更新页面标题
        this.updatePageTitle();
        
        // 更新所有翻译元素
        this.updateAllTranslations();
    },
    
    // 更新页面标题
    updatePageTitle() {
        const title = this.t('app.title', 'GoldWord');
        document.title = title;
    },
    
    // 更新所有翻译元素
    updateAllTranslations() {
        // 更新所有带有 data-i18n 属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // 更新按钮文本
        this.updateButtonTexts();
        
        // 更新选择器选项
        this.updateSelectOptions();
        
        // 更新统计信息
        this.updateStatsTexts();
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
                // 保留emoji图标，只替换文本部分
                const currentText = element.textContent || element.innerText;
                const emojiMatch = currentText.match(/^[▶️🔁👍👎👤📊🔁📅🧪]/);
                if (emojiMatch) {
                    element.innerHTML = emojiMatch[0] + ' ' + translation.replace(/^[▶️🔁👍👎👤📊🔁📅🧪]\s*/, '');
                } else {
                    element.textContent = translation;
                }
            });
        });
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
    
    // 触发自定义事件
    dispatchLanguageChangeEvent(language) {
        const event = new CustomEvent('languageChanged', {
            detail: { language: language }
        });
        document.dispatchEvent(event);
    },
    
    // 获取当前语言信息
    getCurrentLanguageInfo() {
        const languageData = this.config.languages[this.currentLanguage] || {};
        return {
            code: this.currentLanguage,
            name: languageData.name || this.currentLanguage,
            flag: languageData.flag || '🏳️',
            rtl: languageData.rtl || false
        };
    },
    
    // 获取支持的语言列表
    getSupportedLanguages() {
        return this.config.supportedLanguages.map(lang => ({
            code: lang,
            ...this.config.languages[lang]
        }));
    },
    
    // AI翻译集成
    async translateWithAI(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            // 获取GPT配置
            const gptConfig = this.getGPTConfig();
            if (!gptConfig || !gptConfig.apiKey) {
                throw new Error('GPT配置未设置');
            }
            
            const prompt = this.generateTranslationPrompt(text, targetLanguage, sourceLanguage);
            
            const response = await fetch(gptConfig.baseUrl + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gptConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: gptConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的翻译助手，请准确翻译给定的文本，只返回翻译结果，不要有任何解释或说明。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 1000
                })
            });
            
            if (!response.ok) {
                throw new Error(`翻译请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('AI翻译失败:', error);
            throw error;
        }
    },
    
    // 生成翻译提示
    generateTranslationPrompt(text, targetLanguage, sourceLanguage) {
        const languageNames = {
            'zh-CN': '简体中文',
            'zh-TW': '繁體中文',
            'en-US': '美式英语',
            'en-GB': '英式英语',
            'th': '泰语',
            'ja': '日语',
            'es': '西班牙语',
            'fr': '法语',
            'de': '德语',
            'ko': '韩语',
            'ar': '阿拉伯语',
            'ru': '俄语'
        };
        
        const targetLangName = languageNames[targetLanguage] || targetLanguage;
        let prompt = `请将以下文本翻译成${targetLangName}：`;
        
        if (sourceLanguage !== 'auto') {
            const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
            prompt = `请将以下从${sourceLangName}翻译成${targetLangName}：`;
        }
        
        return `${prompt}\n\n${text}`;
    },
    
    // 获取GPT配置
    getGPTConfig() {
        try {
            const configStr = localStorage.getItem('gpt_config__' + (window.currentUserId || 'default'));
            return configStr ? JSON.parse(configStr) : null;
        } catch (error) {
            console.error('获取GPT配置失败:', error);
            return null;
        }
    },
    
    // 批量翻译界面元素
    async batchTranslateUIElements(elements, targetLanguage) {
        const results = {};
        const batchSize = 10; // 每批翻译10个元素
        
        for (let i = 0; i < elements.length; i += batchSize) {
            const batch = elements.slice(i, i + batchSize);
            const textsToTranslate = batch.map(el => el.text || el.content || '');
            
            try {
                // 使用AI批量翻译
                const translatedTexts = await this.batchTranslateWithAI(textsToTranslate, targetLanguage);
                
                batch.forEach((element, index) => {
                    results[element.key] = translatedTexts[index] || textsToTranslate[index];
                });
                
                // 添加延迟避免API限制
                await this.delay(1000);
                
            } catch (error) {
                console.error(`批量翻译失败 (批次 ${Math.floor(i/batchSize) + 1}):`, error);
                // 使用原文作为fallback
                batch.forEach((element, index) => {
                    results[element.key] = textsToTranslate[index];
                });
            }
        }
        
        return results;
    },
    
    // 批量AI翻译
    async batchTranslateWithAI(texts, targetLanguage) {
        const gptConfig = this.getGPTConfig();
        if (!gptConfig || !gptConfig.apiKey) {
            throw new Error('GPT配置未设置');
        }
        
        const response = await fetch(gptConfig.baseUrl + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gptConfig.apiKey}`
            },
            body: JSON.stringify({
                model: gptConfig.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的翻译助手。请将以下文本数组翻译成指定语言，返回一个JSON数组，只包含翻译结果，不要有任何解释。'
                    },
                    {
                        role: 'user',
                        content: `目标语言: ${targetLanguage}\n文本数组: ${JSON.stringify(texts)}`
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });
        
        if (!response.ok) {
            throw new Error(`批量翻译请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        try {
            return JSON.parse(content);
        } catch (error) {
            // 如果返回的不是JSON，尝试按行分割
            return content.split('\n').map(line => line.trim()).filter(line => line);
        }
    },
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 获取语言统计信息
    getLanguageStats() {
        const totalKeys = this.countTranslationKeys(this.translations[this.currentLanguage] || {});
        return {
            currentLanguage: this.currentLanguage,
            totalKeys: totalKeys,
            lastUpdated: localStorage.getItem(this.config.cacheKey + '_timestamp') || '未知',
            cacheSize: this.getCacheSize()
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
    
    // 获取缓存大小
    getCacheSize() {
        try {
            const cacheData = localStorage.getItem(this.config.cacheKey);
            return cacheData ? (cacheData.length / 1024).toFixed(2) + ' KB' : '0 KB';
        } catch (error) {
            return '未知';
        }
    },
    
    // 清除缓存
    clearCache() {
        localStorage.removeItem(this.config.cacheKey);
        localStorage.removeItem(this.config.cacheKey + '_timestamp');
        console.log('语言缓存已清除');
    },
    
    // 导出当前语言数据
    exportCurrentLanguage() {
        const data = {
            language: this.currentLanguage,
            translations: this.translations[this.currentLanguage] || {},
            timestamp: new Date().toISOString(),
            version: this.getDataVersion()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goldword_language_${this.currentLanguage}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // 导入语言数据
    async importLanguageData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.language || !data.translations) {
                throw new Error('无效的语言文件格式');
            }
            
            // 验证数据版本
            if (data.version && data.version !== this.getDataVersion()) {
                console.warn(`语言数据版本不匹配: ${data.version} vs ${this.getDataVersion()}`);
            }
            
            // 更新翻译数据
            this.translations[data.language] = data.translations;
            
            // 如果是当前语言，重新应用
            if (data.language === this.currentLanguage) {
                this.updateAllTranslations();
            }
            
            // 重新缓存
            this.cacheTranslations();
            
            console.log(`语言数据导入成功: ${data.language}`);
            return true;
            
        } catch (error) {
            console.error('导入语言数据失败:', error);
            throw error;
        }
    }
};

// 全局语言管理器实例
window.LanguageManager = LanguageManager;

// 简化的翻译函数（全局可用）
window.t = function(key, fallback = '') {
    return LanguageManager.t(key, fallback);
};

// 初始化语言系统
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await LanguageManager.init();
        console.log('GoldWord多语言系统已加载');
    } catch (error) {
        console.error('多语言系统加载失败:', error);
    }
});