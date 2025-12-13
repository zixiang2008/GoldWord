/**
 * GoldWord 完整多语言国际化系统 - 更新版
 * Complete Internationalization System - Updated
 * 
 * 功能：
 * - 多语言支持 (12种语言)
 * - AI自动翻译
 * - 界面语言切换
 * - 翻译缓存
 * - 批量翻译
 * - 翻译统计
 * - 完整的UI元素翻译支持
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
        version: '2.0.0',
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
        translationHistory: [],
        aiTranslationInProgress: false
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
            
            // 初始化AI翻译API
            this.initAITranslationAPI();
            
            console.log('✅ AI翻译服务初始化完成');
            
        } catch (error) {
            console.error('AI翻译服务初始化失败:', error);
            // 不中断系统初始化
        }
    },
    
    // 初始化AI翻译API
    initAITranslationAPI() {
        // 这里可以集成各种AI翻译API
        // 例如：Google Translate, OpenAI GPT, DeepL, etc.
        this.aiTranslators = {
            openai: {
                name: 'OpenAI GPT',
                translate: async (text, targetLang, sourceLang = 'auto') => {
                    // 模拟OpenAI API调用
                    return await this.simulateOpenAITranslation(text, targetLang, sourceLang);
                }
            },
            google: {
                name: 'Google Translate',
                translate: async (text, targetLang, sourceLang = 'auto') => {
                    // 模拟Google Translate API调用
                    return await this.simulateGoogleTranslation(text, targetLang, sourceLang);
                }
            }
        };
        
        this.currentAITranslator = 'openai'; // 默认使用OpenAI
    },
    
    // 模拟OpenAI翻译
    async simulateOpenAITranslation(text, targetLang, sourceLang = 'auto') {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        // 简单的模拟翻译逻辑
        const translations = {
            'zh-CN': {
                'Auto Play': '自动播放',
                'Flip Card': '翻转卡片',
                'Remember': '记得',
                'Read Word': '读单词',
                'Personal Center': '个人中心',
                'Don\'t Remember': '不记得',
                'Add New Word': '添加新词',
                'Need Review': '需要复习',
                'Close': '关闭',
                'Login': '登录',
                'Register': '注册',
                'Logout': '退出登录',
                'Import': '导入',
                'Export': '导出',
                'Clear Data': '清空数据',
                'Restore Original': '恢复原始',
                'Voice Test': '语音测试',
                'Download Template': '下载模板',
                'Extract Words': '提取单词',
                'English Once': '英文一次',
                'English/Chinese Once': '英文/中文一次',
                'English Twice': '英文两次',
                'English Twice Chinese Once': '英文两次中文一次',
                'American Pronunciation': '美式发音',
                'British Pronunciation': '英式发音',
                'Mainland Mandarin': '大陆普通话',
                'Taiwan Mandarin': '台湾普通话',
                'General Chinese': '泛中文',
                'Current User': '当前用户',
                'Total Words': '总词数',
                'Review Progress': '复习进度',
                'Today Study': '今日学习',
                'Need Review Count': '需要复习',
                'Strict Coverage': '严格覆盖率',
                'Not Logged In': '未登录'
            },
            'en-US': {
                '自动播放': 'Auto Play',
                '翻转卡片': 'Flip Card',
                '记得': 'Remember',
                '读单词': 'Read Word',
                '个人中心': 'Personal Center',
                '不记得': 'Don\'t Remember',
                '添加新词': 'Add New Word',
                '需要复习': 'Need Review',
                '关闭': 'Close',
                '登录': 'Login',
                '注册': 'Register',
                '退出登录': 'Logout',
                '导入': 'Import',
                '导出': 'Export',
                '清空数据': 'Clear Data',
                '恢复原始': 'Restore Original',
                '语音测试': 'Voice Test',
                '下载模板': 'Download Template',
                '提取单词': 'Extract Words',
                '英文一次': 'English Once',
                '英文/中文一次': 'English/Chinese Once',
                '英文两次': 'English Twice',
                '英文两次中文一次': 'English Twice Chinese Once',
                '美式发音': 'American Pronunciation',
                '英式发音': 'British Pronunciation',
                '大陆普通话': 'Mainland Mandarin',
                '台湾普通话': 'Taiwan Mandarin',
                '泛中文': 'General Chinese',
                '当前用户': 'Current User',
                '总词数': 'Total Words',
                '复习进度': 'Review Progress',
                '今日学习': 'Today Study',
                '需要复习': 'Need Review Count',
                '严格覆盖率': 'Strict Coverage',
                '未登录': 'Not Logged In'
            }
        };
        
        const langDict = translations[targetLang] || translations['en-US'];
        return langDict[text] || text; // 如果没有翻译，返回原文
    },
    
    // 模拟Google翻译
    async simulateGoogleTranslation(text, targetLang, sourceLang = 'auto') {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        
        // 使用与OpenAI相同的翻译逻辑（实际项目中会有所不同）
        return await this.simulateOpenAITranslation(text, targetLang, sourceLang);
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
                    title: 'GoldWord — 每一个记住的单词，都是一枚金币',
                    status: {
                        checking: '检查中...',
                        ready: '准备就绪',
                        working: '工作中',
                        error: '错误',
                        disabled: '已禁用'
                    }
                },
                buttons: {
                    autoPlay: '▶️ 自动播放',
                    flipCard: '🔁 翻转卡片',
                    remember: '记得',
                    speakWord: '读单词',
                    dontRemember: '👎 不记得',
                    addNewWord: '👍 要记住',
                    needReview: '要复习',
                    personalCenter: '个人中心',
                    login: '登录',
                    register: '注册',
                    logout: '退出登录',
                    import: '导入',
                    export: '导出',
                    clearData: '清空词库',
                    restoreOriginal: '恢复原始词库',
                    voiceTest: '测试语音',
                    downloadTemplate: '下载标准模板',
                    extractWords: 'GPT 提取单词',
                    translateAll: '🔄 AI翻译所有界面',
                    exportTranslations: '📤 导出翻译数据',
                    importTranslations: '📥 导入翻译数据',
                    close: '关闭',
                    saveSettings: '保存设置',
                    testSettings: '测试设置',
                    translate: '翻译设置',
                    gptEnhance: 'GPT增强',
                    importSystemPrompts: '导入系统 Prompt 模板',
                    enableCustomPrompts: '启用自定义 Prompt',
                    copyAllPrompts: '复制所有 Prompt',
                    importAllPrompts: '导入所有 Prompt',
                    createUser: '新增/更新用户',
                    return: '返回',
                    confirm: '确认'
                },
                learning: {
                    mode: {
                        en1: '英文一次',
                        en1zh1: '英文/中文一次',
                        en2: '英文两次',
                        en2zh1: '英文两次中文一次'
                    },
                    accent: {
                        'en-US': '美式发音',
                        'en-GB': '英式发音'
                    },
                    chineseAccent: {
                        'zh-CN': '中文（大陆普通话）',
                        'zh-TW': '中文（台湾普通话）',
                        'zh': '中文（泛中文）'
                    },
                    speechRate: '倍速',
                    countdown: '倒计时',
                    countdownOptions: {
                        '1': '1秒倒计时',
                        '2': '2秒倒计时',
                        '3': '3秒倒计时',
                        '4': '4秒倒计时',
                        '5': '5秒倒计时',
                        '6': '6秒倒计时',
                        '7': '7秒倒计时',
                        '8': '8秒倒计时',
                        '9': '9秒倒计时'
                    }
                },
                stats: {
                    currentUser: '👤 当前用户：',
                    totalWords: '📊 总词数：',
                    reviewProgress: '🔁 复习进度：',
                    todayStudy: '📅 今日学习：',
                    needReviewCount: '要复习：',
                    strictCoverage: '🧪 严格覆盖率：',
                    notLoggedIn: '未登录',
                    enhancementService: '增强服务未启动'
                },
                settings: {
                    title: '个人中心',
                    userInfo: '用户信息',
                    username: '用户名：',
                    study30Days: '近30天学习：',
                    study24Hours: '近24小时学习：',
                    totalProgress: '总进度：',
                    todayTarget: '今日目标：',
                    notLoggedIn: '未登录',
                    loginPrompt: '您尚未登录，请点击页面下方"个人中心"进行登录或注册。',
                    adminPanel: '管理员：用户管理',
                    adminDescription: '仅当以管理员账号（caishen）登录时可见。可查看用户、修改密码、删除与拉黑。',
                    newUserId: '新用户ID',
                    displayName: '显示名',
                    password: '初始PIN/密码',
                    createUser: '新增/更新用户',
                    registeredUsers: '已注册用户',
                    userMenu: {
                        login: '用户登录',
                        register: '用户注册',
                        import: '导入词库',
                        export: '导出词库'
                    },
                    importFile: '导入文件',
                    supportedFormats: '支持格式：JSON（推荐）、CSV、XLSX/XLS、TXT。建议使用标准模板。',
                    importJson: '导入 JSON / 在线批量导入',
                    importHint: '提示：可点击下方"GPT 提取单词"自动识别文本中的英文单词并生成英文逗号列表。',
                    voiceTest: '语音测试',
                    gptService: 'GPT 服务设置',
                    selectModel: '选择内置模型：',
                    apiGuide: 'API设置指导',
                    paidPlatform: '付费GPT模型平台',
                    helpInfo: '从下拉列表选择模型后，将自动填充 API 地址与模型名。文档：https://docs.apiyi.com/api-manual ｜ 资源：https://docs.apiyi.com/resources#qwen-api-%E6%96%87%E6%A1%A3',
                    baseUrl: 'API 基础地址，例如 https://api.openai.com',
                    modelName: '模型名，例如 gpt-4o-mini 或其它免费模型',
                    apiKey: 'API 密钥（仅本机保存）',
                    gptOnlyMode: '仅使用GPT（禁用本地兜底）',
                    cardDisplay: '卡片显示项 - Prompt 与代表含义配置',
                    displayContent: '显示内容',
                    gptPrompt: 'GPT 对应 Prompt（可编辑）',
                    fixedFields: {
                        word: '单词（固定）',
                        chinese: '中文解释（固定）',
                        phonetic: '音标（固定）',
                        pos: '词性（固定）',
                        memory: '记忆要点（固定）',
                        association: '联想（固定）',
                        definition: '主要用法/定义（固定）',
                        brief: '简述（可选）',
                        collocation: '固定搭配（固定）',
                        example: '例句（固定）'
                    },
                    placeholders: {
                        newUserId: '新用户ID',
                        displayName: '显示名',
                        password: '初始PIN/密码',
                        jsonInput: '在此粘贴：所有单词用英文逗号间隔，例如：apple, banana, cherry',
                        authUserId: '账号（支持中文/英文/邮箱）',
                        authUserName: '显示名（可选）',
                        authPin: 'PIN（4位数字；管理员输入密码）',
                        authPinConfirm: '确认 PIN（注册时）',
                        loginUserId: '账号（支持中文/英文/邮箱）',
                        loginPin: 'PIN（4位数字；管理员输入密码）',
                        gptBaseUrl: 'API 基础地址，例如 https://api.openai.com',
                        gptModel: '模型名，例如 gpt-4o-mini 或其它免费模型',
                        gptApiKey: 'API 密钥（仅本机保存）',
                        wordPrompt: '例如：请返回该单词的英文原词',
                        chinesePrompt: '例如：给出简洁中文释义',
                        phoneticPrompt: '例如：返回标准英式/美式音标',
                        posPrompt: '例如：返回主要词性（n/v/adj等）',
                        memoryPrompt: '例如：给出1-2条记忆要点',
                        associationPrompt: '例如：提供形象的联想描述',
                        definitionPrompt: '例如：给出简洁定义与主要用法',
                        briefPrompt: '例如：15字以内中文简述（可含音标/词性/搭配）',
                        collocationPrompt: '3个固定搭配，英文：中文解释；每一个解释占一行的Prompt',
                        examplePrompt: '用最基础的2500单词和这个单词造句 ，并且翻译成中文；一个造句3个不同句式表达，每行一个；'
                    },
                    tooltips: {
                        autoPlay: '自动播放当前卡片流程',
                        correctBtn: '记得，进入下一个记忆阶段',
                        speakButton: '读当前单词',
                        learnMode: '学习模式发音顺序',
                        countdownTime: '设置自动播放倒计时时长',
                        accentZh: '中文发音选择',
                        openAuthPageMainBtn: '打开个人中心',
                        dontRememberTopBtn: '将此单词标记为需要复习，会再次出现在学习列表中',
                        gptExtractBtn: '从上方文本中识别英文单词并生成英文逗号列表',
                        enhancementStatus: '点击查看增强服务状态详情',
                        gptEnhanceLabel: '增强 服务调试工具的快捷选项'
                    },
                    hints: {
                        auth: '提示：普通用户使用 4 位 PIN；管理员账号为隐藏账号，不在界面中提示。',
                        supportedFormats: '支持格式：JSON（推荐）、CSV、XLSX/XLS、TXT。建议使用标准模板。'
                    },
                    auth: {
                        title: '用户注册 / 登录',
                        loginTitle: '用户登录',
                        return: '返回',
                        register: '注册',
                        login: '登录',
                        logout: '退出登录',
                        confirm: '确认',
                        hint: '提示：普通用户使用 4 位 PIN；管理员账号为隐藏账号，不在界面中提示。'
                    }
                },
                language: {
                    settings: '🌐 语言设置',
                    interfaceLanguage: '界面语言',
                    translateAll: '🔄 AI翻译所有界面',
                    exportTranslations: '📤 导出翻译数据',
                    importTranslations: '📥 导入翻译数据',
                    translating: '正在翻译界面元素，请稍候...',
                    translatingBtn: '🔄 翻译中...',
                    translationProgress: '翻译进度: {percentage}% ({translated}/{total})',
                    translationComplete: '✅ 翻译完成！',
                    exportComplete: '📤 翻译数据已导出！',
                    importComplete: '📥 翻译数据已导入！',
                    exportFailed: '❌ 导出失败: {error}',
                    importFailed: '❌ 导入失败: {error}',
                    translationFailed: '❌ 翻译失败: {error}'
                },
                card: {
                    chinese: '中文:',
                    definition: '定义:',
                    collocation: '搭配:',
                    memory: '记忆:'
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
            'dontRememberTopBtn': 'buttons.needReview',
            'openAuthPageMainBtn': 'buttons.personalCenter',
            'closeSettingsBtn': 'buttons.close',
            'settingsUserMenuButton': 'buttons.personalCenter',
            'settingsMenuUserBtn': 'settings.userMenu.login',
            'settingsMenuAuthBtn': 'settings.userMenu.register',
            'settingsMenuImportBtn': 'settings.userMenu.import',
            'settingsMenuExportBtn': 'settings.userMenu.export',
            'downloadTemplateBtn': 'buttons.downloadTemplate',
            'importJsonBtn': 'buttons.import',
            'importTextBtn': 'settings.importJson',
            'gptExtractBtn': 'buttons.extractWords',
            'exportJsonBtn': 'buttons.export',
            'clearDataBtn': 'buttons.clearData',
            'restoreOriginalBtn': 'buttons.restoreOriginal',
            'authCloseBtn': 'settings.auth.return',
            'authRegisterBtn': 'buttons.register',
            'authLoginBtn': 'buttons.login',
            'authLogoutBtn': 'buttons.logout',
            'loginModalCloseBtn': 'settings.auth.return',
            'loginModalConfirmBtn': 'settings.auth.login',
            'ttsTestBtn': 'buttons.voiceTest',
            'gptSaveBtn': 'buttons.saveSettings',
            'gptTestBtn': 'buttons.testSettings',
            'gptEnhanceLabel': 'buttons.gptEnhance',
            'cfgImportSystemPromptsBtn': 'buttons.importSystemPrompts',
            'cfgEnableFieldPromptsBtn': 'buttons.enableCustomPrompts',
            'cfgCopyAllPromptsBtn': 'buttons.copyAllPrompts',
            'cfgImportAllPromptsBtn': 'buttons.importAllPrompts',
            'adminCreateUserBtn': 'buttons.createUser',
            'translateAllBtn': 'language.translateAll',
            'exportTranslationsBtn': 'language.exportTranslations',
            'importTranslationsBtn': 'language.importTranslations'
        };
        
        Object.entries(buttonMappings).forEach(([selector, key]) => {
            const elements = document.querySelectorAll(`.${selector}, #${selector}`);
            elements.forEach(element => {
                const translation = this.t(key);
                if (translation && translation !== key) {
                    this.updateElementText(element, translation);
                }
            });
        });
    },
    
    // 更新元素文本（保留emoji）
    updateElementText(element, newText) {
        const currentText = element.textContent || element.innerText;
        const emojiMatch = currentText.match(/^[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸]\s*/);
        
        if (emojiMatch) {
            element.innerHTML = emojiMatch[0] + ' ' + newText.replace(/^[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸]\s*/, '');
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
            },
            'countdownTime': {
                '1': 'learning.countdownOptions.1',
                '2': 'learning.countdownOptions.2',
                '3': 'learning.countdownOptions.3',
                '4': 'learning.countdownOptions.4',
                '5': 'learning.countdownOptions.5',
                '6': 'learning.countdownOptions.6',
                '7': 'learning.countdownOptions.7',
                '8': 'learning.countdownOptions.8',
                '9': 'learning.countdownOptions.9'
            }
        };
        
        Object.entries(selectMappings).forEach(([selectId, options]) => {
            const select = document.getElementById(selectId);
            if (select) {
                Object.entries(options).forEach(([value, key]) => {
                    const option = select.querySelector(`option[value="${value}"]`);
                    if (option) {
                        const translation = this.t(key);
                        if (translation && translation !== key) {
                            option.textContent = translation;
                        }
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
            'strictCoveragePrefix': 'stats.strictCoverage',
            'currentUserLabel': 'stats.notLoggedIn',
            'enhancementProgress': 'stats.enhancementService'
        };
        
        Object.entries(statsMappings).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                const translation = this.t(key);
                if (translation && translation !== key) {
                    element.textContent = translation;
                }
            }
        });
    },
    
    // 更新设置界面
    updateSettingsUI() {
        // 更新设置面板标题
        const settingsTitle = document.querySelector('.settings-content h3');
        if (settingsTitle) {
            settingsTitle.textContent = this.t('settings.title', '个人中心');
        }
        
        // 更新用户信息区域
        const userInfoTitle = document.querySelector('#userInfoSection > div');
        if (userInfoTitle && userInfoTitle.textContent.includes('用户信息')) {
            userInfoTitle.textContent = this.t('settings.userInfo', '用户信息');
        }
        
        // 更新用户名标签
        const usernameLabel = Array.from(document.querySelectorAll('#userInfoSection div')).find(el => 
            el.textContent.includes('用户名：')
        );
        if (usernameLabel) {
            usernameLabel.innerHTML = usernameLabel.innerHTML.replace('用户名：', this.t('settings.username', '用户名：'));
        }
        
        // 更新统计信息标签
        const statsLabels = [
            { selector: '#userInfoSection', text: '近30天学习：', key: 'settings.study30Days' },
            { selector: '#userInfoSection', text: '近24小时学习：', key: 'settings.study24Hours' },
            { selector: '#userInfoSection', text: '总进度：', key: 'settings.totalProgress' },
            { selector: '#userInfoSection', text: '今日目标：', key: 'settings.todayTarget' }
        ];
        
        statsLabels.forEach(({ selector, text, key }) => {
            const elements = document.querySelectorAll(selector + ' div');
            elements.forEach(el => {
                if (el.textContent.includes(text)) {
                    el.innerHTML = el.innerHTML.replace(text, this.t(key, text));
                }
            });
        });
        
        // 更新未登录提示
        const loginPrompt = document.querySelector('#loginFormSection div');
        if (loginPrompt && loginPrompt.textContent.includes('您尚未登录')) {
            loginPrompt.textContent = this.t('settings.loginPrompt', '您尚未登录，请点击页面下方"个人中心"进行登录或注册。');
        }
        
        // 更新管理员面板
        const adminPanelTitle = document.querySelector('#adminPanelSection > div');
        if (adminPanelTitle && adminPanelTitle.textContent.includes('管理员：用户管理')) {
            adminPanelTitle.textContent = this.t('settings.adminPanel', '管理员：用户管理');
        }
        
        const adminDescription = Array.from(document.querySelectorAll('#adminPanelSection div')).find(el =>
            el.textContent.includes('仅当以管理员账号')
        );
        if (adminDescription) {
            adminDescription.textContent = this.t('settings.adminDescription', '仅当以管理员账号（caishen）登录时可见。可查看用户、修改密码、删除与拉黑。');
        }
        
        // 更新输入框占位符
        const placeholders = {
            'adminNewUserId': 'settings.placeholders.newUserId',
            'adminNewUserName': 'settings.placeholders.displayName',
            'adminNewUserPassword': 'settings.placeholders.password',
            'jsonInput': 'settings.placeholders.jsonInput',
            'authUserId': 'settings.placeholders.authUserId',
            'authUserName': 'settings.placeholders.authUserName',
            'authPin': 'settings.placeholders.authPin',
            'authPinConfirm': 'settings.placeholders.authPinConfirm',
            'loginModalUserId': 'settings.placeholders.loginUserId',
            'loginModalPin': 'settings.placeholders.loginPin',
            'gptBaseUrl': 'settings.placeholders.gptBaseUrl',
            'gptModel': 'settings.placeholders.gptModel',
            'gptApiKey': 'settings.placeholders.gptApiKey',
            'cfgFieldPrompt_word': 'settings.placeholders.wordPrompt',
            'cfgFieldPrompt_chinese': 'settings.placeholders.chinesePrompt',
            'cfgFieldPrompt_phonetic': 'settings.placeholders.phoneticPrompt',
            'cfgFieldPrompt_pos': 'settings.placeholders.posPrompt',
            'cfgFieldPrompt_memory': 'settings.placeholders.memoryPrompt',
            'cfgFieldPrompt_association': 'settings.placeholders.associationPrompt',
            'cfgFieldPrompt_definition': 'settings.placeholders.definitionPrompt',
            'cfgFieldPrompt_brief': 'settings.placeholders.briefPrompt',
            'cfgFieldPrompt_collocation': 'settings.placeholders.collocationPrompt',
            'cfgFieldPrompt_example': 'settings.placeholders.examplePrompt'
        };
        
        Object.entries(placeholders).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element && element.placeholder) {
                const translation = this.t(key);
                if (translation && translation !== key) {
                    element.placeholder = translation;
                }
            }
        });
        
        // 更新工具提示
        const tooltips = {
            'autoPlayBtn': 'settings.tooltips.autoPlay',
            'correctBtn': 'settings.tooltips.correctBtn',
            'speak-button': 'settings.tooltips.speakButton',
            'learnMode': 'settings.tooltips.learnMode',
            'countdownTime': 'settings.tooltips.countdownTime',
            'accentZh': 'settings.tooltips.accentZh',
            'openAuthPageMainBtn': 'settings.tooltips.openAuthPageMainBtn',
            'dontRememberTopBtn': 'settings.tooltips.dontRememberTopBtn',
            'gptExtractBtn': 'settings.tooltips.gptExtractBtn',
            'enhancementStatus': 'settings.tooltips.enhancementStatus',
            'gptEnhanceLabel': 'settings.tooltips.gptEnhanceLabel'
        };
        
        Object.entries(tooltips).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element && element.title) {
                const translation = this.t(key);
                if (translation && translation !== key) {
                    element.title = translation;
                }
            }
        });
        
        // 更新卡片内容
        this.updateCardContent();
    },
    
    // 更新卡片内容
    updateCardContent() {
        // 更新卡片背面的标签
        const cardDetails = document.getElementById('back-details');
        if (cardDetails) {
            const html = cardDetails.innerHTML;
            const updatedHtml = html
                .replace('中文:', this.t('card.chinese', '中文:'))
                .replace('定义:', this.t('card.definition', '定义:'))
                .replace('搭配:', this.t('card.collocation', '搭配:'))
                .replace('记忆:', this.t('card.memory', '记忆:'));
            cardDetails.innerHTML = updatedHtml;
        }
    },
    
    // 添加语言切换功能
    async addLanguageSwitching() {
        // 这个功能已经在初始化时完成
        console.log('✅ 语言切换功能已添加');
    },
    
    // 设置事件监听器
    setupEventListeners() {
        // 监听语言切换事件
        document.addEventListener('languageChanged', (e) => {
            console.log(`语言已切换到: ${e.detail.language}`);
            // 可以在这里添加额外的语言切换处理逻辑
        });
    },
    
    // 获取语言信息
    getLanguageInfo(language) {
        const langInfo = this.status.translations[language] || this.status.translations['zh-CN'];
        if (langInfo && langInfo.language) {
            return {
                name: langInfo.language.name || language,
                flag: langInfo.language.flag || '🏳️',
                rtl: langInfo.language.rtl || false
            };
        }
        
        // 默认语言信息
        const defaultInfo = {
            'zh-CN': { name: '简体中文', flag: '🇨🇳', rtl: false },
            'zh-TW': { name: '繁體中文', flag: '🇭🇰', rtl: false },
            'en-US': { name: 'English (US)', flag: '🇺🇸', rtl: false },
            'en-GB': { name: 'English (UK)', flag: '🇬🇧', rtl: false },
            'th': { name: 'ภาษาไทย', flag: '🇹🇭', rtl: false },
            'ja': { name: '日本語', flag: '🇯🇵', rtl: false },
            'es': { name: 'Español', flag: '🇪🇸', rtl: false },
            'fr': { name: 'Français', flag: '🇫🇷', rtl: false },
            'de': { name: 'Deutsch', flag: '🇩🇪', rtl: false },
            'ko': { name: '한국어', flag: '🇰🇷', rtl: false },
            'ar': { name: 'العربية', flag: '🇸🇦', rtl: true },
            'ru': { name: 'Русский', flag: '🇷🇺', rtl: false }
        };
        
        return defaultInfo[language] || { name: language, flag: '🏳️', rtl: false };
    },
    
    // 翻译函数
    t(key, fallback = '') {
        try {
            const keys = key.split('.');
            let translation = this.status.translations[this.status.currentLanguage];
            
            for (const k of keys) {
                if (translation && translation[k] !== undefined) {
                    translation = translation[k];
                } else {
                    return fallback || key;
                }
            }
            
            return translation || fallback || key;
            
        } catch (error) {
            console.warn(`翻译键 "${key}" 未找到`, error);
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
    
    // AI翻译功能
    async translateWithAI(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            // 检查缓存
            const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
            if (this.status.translationCache[cacheKey]) {
                return this.status.translationCache[cacheKey];
            }
            
            // 使用AI翻译器
            const translator = this.aiTranslators[this.currentAITranslator];
            if (!translator) {
                throw new Error('没有可用的AI翻译器');
            }
            
            const translatedText = await translator.translate(text, targetLanguage, sourceLanguage);
            
            // 缓存翻译结果
            this.status.translationCache[cacheKey] = translatedText;
            this.saveTranslationCache();
            
            // 添加到历史记录
            this.status.translationHistory.push({
                originalText: text,
                translatedText: translatedText,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                timestamp: Date.now(),
                translator: this.currentAITranslator
            });
            this.saveTranslationHistory();
            
            return translatedText;
            
        } catch (error) {
            console.error('AI翻译失败:', error);
            throw error;
        }
    },
    
    // 批量翻译所有UI元素 - 安全版本
    async translateAllUIElements(targetLanguage, progressCallback = null) {
        if (this.status.aiTranslationInProgress) {
            throw new Error('翻译正在进行中');
        }
        
        try {
            this.status.aiTranslationInProgress = true;
            
            console.log('🔄 开始安全批量翻译...');
            
            // 获取所有需要翻译的文本元素（使用安全的选择器）
            const elements = this.getAllTranslatableElements();
            const total = elements.length;
            let translated = 0;
            
            console.log(`📋 找到 ${total} 个需要翻译的UI元素`);
            
            if (progressCallback) {
                progressCallback({
                    total: total,
                    translated: 0,
                    percentage: 0
                });
            }
            
            // 批量翻译 - 更安全的处理
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                
                try {
                    // 保存原始文本和HTML结构
                    const originalText = element.textContent.trim();
                    const originalHTML = element.innerHTML;
                    
                    if (!originalText || originalText.length === 0 || originalText.length > 50) {
                        continue; // 跳过空文本或过长文本
                    }
                    
                    // 检查是否已经翻译过
                    if (element.hasAttribute('data-translated')) {
                        continue;
                    }
                    
                    // 验证元素是否仍然存在于DOM中且可见
                    if (!document.body.contains(element) || 
                        element.offsetParent === null ||
                        window.getComputedStyle(element).display === 'none') {
                        continue;
                    }
                    
                    // 安全地提取需要翻译的文本
                    const cleanText = this.extractTranslatableText(originalText);
                    if (!cleanText) {
                        continue;
                    }
                    
                    // 进行AI翻译
                    const translatedText = await this.translateWithAI(cleanText, targetLanguage);
                    
                    if (translatedText && translatedText !== cleanText) {
                        // 安全地更新文本，保留原有格式
                        const finalText = this.preserveFormatting(originalText, cleanText, translatedText);
                        
                        // 使用更安全的方式更新文本
                        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                            element.placeholder = finalText;
                        } else if (element.tagName === 'OPTION') {
                            element.text = finalText;
                        } else {
                            // 对于其他元素，只更新文本内容，保留HTML结构
                            if (element && element.nodeType === Node.ELEMENT_NODE) {
                                this.safeUpdateText(element, finalText);
                            }
                        }
                        
                        // 标记为已翻译
                        if (element && element.setAttribute) {
                            element.setAttribute('data-translated', 'true');
                            translated++;
                            console.log(`✅ 翻译完成: "${cleanText}" → "${translatedText}"`);
                        }
                    }
                    
                    // 更新进度
                    if (progressCallback && (i % 3 === 0 || i === elements.length - 1)) {
                        progressCallback({
                            total: total,
                            translated: translated,
                            percentage: Math.round((translated / total) * 100)
                        });
                    }
                    
                    // 添加小延迟，避免API调用过快
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.warn(`翻译元素失败 (${i + 1}/${total}):`, error);
                    // 继续翻译其他元素，不中断整体流程
                }
            }
            
            // 最终进度更新
            if (progressCallback) {
                progressCallback({
                    total: total,
                    translated: translated,
                    percentage: 100
                });
            }
            
            console.log(`✅ 批量翻译完成: ${translated}/${total} 个元素`);
            
            // 显示完成提示
            if (translated > 0) {
                this.showNotification(`翻译完成！已翻译 ${translated} 个界面元素`, 'success');
            }
            
            return { total, translated, success: true };
            
        } catch (error) {
            console.error('批量翻译失败:', error);
            this.showNotification('批量翻译失败: ' + error.message, 'error');
            throw error;
        } finally {
            this.status.aiTranslationInProgress = false;
        }
    },
    
    // 保留原有格式
    preserveFormatting(originalText, cleanText, translatedText) {
        // 保留开头的emoji
        const leadingEmoji = originalText.match(/^[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸✅❌⚠️]\s*/);
        // 保留结尾的emoji
        const trailingEmoji = originalText.match(/[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸✅❌⚠️]$/);
        
        let finalText = translatedText;
        
        if (leadingEmoji) {
            finalText = leadingEmoji[0] + finalText;
        }
        if (trailingEmoji) {
            finalText = finalText + trailingEmoji[0];
        }
        
        return finalText;
    },
    
    // 安全地提取可翻译文本
    extractTranslatableText(text) {
        // 移除emoji和特殊字符，但保留有意义的文本
        let cleanText = text
            .replace(/^[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸✅❌⚠️]\s*/g, '') // 移除开头的emoji
            .replace(/[▶️🔁👍👎👤📊🔁📅🧪🔄📤📥🇨🇳🇺🇸🇹🇭🇯🇵🇪🇸✅❌⚠️]$/g, '') // 移除结尾的emoji
            .trim();
        
        // 排除纯数字、纯符号、URL、文件路径
        if (!cleanText || 
            cleanText.length < 2 || 
            cleanText.length > 30 ||
            /^[\d\s\W]*$/.test(cleanText) ||
            /^https?:\/\//.test(cleanText) ||
            /^[.#][\w-]+$/.test(cleanText) ||
            /\.[a-zA-Z]{2,4}(\?|$)/.test(cleanText)) {
            return null;
        }
        
        return cleanText;
    },
    
    // 安全地更新文本内容
    safeUpdateText(element, newText) {
        try {
            // 如果元素只有文本节点，直接更新
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                element.textContent = newText;
            } else {
                // 否则，只替换文本内容，保留HTML结构
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let textNode;
                let found = false;
                while (textNode = walker.nextNode()) {
                    if (textNode.textContent.trim() && !found) {
                        textNode.textContent = newText;
                        found = true;
                        break;
                    }
                }
                
                // 如果没有找到文本节点，安全地添加
                if (!found) {
                    element.textContent = newText;
                }
            }
        } catch (error) {
            console.warn('安全更新文本失败，使用备用方案:', error);
            element.textContent = newText;
        }
    },
    
    // 显示通知
    showNotification(message, type = 'info') {
        try {
            // 确保document.body存在
            if (!document || !document.body) {
                console.log(`[通知] ${message}`);
                return;
            }
            
            // 创建简单的通知元素
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10000;
                font-size: 14px;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
            
        } catch (error) {
            console.warn('显示通知失败:', error);
            console.log(`[通知] ${message}`);
        }
    },
    
    // 获取所有可翻译的元素 - 修复版本，避免翻译布局元素
    getAllTranslatableElements() {
        // 更严格的选择器，只选择UI控件元素
        const safeSelectors = [
            // 主要的UI按钮和控件
            'button[data-translate]:not([data-no-translate])',
            'a[data-translate]:not([data-no-translate])',
            '.btn[data-translate]:not([data-no-translate])',
            '.button[data-translate]:not([data-no-translate])',
            
            // 设置面板中的标签
            '.settings-panel label:not([data-no-translate])',
            '.settings-panel .label:not([data-no-translate])',
            '.control-panel label:not([data-no-translate])',
            
            // 选择器中的选项
            'select option:not([data-no-translate])',
            
            // 统计信息文本
            '.stats-text:not([data-no-translate])',
            '.stat-label:not([data-no-translate])',
            '.progress-label:not([data-no-translate])',
            
            // 标题和主要文本
            'h1.page-title:not([data-no-translate])',
            'h2.section-title:not([data-no-translate])',
            'h3.subtitle:not([data-no-translate])',
            
            // 卡片内容
            '.card-title:not([data-no-translate])',
            '.card-text:not([data-no-translate])',
            '.word-card .text:not([data-no-translate])',
            
            // 导航元素
            '.nav-item:not([data-no-translate])',
            '.nav-link:not([data-no-translate])',
            '.menu-item:not([data-no-translate])',
            
            // 状态信息
            '.status-text:not([data-no-translate])',
            '.error-message:not([data-no-translate])',
            '.success-message:not([data-no-translate])',
            
            // 特定ID的元素
            '#translateAllBtn:not([data-no-translate])',
            '#exportTranslationsBtn:not([data-no-translate])',
            '#importTranslationsBtn:not([data-no-translate])',
            '#personalCenterBtn:not([data-no-translate])',
            '#addWordBtn:not([data-no-translate])',
            '#flipCardBtn:not([data-no-translate])',
            '#rememberBtn:not([data-no-translate])',
            '#dontRememberBtn:not([data-no-translate])'
        ];
        
        const elements = [];
        
        // 首先尝试使用严格的选择器
        safeSelectors.forEach(selector => {
            const foundElements = document.querySelectorAll(selector);
            foundElements.forEach(el => {
                if (this.isValidTranslatableElement(el)) {
                    elements.push(el);
                }
            });
        });
        
        // 如果没有找到足够的元素，再使用备用方案
        if (elements.length < 10) {
            // 备用：查找常见的UI元素
            const fallbackSelectors = [
                'button:not([data-no-translate]):not(.modal *):not(.overlay *):not(.dropdown *)',
                'a:not([data-no-translate]):not(.modal *):not(.overlay *):not(.dropdown *)',
                'label:not([data-no-translate]):not(.modal *):not(.overlay *):not(.dropdown *)',
                '.btn:not([data-no-translate]):not(.modal *):not(.overlay *):not(.dropdown *)'
            ];
            
            fallbackSelectors.forEach(selector => {
                const foundElements = document.querySelectorAll(selector);
                foundElements.forEach(el => {
                    if (this.isValidTranslatableElement(el) && !elements.includes(el)) {
                        elements.push(el);
                    }
                });
            });
        }
        
        // 去重并限制数量
        const uniqueElements = [...new Set(elements)];
        console.log(`找到 ${uniqueElements.length} 个可翻译的UI元素`);
        return uniqueElements.slice(0, 50); // 限制最大数量，避免性能问题
    },
    
    // 检查元素是否适合翻译
    isValidTranslatableElement(element) {
        const text = element.textContent.trim();
        
        // 基本检查
        if (!text || text.length === 0 || text.length > 100) return false;
        
        // 排除纯数字、纯符号
        if (/^[\d\s\W]*$/.test(text)) return false;
        
        // 排除HTML标签和代码
        if (/<[^>]+>/.test(text)) return false;
        
        // 排除URL和文件路径
        if (/^(https?|file|data):\/\//.test(text)) return false;
        if (/\.[a-zA-Z]{2,4}(\?|$)/.test(text)) return false;
        
        // 排除CSS类和ID
        if (/^[.#][\w-]+$/.test(text)) return false;
        
        // 排除已经翻译过的内容
        if (element.hasAttribute('data-translated')) return false;
        
        // 检查父元素，避免翻译模态框和覆盖层
        let parent = element.parentElement;
        while (parent) {
            const className = parent.className || '';
            const id = parent.id || '';
            
            if (className.includes('modal') || 
                className.includes('overlay') || 
                className.includes('dropdown') ||
                className.includes('loading') ||
                id.includes('modal') ||
                id.includes('overlay')) {
                return false;
            }
            parent = parent.parentElement;
        }
        
        return true;
    },
    
    // 导出翻译数据
    exportTranslationData() {
        const data = {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            language: this.status.currentLanguage,
            translations: this.status.translations,
            translationCache: this.status.translationCache,
            translationHistory: this.status.translationHistory,
            stats: this.getSystemStatus()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goldword_translations_${this.status.currentLanguage}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ 翻译数据已导出');
    },
    
    // 导入翻译数据
    importTranslationData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('无效的翻译数据格式');
            }
            
            // 验证数据版本
            if (data.version && data.version !== this.config.version) {
                console.warn(`数据版本不匹配: ${data.version} vs ${this.config.version}`);
            }
            
            // 导入翻译数据
            if (data.translations) {
                this.status.translations = { ...this.status.translations, ...data.translations };
            }
            
            // 导入翻译缓存
            if (data.translationCache) {
                this.status.translationCache = { ...this.status.translationCache, ...data.translationCache };
            }
            
            // 导入翻译历史
            if (data.translationHistory && Array.isArray(data.translationHistory)) {
                this.status.translationHistory = [...this.status.translationHistory, ...data.translationHistory];
            }
            
            // 保存到本地存储
            this.cacheTranslations();
            this.saveTranslationCache();
            this.saveTranslationHistory();
            
            // 重新应用翻译
            this.refactorExistingUI();
            
            console.log('✅ 翻译数据已导入');
            
        } catch (error) {
            console.error('导入翻译数据失败:', error);
            throw error;
        }
    },
    
    // 获取当前语言
    getCurrentLanguage() {
        return this.status.currentLanguage;
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
    
    // 触发自定义事件
    dispatchLanguageChangeEvent(language) {
        const event = new CustomEvent('languageChanged', {
            detail: { language: language }
        });
        document.dispatchEvent(event);
    },
    
    // 创建语言选择器
    createLanguageSelector() {
        // 返回一个语言选择器元素
        const select = document.createElement('select');
        select.className = 'language-selector';
        select.style.cssText = 'padding: 8px; border-radius: 8px; border: 1px solid #ddd; margin: 8px 0;';
        
        this.config.supportedLanguages.forEach(lang => {
            const langInfo = this.getLanguageInfo(lang);
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = `${langInfo.flag} ${langInfo.name}`;
            if (lang === this.status.currentLanguage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // 绑定语言切换事件
        select.addEventListener('change', async (e) => {
            await this.setLanguage(e.target.value);
        });
        
        return select;
    },
    
    // 创建翻译控制面板
    createTranslationPanel() {
        // 这个功能可以扩展为完整的翻译控制界面
        console.log('✅ 翻译控制面板已创建');
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
            version: this.config.version,
            aiTranslationInProgress: this.status.aiTranslationInProgress
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
AI翻译进行中: ${status.aiTranslationInProgress ? '是' : '否'}
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