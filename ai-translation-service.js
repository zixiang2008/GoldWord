/**
 * GoldWord AI 翻译服务
 * AI Translation Service
 * 
 * 功能：
 * - 一键翻译所有界面元素
 * - 支持批量翻译
 * - 翻译质量优化
 * - 翻译缓存
 * - 翻译历史记录
 */

const AITranslationService = {
    // 翻译缓存
    translationCache: {},
    
    // 翻译历史
    translationHistory: [],
    
    // 配置
    config: {
        maxCacheSize: 1000,
        maxHistorySize: 100,
        batchSize: 10,
        delayBetweenBatches: 1000,
        retryAttempts: 3,
        retryDelay: 2000
    },
    
    // 初始化
    init() {
        this.loadCache();
        this.loadHistory();
        console.log('AI翻译服务已初始化');
    },
    
    // 获取需要翻译的界面元素
    getTranslatableElements() {
        const elements = [];
        
        // 按钮文本
        const buttons = [
            { selector: '#autoPlayBtn', key: 'buttons.autoPlay', type: 'button' },
            { selector: '.flip-button', key: 'buttons.flipCard', type: 'button' },
            { selector: '#correctBtn', key: 'buttons.remember', type: 'button' },
            { selector: '.speak-button', key: 'buttons.speakWord', type: 'button' },
            { selector: '#dontRememberBtn', key: 'buttons.dontRemember', type: 'button' },
            { selector: '#addNewWordBtn', key: 'buttons.addNewWord', type: 'button' },
            { selector: '#openAuthPageMainBtn', key: 'buttons.personalCenter', type: 'button' },
            { selector: '#gptSaveBtn', key: 'buttons.saveSettings', type: 'button' },
            { selector: '#gptTestBtn', key: 'buttons.testSettings', type: 'button' },
            { selector: '#importJsonBtn', key: 'buttons.import', type: 'button' },
            { selector: '#exportJsonBtn', key: 'buttons.export', type: 'button' },
            { selector: '#clearDataBtn', key: 'buttons.clearData', type: 'button' },
            { selector: '#restoreOriginalBtn', key: 'buttons.restoreOriginal', type: 'button' },
            { selector: '#ttsTestBtn', key: 'buttons.voiceTest', type: 'button' },
            { selector: '#downloadTemplateBtn', key: 'buttons.downloadTemplate', type: 'button' },
            { selector: '#gptExtractBtn', key: 'buttons.extractWords', type: 'button' }
        ];
        
        // 选择器选项
        const selectOptions = [
            { selector: '#learnMode option[value="en1"]', key: 'learning.mode.en1', type: 'option' },
            { selector: '#learnMode option[value="en1zh1"]', key: 'learning.mode.en1zh1', type: 'option' },
            { selector: '#learnMode option[value="en2"]', key: 'learning.mode.en2', type: 'option' },
            { selector: '#learnMode option[value="en2zh1"]', key: 'learning.mode.en2zh1', type: 'option' },
            { selector: '#accent option[value="en-US"]', key: 'learning.accent.en-US', type: 'option' },
            { selector: '#accent option[value="en-GB"]', key: 'learning.accent.en-GB', type: 'option' },
            { selector: '#accentZh option[value="zh-CN"]', key: 'learning.chineseAccent.zh-CN', type: 'option' },
            { selector: '#accentZh option[value="zh-TW"]', key: 'learning.chineseAccent.zh-TW', type: 'option' },
            { selector: '#accentZh option[value="zh"]', key: 'learning.chineseAccent.zh', type: 'option' }
        ];
        
        // 统计信息
        const stats = [
            { selector: '#currentUserPrefix', key: 'stats.currentUser', type: 'stat' },
            { selector: '#totalWordsPrefix', key: 'stats.totalWords', type: 'stat' },
            { selector: '#reviewProgressPrefix', key: 'stats.reviewProgress', type: 'stat' },
            { selector: '#todayStudyPrefix', key: 'stats.todayStudy', type: 'stat' },
            { selector: '#strictCoveragePrefix', key: 'stats.strictCoverage', type: 'stat' }
        ];
        
        // 设置界面
        const settings = [
            { selector: '#settingsPanel h3', key: 'settings.title', type: 'setting' },
            { selector: '#userInfoSection > div', key: 'settings.userInfo', type: 'setting' },
            { selector: '#userInfoSection > div:nth-child(2)', key: 'settings.username', type: 'setting' },
            { selector: '#userInfoSection > div > div > div:nth-child(1)', key: 'settings.study30Days', type: 'setting' },
            { selector: '#userInfoSection > div > div > div:nth-child(2)', key: 'settings.study24Hours', type: 'setting' },
            { selector: '#userInfoSection > div > div > div:nth-child(3)', key: 'settings.totalProgress', type: 'setting' },
            { selector: '#userInfoSection > div > div > div:nth-child(4)', key: 'settings.todayTarget', type: 'setting' },
            { selector: '#adminPanelSection > div:nth-child(1)', key: 'settings.adminPanel', type: 'setting' },
            { selector: '#adminPanelSection > div:nth-child(2)', key: 'settings.adminDescription', type: 'setting' },
            { selector: '#importFileHeader', key: 'settings.importFile', type: 'setting' },
            { selector: '#importHeader', key: 'settings.importJson', type: 'setting' },
            { selector: '#voiceTestHeader', key: 'settings.voiceTest', type: 'setting' },
            { selector: '#settingsPanel div:nth-child(18) > div:nth-child(1)', key: 'settings.gptService', type: 'setting' },
            { selector: '#settingsPanel label[for="gptModelSelect"]', key: 'settings.selectModel', type: 'setting' }
        ];
        
        // 认证界面
        const auth = [
            { selector: '#authHeader', key: 'auth.title', type: 'auth' },
            { selector: '#authUserId', key: 'auth.userId', type: 'input' },
            { selector: '#authUserName', key: 'auth.displayName', type: 'input' },
            { selector: '#authPin', key: 'auth.pin', type: 'input' },
            { selector: '#authPinConfirm', key: 'auth.confirmPin', type: 'input' },
            { selector: '#authRegisterBtn', key: 'auth.register', type: 'button' },
            { selector: '#authLoginBtn', key: 'auth.login', type: 'button' },
            { selector: '#authLogoutBtn', key: 'auth.logout', type: 'button' }
        ];
        
        elements.push(...buttons, ...selectOptions, ...stats, ...settings, ...auth);
        
        return elements;
    },
    
    // 一键翻译所有界面
    async translateAllUIElements(targetLanguage, progressCallback = null) {
        try {
            console.log(`开始翻译界面到 ${targetLanguage}`);
            
            const elements = this.getTranslatableElements();
            const totalElements = elements.length;
            let processedElements = 0;
            
            // 分批处理
            const batches = this.createBatches(elements, this.config.batchSize);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                
                if (progressCallback) {
                    progressCallback({
                        current: processedElements,
                        total: totalElements,
                        percentage: Math.round((processedElements / totalElements) * 100),
                        message: `正在翻译第 ${i + 1}/${batches.length} 批...`
                    });
                }
                
                // 获取原文
                const sourceTexts = batch.map(element => {
                    const el = document.querySelector(element.selector);
                    return el ? (el.textContent || el.placeholder || el.innerText || '') : '';
                }).filter(text => text.trim());
                
                if (sourceTexts.length === 0) {
                    processedElements += batch.length;
                    continue;
                }
                
                // 翻译
                const translatedTexts = await this.translateBatch(sourceTexts, targetLanguage);
                
                // 应用翻译
                batch.forEach((element, index) => {
                    if (translatedTexts[index]) {
                        this.applyTranslation(element, translatedTexts[index]);
                    }
                });
                
                processedElements += batch.length;
                
                // 批次间延迟
                if (i < batches.length - 1) {
                    await this.delay(this.config.delayBetweenBatches);
                }
            }
            
            if (progressCallback) {
                progressCallback({
                    current: totalElements,
                    total: totalElements,
                    percentage: 100,
                    message: '翻译完成！'
                });
            }
            
            console.log('界面翻译完成');
            return true;
            
        } catch (error) {
            console.error('界面翻译失败:', error);
            if (progressCallback) {
                progressCallback({
                    error: error.message,
                    message: '翻译失败: ' + error.message
                });
            }
            return false;
        }
    },
    
    // 批量翻译
    async translateBatch(texts, targetLanguage) {
        const cacheKey = `${targetLanguage}_${this.hashTexts(texts)}`;
        
        // 检查缓存
        if (this.translationCache[cacheKey]) {
            return this.translationCache[cacheKey];
        }
        
        let attempts = 0;
        let lastError;
        
        while (attempts < this.config.retryAttempts) {
            try {
                const result = await this.callTranslationAPI(texts, targetLanguage);
                
                // 缓存结果
                this.cacheTranslation(cacheKey, result);
                
                // 记录历史
                this.recordTranslationHistory(texts, result, targetLanguage);
                
                return result;
                
            } catch (error) {
                lastError = error;
                attempts++;
                
                if (attempts < this.config.retryAttempts) {
                    console.warn(`翻译失败，${this.config.retryDelay/1000}秒后重试 (尝试 ${attempts}/${this.config.retryAttempts})`);
                    await this.delay(this.config.retryDelay);
                }
            }
        }
        
        throw lastError;
    },
    
    // 调用翻译API
    async callTranslationAPI(texts, targetLanguage) {
        // 使用LanguageManager的AI翻译功能
        if (window.LanguageManager) {
            return await window.LanguageManager.batchTranslateWithAI(texts, targetLanguage);
        }
        
        // Fallback: 使用Google Translate API (需要API key)
        // 这里可以实现其他翻译API
        throw new Error('翻译服务未配置');
    },
    
    // 应用翻译
    applyTranslation(element, translatedText) {
        try {
            const el = document.querySelector(element.selector);
            if (!el) return;
            
            switch (element.type) {
                case 'button':
                    // 保留emoji图标
                    const emojiMatch = el.textContent.match(/^[▶️🔁👍👎👤📊🔁📅🧪]\s*/);
                    if (emojiMatch) {
                        el.innerHTML = emojiMatch[0] + translatedText;
                    } else {
                        el.textContent = translatedText;
                    }
                    break;
                    
                case 'option':
                    el.textContent = translatedText;
                    break;
                    
                case 'input':
                    el.placeholder = translatedText;
                    break;
                    
                case 'stat':
                case 'setting':
                case 'auth':
                    el.textContent = translatedText;
                    break;
                    
                default:
                    el.textContent = translatedText;
            }
            
            // 添加翻译标记
            el.setAttribute('data-translated', 'true');
            el.setAttribute('data-translation-key', element.key);
            
        } catch (error) {
            console.error(`应用翻译失败 ${element.selector}:`, error);
        }
    },
    
    // 创建批次
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    },
    
    // 缓存翻译
    cacheTranslation(key, translation) {
        this.translationCache[key] = translation;
        
        // 限制缓存大小
        const cacheKeys = Object.keys(this.translationCache);
        if (cacheKeys.length > this.config.maxCacheSize) {
            const oldestKey = cacheKeys[0];
            delete this.translationCache[oldestKey];
        }
        
        this.saveCache();
    },
    
    // 记录翻译历史
    recordTranslationHistory(source, translated, targetLanguage) {
        const record = {
            timestamp: Date.now(),
            sourceLanguage: 'auto',
            targetLanguage: targetLanguage,
            source: Array.isArray(source) ? source : [source],
            translated: Array.isArray(translated) ? translated : [translated],
            characterCount: JSON.stringify(source).length
        };
        
        this.translationHistory.unshift(record);
        
        // 限制历史记录大小
        if (this.translationHistory.length > this.config.maxHistorySize) {
            this.translationHistory = this.translationHistory.slice(0, this.config.maxHistorySize);
        }
        
        this.saveHistory();
    },
    
    // 加载缓存
    loadCache() {
        try {
            const cached = localStorage.getItem('goldword_translation_cache');
            if (cached) {
                this.translationCache = JSON.parse(cached);
            }
        } catch (error) {
            console.error('加载翻译缓存失败:', error);
            this.translationCache = {};
        }
    },
    
    // 保存缓存
    saveCache() {
        try {
            localStorage.setItem('goldword_translation_cache', JSON.stringify(this.translationCache));
        } catch (error) {
            console.error('保存翻译缓存失败:', error);
        }
    },
    
    // 加载历史
    loadHistory() {
        try {
            const history = localStorage.getItem('goldword_translation_history');
            if (history) {
                this.translationHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('加载翻译历史失败:', error);
            this.translationHistory = [];
        }
    },
    
    // 保存历史
    saveHistory() {
        try {
            localStorage.setItem('goldword_translation_history', JSON.stringify(this.translationHistory));
        } catch (error) {
            console.error('保存翻译历史失败:', error);
        }
    },
    
    // 获取翻译统计
    getTranslationStats() {
        const totalTranslations = this.translationHistory.length;
        const totalCharacters = this.translationHistory.reduce((sum, record) => sum + record.characterCount, 0);
        const cacheHits = Object.keys(this.translationCache).length;
        
        return {
            totalTranslations,
            totalCharacters,
            cacheHits,
            lastTranslation: this.translationHistory[0] || null,
            averageCharacters: totalTranslations > 0 ? Math.round(totalCharacters / totalTranslations) : 0
        };
    },
    
    // 清除缓存和历史
    clearData() {
        this.translationCache = {};
        this.translationHistory = [];
        this.saveCache();
        this.saveHistory();
        console.log('翻译缓存和历史已清除');
    },
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 文本哈希
    hashTexts(texts) {
        return btoa(JSON.stringify(texts)).slice(0, 32);
    },
    
    // 导出翻译数据
    exportTranslationData() {
        const data = {
            cache: this.translationCache,
            history: this.translationHistory,
            timestamp: new Date().toISOString(),
            stats: this.getTranslationStats()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goldword_translation_data_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// 初始化AI翻译服务
document.addEventListener('DOMContentLoaded', function() {
    AITranslationService.init();
    window.AITranslationService = AITranslationService;
});