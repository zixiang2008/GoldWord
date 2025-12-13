/**
 * GoldWord - UI 模块
 * 负责：
 * - 初始化 DOM 与事件绑定
 * - 调整字号与卡片动画（大屏/横屏适配）
 * - 与 App 协作进行学习流程与统计刷新
 * 注意：交互事件统一在 bindEvents 中绑定，并且仅由 App.init() 调用一次；
 * 避免在 UI.init() 内重复绑定，防止按钮行为重复触发。
 */
// UI相关功能
const UI = {
    // DOM元素引用
        elements: {
        fileInput: null,
        flashcard: null,
        flashcardFront: null,
        flashcardBack: null,
        wordFront: null,
        wordBack: null,
        detailsFront: null,
        detailsBack: null,
        flipButton: null,
        nextButton: null,
        speakButton: null,
        speechRate: null,
        accent: null,
        accentZh: null,
        // 信息栏元素
        currentUserPrefix: null,
        currentUserLabel: null,
        totalWordsPrefix: null,
        totalWords: null,
        studiedToday: null,
        todayStudyPrefix: null,
        progressBar: null,
        repeatedWords: null,
        reviewProgressPrefix: null,
        reviewProgress: null,
        reviewButton: null,
        settingsButton: null,
        settingsPanel: null,
        closeSettingsBtn: null,
        importJsonBtn: null,
        importTextBtn: null,
        exportJsonBtn: null,
        clearDataBtn: null,
        jsonInput: null,
        settingsTotalWords: null,
        settingsReviewProgress: null,
        // 新增元素
        newWordsPrefix: null,
        newWords: null,
        countdown: null,
        addNewWordBtn: null,
        dontRememberBtn: null,
        dontRememberTopBtn: null,
        autoPlayBtn: null,
        countdownTime: null,
        learnMode: null,
        countdownLeft: null,
        // GPT 设置元素
        gptModelSelect: null,
        gptHelpInfo: null,
        gptBaseUrl: null,
        gptModel: null,
        gptApiKey: null,
        gptSaveBtn: null,
        gptTestBtn: null,
        gptTestStatus: null,
        // 新增：卡片字段 Prompt 控制按钮
        cfgImportSystemPromptsBtn: null,
        cfgEnableFieldPromptsBtn: null,
        cfgCopyAllPromptsBtn: null,
        cfgImportAllPromptsBtn: null,
        cfgPromptStatus: null,
        ttsTestBtn: null,
        ttsTestStatus: null,
        ttsQuickTestBtn: null,
        ttsQuickTestStatus: null,
        // 设置面板段落标题（用于本地化）
        importHeader: null,
        voiceTestHeader: null,
        // 统一注册/登录覆盖层相关元素
            openAuthPageBtn: null,
            openAuthPageMainBtn: null,
            goToAuthCenterBtn: null,
        authPage: null,
        authCloseBtn: null,
        authRegisterBtn: null,
            authLoginBtn: null,
            authLogoutBtn: null,
            authStatus: null,
            // 登录模态框元素
            loginModal: null,
            loginModalCloseBtn: null,
            loginModalConfirmBtn: null,
            loginModalUserId: null,
            loginModalPin: null,
            loginModalStatus: null,
            downloadTemplateBtn: null
        },
    
    /**
     * 初始化 UI：
     * - 收集页面所需的 DOM 引用
     * - 监听窗口尺寸变化以适配正面单词字号
     * 注：交互事件统一在 bindEvents 中绑定，由 App.init 调用一次。
     */
    // 初始化UI
        init: function() {
        // 获取DOM元素引用
        this.elements.fileInput = document.getElementById('fileInput');
        this.elements.flashcard = document.querySelector('.flashcard');
        this.elements.flashcardFront = document.querySelector('.flashcard-front');
        this.elements.flashcardBack = document.querySelector('.flashcard-back');
        this.elements.wordFront = document.querySelector('.flashcard-front .word');
        this.elements.wordBack = document.querySelector('.flashcard-back .word');
        this.elements.detailsFront = document.querySelector('.flashcard-front .details');
        this.elements.detailsBack = document.querySelector('.flashcard-back .details');
        this.elements.flipButton = document.querySelector('.flip-button');
        this.elements.nextButton = document.getElementById('nextButton');
        this.elements.speakButton = document.querySelector('.speak-button');
        this.elements.correctButton = document.getElementById('correctBtn');
        this.elements.incorrectButton = document.getElementById('incorrectBtn');
        this.elements.speechRate = document.getElementById('speechRate');
        this.elements.accent = document.querySelector('.accent');
        this.elements.accentZh = document.getElementById('accentZh');
        // 信息栏前缀与数值元素
        this.elements.currentUserPrefix = document.getElementById('currentUserPrefix');
        this.elements.currentUserLabel = document.getElementById('currentUserLabel');
        this.elements.totalWordsPrefix = document.getElementById('totalWordsPrefix');
        this.elements.totalWords = document.getElementById('totalWords');
        this.elements.todayStudyPrefix = document.getElementById('todayStudyPrefix');
        this.elements.studiedToday = document.getElementById('studiedToday');
        this.elements.progressBar = document.querySelector('.progress-bar');
            this.elements.reviewProgressPrefix = document.getElementById('reviewProgressPrefix');
            this.elements.reviewProgress = document.getElementById('reviewProgress');
            this.elements.reviewProgressBar = document.getElementById('reviewProgressBar');
        this.elements.repeatedWords = document.getElementById('repeatedWords');
        this.elements.reviewButton = document.querySelector('.review-button');
        // 新增元素
        this.elements.newWordsPrefix = document.getElementById('newWordsPrefix');
        this.elements.newWords = document.getElementById('newWords');
        this.elements.countdown = document.getElementById('countdown');
        this.elements.countdownStatus = document.getElementById('countdownStatus');
        this.elements.addNewWordBtn = document.getElementById('addNewWordBtn');
        this.elements.dontRememberBtn = document.getElementById('dontRememberBtn');
        this.elements.dontRememberTopBtn = document.getElementById('dontRememberTopBtn');
        this.elements.autoPlayBtn = document.getElementById('autoPlayBtn');
        this.elements.countdownTime = document.getElementById('countdownTime');
        this.elements.learnMode = document.getElementById('learnMode');
        this.elements.countdownLeft = document.getElementById('countdownLeft');
        
        // 个人中心相关元素
        this.elements.settingsButton = document.getElementById('settingsButton');
        this.elements.settingsPanel = document.getElementById('settingsPanel');
        this.elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.elements.importJsonBtn = document.getElementById('importJsonBtn');
        this.elements.importTextBtn = document.getElementById('importTextBtn');
        this.elements.gptExtractBtn = document.getElementById('gptExtractBtn');
        // GPT 下拉与帮助信息
        this.elements.gptModelSelect = document.getElementById('gptModelSelect');
        this.elements.gptHelpInfo = document.getElementById('gptHelpInfo');
        // 顶部用户管理二级菜单元素
        this.elements.userMenuButton = document.getElementById('userMenuButton');
        this.elements.userMenuDropdown = document.getElementById('userMenuDropdown');
        this.elements.userRegisterBtn = document.getElementById('userRegisterBtn');
        this.elements.userLoginBtn = document.getElementById('userLoginBtn');
        this.elements.openSettingsPanelBtn = document.getElementById('openSettingsPanelBtn');
        this.elements.importMenuBtn = document.getElementById('importMenuBtn');
        this.elements.exportMenuBtn = document.getElementById('exportMenuBtn');
        // 个人中心页内二级菜单
        this.elements.settingsUserMenuButton = document.getElementById('settingsUserMenuButton');
        this.elements.settingsUserMenuDropdown = document.getElementById('settingsUserMenuDropdown');
        this.elements.settingsMenuUserBtn = document.getElementById('settingsMenuUserBtn');
        this.elements.settingsMenuAuthBtn = document.getElementById('settingsMenuAuthBtn');
        this.elements.settingsMenuImportBtn = document.getElementById('settingsMenuImportBtn');
        this.elements.settingsMenuExportBtn = document.getElementById('settingsMenuExportBtn');
        this.elements.exportJsonBtn = document.getElementById('exportJsonBtn');
        this.elements.clearDataBtn = document.getElementById('clearDataBtn');
        this.elements.restoreOriginalBtn = document.getElementById('restoreOriginalBtn');
        this.elements.jsonInput = document.getElementById('jsonInput');
        this.elements.settingsTotalWords = document.getElementById('settingsTotalWords');
        this.elements.settingsReviewProgress = document.getElementById('settingsReviewProgress');
        this.elements.settingsStrictCoverage = document.getElementById('settingsStrictCoverage');
        this.elements.reviewProgress = document.getElementById('reviewProgress');
        this.elements.strictCoverage = document.getElementById('strictCoverage');
        // 严格覆盖率进度条（移动到第二行右侧）
        this.elements.strictCoverageBar = document.getElementById('strictCoverageBar');
        this.elements.userIdInput = document.getElementById('userIdInput');
        this.elements.userNameInput = document.getElementById('userNameInput');
        this.elements.userPasswordInput = document.getElementById('userPasswordInput');
        this.elements.registerBtn = document.getElementById('registerBtn');
        this.elements.loginBtn = document.getElementById('loginBtn');
        this.elements.logoutBtn = document.getElementById('logoutBtn');
        this.elements.currentUserLabel = document.getElementById('currentUserLabel');
        // GPT 设置
        this.elements.gptModelSelect = document.getElementById('gptModelSelect');
        this.elements.gptHelpInfo = document.getElementById('gptHelpInfo');
        this.elements.gptBaseUrl = document.getElementById('gptBaseUrl');
        this.elements.gptModel = document.getElementById('gptModel');
        this.elements.gptApiKey = document.getElementById('gptApiKey');
        this.elements.gptSaveBtn = document.getElementById('gptSaveBtn');
        this.elements.gptTestBtn = document.getElementById('gptTestBtn');
        this.elements.gptEnhanceLabel = document.getElementById('gptEnhanceLabel');
        this.elements.gptTestStatus = document.getElementById('gptTestStatus');
        // 新增：卡片字段 Prompt 控制按钮引用
        this.elements.cfgImportSystemPromptsBtn = document.getElementById('cfgImportSystemPromptsBtn');
        this.elements.cfgEnableFieldPromptsBtn = document.getElementById('cfgEnableFieldPromptsBtn');
        this.elements.cfgCopyAllPromptsBtn = document.getElementById('cfgCopyAllPromptsBtn');
        this.elements.cfgImportAllPromptsBtn = document.getElementById('cfgImportAllPromptsBtn');
        this.elements.cfgPromptStatus = document.getElementById('cfgPromptStatus');
        this.elements.ttsTestBtn = document.getElementById('ttsTestBtn');
        this.elements.ttsTestStatus = document.getElementById('ttsTestStatus');
        this.elements.ttsQuickTestBtn = document.getElementById('ttsQuickTestBtn');
        this.elements.ttsQuickTestStatus = document.getElementById('ttsQuickTestStatus');
        // 统一注册/登录覆盖层相关元素
        this.elements.openAuthPageBtn = document.getElementById('openAuthPageBtn');
        this.elements.openAuthPageMainBtn = document.getElementById('openAuthPageMainBtn');
        this.elements.goToAuthCenterBtn = document.getElementById('goToAuthCenterBtn');
            this.elements.authPage = document.getElementById('authPage');
            this.elements.authCloseBtn = document.getElementById('authCloseBtn');
            this.elements.authRegisterBtn = document.getElementById('authRegisterBtn');
            this.elements.authLoginBtn = document.getElementById('authLoginBtn');
            // 登录模态框元素绑定
            this.elements.loginModal = document.getElementById('loginModal');
            this.elements.loginModalCloseBtn = document.getElementById('loginModalCloseBtn');
            this.elements.loginModalConfirmBtn = document.getElementById('loginModalConfirmBtn');
            this.elements.loginModalUserId = document.getElementById('loginModalUserId');
            this.elements.loginModalPin = document.getElementById('loginModalPin');
            this.elements.loginModalStatus = document.getElementById('loginModalStatus');
            this.elements.authLogoutBtn = document.getElementById('authLogoutBtn');
            this.elements.authStatus = document.getElementById('authStatus');
        this.elements.downloadTemplateBtn = document.getElementById('downloadTemplateBtn');

        // 全局：监听存储变更事件，任意数据库写入后刷新统计显示
        try {
            window.addEventListener('storage-json-updated', function(){
                try { UI.updateStats && UI.updateStats(); } catch(_) {}
            });
        } catch(_) {}
        // 设置面板段落标题元素
        this.elements.importHeader = document.getElementById('importHeader');
        this.elements.voiceTestHeader = document.getElementById('voiceTestHeader');
        // 用户信息显示相关元素
        this.elements.userInfoSection = document.getElementById('userInfoSection');
        this.elements.loginFormSection = document.getElementById('loginFormSection');
        this.elements.currentUserName = document.getElementById('currentUserName');
        this.elements.userStats30Days = document.getElementById('userStats30Days');
        this.elements.userStats24Hours = document.getElementById('userStats24Hours');
        this.elements.userTotalProgress = document.getElementById('userTotalProgress');
        this.elements.userTodayTarget = document.getElementById('userTodayTarget');
        // 管理员面板元素
        this.elements.adminPanelSection = document.getElementById('adminPanelSection');
        this.elements.adminUsersList = document.getElementById('adminUsersList');
        this.elements.adminCreateUserBtn = document.getElementById('adminCreateUserBtn');
        this.elements.adminNewUserId = document.getElementById('adminNewUserId');
        this.elements.adminNewUserName = document.getElementById('adminNewUserName');
        this.elements.adminNewUserPassword = document.getElementById('adminNewUserPassword');
        
        // 根据 URL 参数自动打开认证界面（修复从 debug 返回无法打开的问题）
        try {
            const params = new URLSearchParams(window.location.search || '');
            const open = (params.get('open') || '').toLowerCase();
            if (open === 'auth' || open === 'login') {
                // 优先弹出登录模态框
                if (this.elements.loginModal) {
                    this.elements.loginModal.style.display = 'block';
                    // 预填默认游客账号，降低首次使用门槛
                    if (this.elements.loginModalUserId) this.elements.loginModalUserId.value = 'guest';
                    if (this.elements.loginModalPin) this.elements.loginModalPin.value = '0000';
                    if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = '默认游客账号：guest / 0000'; this.elements.loginModalStatus.style.color = '#555'; }
                } else {
                    // 其次显示认证 Overlay，并切到“用户登录”模式
                    const overlay = this.elements.authPage || document.getElementById('authPage');
                    if (overlay) {
                        overlay.style.display = 'block';
                        const h3 = overlay.querySelector('h3');
                        if (h3) h3.textContent = '用户登录';
                        if (this.elements.authLoginBtn) this.elements.authLoginBtn.style.display = 'inline-block';
                        if (this.elements.authRegisterBtn) this.elements.authRegisterBtn.style.display = 'none';
                        if (this.elements.authLogoutBtn) this.elements.authLogoutBtn.style.display = 'none';
                        if (this.elements.authStatus) { this.elements.authStatus.textContent = ''; this.elements.authStatus.style.color = '#555'; }
                    } else {
                        // 兜底：打开设置面板并滚动到登录区域
                        if (this.elements.settingsPanel) this.elements.settingsPanel.style.display = 'block';
                        document.getElementById('loginBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        } catch (e) {
            console.warn('解析 open=auth 参数失败：', e);
        }
        
        // 事件绑定不在此处执行，避免与 App.init 的调用重复
        // 窗口尺寸变化时，重新适配正面单词字号
        window.addEventListener('resize', () => { this.fitFrontWord(); this.adjustFlashcardHeight && this.adjustFlashcardHeight(); });
        window.addEventListener('orientationchange', () => { this.adjustFlashcardHeight && this.adjustFlashcardHeight(); });
        // 初始计算卡片高度
        try { setTimeout(() => this.adjustFlashcardHeight && this.adjustFlashcardHeight(), 0); } catch(_){ }
        // 键盘快捷键：右箭头下一张，左箭头上一张（空格键用于自动播放的暂停/继续，见下方全局监听）
        window.addEventListener('keydown', (e) => {
            const key = e.key;
            // 移除空格键绑定，避免与下方全局空格键事件冲突
            if (key === 'ArrowRight') { e.preventDefault(); try { window.App.nextCard(); } catch(_){} }
            else if (key === 'ArrowLeft') { e.preventDefault(); try { window.App.prevCard && window.App.prevCard(); } catch(_){} }
        });
    },
    
    /**
     * 绑定事件处理：
     * - 文件上传与数据导入
     * - 学习操作按钮（翻面、下一张、朗读、生词、不记得、自动播放）
     * - 个人中心（统计刷新、用户登录/注册/登出、GPT 配置保存与测试）
     */
    // 绑定事件处理
        bindEvents: function() {
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => App.handleFileUpload(e));
        }
        
        if (this.elements.flipButton) {
            this.elements.flipButton.addEventListener('click', () => {
                // 类型B：翻转卡片，触发按钮动画（10种轮换）
                try { this.playTypeBAnimation(this.elements.flipButton); } catch(_){}
                this.elements.flipButton.classList.toggle('toggled');
                App.flipCard();
            });
        }
        
        if (this.elements.nextButton) {
            this.elements.nextButton.addEventListener('click', () => App.runLearnMode ? App.runLearnMode() : App.nextCard());
        }
        
        if (this.elements.speakButton) {
            // 单击：切换自动朗读模式；开启后朗读一次当前词
            this.elements.speakButton.addEventListener('click', () => {
                try {
                    const wasEnabled = !!(window.App && App.speakEnabled);
                    if (window.App && App.toggleSpeakMode) {
                        App.toggleSpeakMode();
                    }
                    // 从关闭到开启时，朗读一次当前词
                    const nowEnabled = !!(window.App && App.speakEnabled);
                    if (!wasEnabled && nowEnabled && window.App) {
                        if (typeof App.runLearnMode === 'function') {
                            App.runLearnMode();
                        } else if (typeof App.speakWord === 'function') {
                            App.speakWord();
                        }
                    }
                } catch (_) { /* 安全兜底，不影响其他功能 */ }
            });
        }

        try {
            const exportBtn = document.getElementById('exportVisitBackupBtn');
            if (exportBtn) exportBtn.addEventListener('click', function(){ try{ if (window.VisitBackup && VisitBackup.exportJson) VisitBackup.exportJson(); }catch(_){} });
        } catch(_){}

        // 学习模式切换：若已开启自动朗读，立即按模式序列朗读
        if (this.elements.learnMode) {
            this.elements.learnMode.addEventListener('change', () => {
                try {
                    if (window.App && App.speakEnabled && typeof App.runLearnMode === 'function') {
                        App.runLearnMode();
                    }
                } catch(_){}
            });
        }

        // 记忆循环答题按钮
        if (this.elements.correctButton) {
            this.elements.correctButton.addEventListener('click', () => {
                try { this.elements.correctButton.classList.add('active'); } catch(_) {}
                App.markCorrect();
            });
        }
        if (this.elements.incorrectButton) {
            this.elements.incorrectButton.addEventListener('click', () => App.markIncorrect());
        }
        
        // 绑定复习相关按钮
        if (this.elements.dontRememberBtn) {
            this.elements.dontRememberBtn.addEventListener('click', () => App.markDontRemember());
        }
        if (this.elements.dontRememberTopBtn) {
            this.elements.dontRememberTopBtn.addEventListener('click', () => App.markDontRemember());
        }
        if (this.elements.addNewWordBtn) {
            this.elements.addNewWordBtn.addEventListener('click', () => App.markNewWord());
        }
        if (this.elements.autoPlayBtn) {
            this.elements.autoPlayBtn.addEventListener('click', () => App.toggleAutoPlay());
        }
        
        // 用户管理按钮与顶部下拉菜单：点击“用户管理”按钮打开右上角二级菜单
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => {
                const dd = this.elements.userMenuDropdown;
                if (dd) {
                    dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
                } else if (this.elements.settingsPanel) {
                    // 无下拉菜单时回退到打开设置面板
                    this.elements.settingsPanel.style.display = 'block';
                }
            });
        }
        if (this.elements.userMenuButton) {
            this.elements.userMenuButton.addEventListener('click', () => {
                const dd = this.elements.userMenuDropdown;
                if (!dd) return;
                dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
            });
        }
        const openSettingsPanel = () => {
            if (!this.elements.settingsPanel) return;
            this.elements.settingsPanel.style.display = 'block';
            // 打开时更新面板统计
            const stats = DB.getStats();
            if (this.elements.settingsTotalWords) this.elements.settingsTotalWords.textContent = stats.totalWords;
            if (this.elements.settingsReviewProgress) this.elements.settingsReviewProgress.textContent = stats.progress + '%';
            
            // 检查用户登录状态并显示相应界面
            const uid = DB.getCurrentUserId && DB.getCurrentUserId();
            const user = uid && DB.users && DB.users[uid];
            
            if (uid && user) {
                // 用户已登录，显示用户信息区域
                if (this.elements.userInfoSection) this.elements.userInfoSection.style.display = 'block';
                if (this.elements.loginFormSection) this.elements.loginFormSection.style.display = 'none';
                
                // 更新用户信息
                if (this.elements.currentUserName) {
                    this.elements.currentUserName.textContent = user.name || uid;
                }
                if (this.elements.userStats30Days) {
                    this.elements.userStats30Days.textContent = stats.studied30Days;
                }
                if (this.elements.userStats24Hours) {
                    this.elements.userStats24Hours.textContent = stats.studied24Hours;
                }
                if (this.elements.userTotalProgress) {
                    this.elements.userTotalProgress.textContent = stats.progress;
                }
                if (this.elements.userTodayTarget) {
                    const todayStudied = stats.studiedToday;
                    if (todayStudied >= 10) {
                        this.elements.userTodayTarget.textContent = '今日目标已达成！';
                    } else if (todayStudied >= 5) {
                        this.elements.userTodayTarget.textContent = '继续努力！';
                    } else {
                        this.elements.userTodayTarget.textContent = '加油学习！';
                    }
                }
            } else {
                // 用户未登录，显示登录表单
                if (this.elements.userInfoSection) this.elements.userInfoSection.style.display = 'none';
                if (this.elements.loginFormSection) this.elements.loginFormSection.style.display = 'block';
                if (this.elements.currentUserLabel) {
                    this.elements.currentUserLabel.textContent = '未登录';
                }
            }
            
            // 管理员面板可见性与渲染
            try {
                const isAdmin = DB.isAdmin && DB.isAdmin();
                if (this.elements.adminPanelSection) this.elements.adminPanelSection.style.display = isAdmin ? 'block' : 'none';
                if (isAdmin) this.renderAdminUsers && this.renderAdminUsers();
            } catch(_){}
            
            // 预填 GPT 配置
            const cfg = DB.getGPTConfig ? DB.getGPTConfig() : { baseUrl:'', model:'', apiKey:'' };
            if (this.elements.gptBaseUrl) this.elements.gptBaseUrl.value = cfg.baseUrl || '';
            if (this.elements.gptModel) this.elements.gptModel.value = cfg.model || '';
            if (this.elements.gptApiKey) this.elements.gptApiKey.value = cfg.apiKey || '';
            if (this.elements.gptTestStatus) this.elements.gptTestStatus.textContent = '';
            // 仅使用GPT模式复选框
            try {
                const onlyEl = document.getElementById('cfgGptOnlyModeCheckbox');
                if (onlyEl) {
                    onlyEl.checked = !!cfg.gptOnlyMode;
                }
            } catch(_){}

            // 预填卡片显示项配置
            try {
                const cfgMap = DB.getCardFieldConfig ? DB.getCardFieldConfig() : {};
                const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
                setVal('cfgFieldPrompt_word', (cfgMap.word||{}).prompt);
                setVal('cfgFieldPrompt_chinese', (cfgMap.chinese||{}).prompt);
                setVal('cfgFieldPrompt_phonetic', (cfgMap.phonetic||{}).prompt);
                setVal('cfgFieldPrompt_pos', (cfgMap.pos||{}).prompt);
                setVal('cfgFieldPrompt_memory', (cfgMap.memory||{}).prompt);
                setVal('cfgFieldPrompt_association', (cfgMap.association||{}).prompt);
                setVal('cfgFieldPrompt_definition', (cfgMap.definition||{}).prompt);
                setVal('cfgFieldPrompt_brief', (cfgMap.brief||{}).prompt);
                setVal('cfgFieldPrompt_collocation', (cfgMap.collocation||{}).prompt);
                setVal('cfgFieldPrompt_example', (cfgMap.example||{}).prompt);
            } catch(_){ }

            // 若用户未配置，初始化默认 Prompt（按用户要求设置）
            try {
                const tpl = window.GPTPromptTemplates || {};
                const ensureDefault = (id, tplVal, fallback) => {
                    const el = document.getElementById(id);
                    if (el && (!el.value || !el.value.trim())) {
                        el.value = (typeof tplVal === 'string' && tplVal) ? tplVal : (fallback || '');
                    }
                };
                const collocationDefault = "列出 {word} 的 3 个高频固定搭配。\n输出要求：每项以“英文：中文解释”的形式输出，每项单独占一行，不返回额外说明。";
                const briefDefault = "这个单词背景知识，延伸。30个以内。\n\n请严格按以下JSON格式返回：\n{\n  \"association\": \"简述（≤30字）\"\n}";
                const exampleDefault = "使用最基础的 2500 单词与 {word} 造句，并翻译成中文。\n输出 3 个不同句式的表达版本，每个版本占一行；每行包含英文句子与中文翻译。";

                ensureDefault('cfgFieldPrompt_collocation', tpl.COLLOCATIONS_TOP2_BULLETS, collocationDefault);
                ensureDefault('cfgFieldPrompt_brief', tpl.DEFINITION_BRIEF_CN15, briefDefault);
                ensureDefault('cfgFieldPrompt_example', tpl.EXAMPLE_TOEFL_12, exampleDefault);
            } catch(_){ }

            // 初始化模型下拉（共享内置列表）
            const BUILT_IN_MODELS = (window.BUILT_IN_MODELS_LIST || []);
            const sel = this.elements.gptModelSelect;
            if (sel) {
                // 确保下拉可交互
                try { sel.disabled = false; sel.style.pointerEvents = 'auto'; } catch(_){ }
                sel.innerHTML = '<option value="">-- 选择模型 --</option>';
                BUILT_IN_MODELS.forEach(line => {
                    const [api, model] = String(line).split(',');
                    const opt = document.createElement('option');
                    opt.value = line;
                    const label = (typeof window.renderModelOptionLabel === 'function') ? window.renderModelOptionLabel(line) : `${(model||'').trim()} By API易`;
                    opt.textContent = label;
                    sel.appendChild(opt);
                });
                // 若已有配置，尝试匹配并选中
                const matchIdx = BUILT_IN_MODELS.findIndex(line => {
                    const parts = line.split(',');
                    return (parts[1]||'').trim() === (cfg.model||'').trim();
                });
                if (matchIdx >= 0) sel.selectedIndex = matchIdx + 1;
            }
            // 选择事件：自动填充并显示帮助
            if (sel) {
                sel.onchange = () => {
                    const val = sel.value;
                    if (!val) return;
                    const [api, model, desc, paid] = val.split(',');
                    // 规范化基础地址（移除 /v1/chat/completions）
                    let baseUrl = (api || '').trim();
                    baseUrl = baseUrl.replace(/\/?v1\/?chat\/?completions\/?$/i, '');
                    baseUrl = baseUrl.replace(/\/$/, '');
                    if (this.elements.gptBaseUrl) this.elements.gptBaseUrl.value = baseUrl;
                    if (this.elements.gptModel) this.elements.gptModel.value = (model||'').trim();
                    if (this.elements.gptHelpInfo) {
                        this.elements.gptHelpInfo.innerHTML = `API: <code>${this.escapeHtml(api)}</code><br/>模型: <code>${this.escapeHtml(model)}</code><br/>说明: ${this.escapeHtml(desc || '')}<br/>是否收费: ${this.escapeHtml(paid || '')}<br/>文档：<a href="https://docs.apiyi.com/api-manual" target="_blank">https://docs.apiyi.com/api-manual</a>`;
                    }
                };
            }
        };
        if (this.elements.openSettingsPanelBtn) this.elements.openSettingsPanelBtn.addEventListener('click', openSettingsPanel);
        if (this.elements.importMenuBtn) this.elements.importMenuBtn.addEventListener('click', openSettingsPanel);
        if (this.elements.exportMenuBtn) this.elements.exportMenuBtn.addEventListener('click', openSettingsPanel);
        if (this.elements.userRegisterBtn) this.elements.userRegisterBtn.addEventListener('click', openSettingsPanel);
        if (this.elements.userLoginBtn) this.elements.userLoginBtn.addEventListener('click', openSettingsPanel);
        // 点击页面其他区域关闭右上角菜单
        document.addEventListener('click', (e) => {
            const dd = this.elements.userMenuDropdown;
            if (!dd || dd.style.display !== 'block') return;
            const target = e.target;
            const inside = dd.contains(target) ||
                (this.elements.userMenuButton && this.elements.userMenuButton.contains(target)) ||
                (this.elements.settingsButton && this.elements.settingsButton.contains(target));
            if (!inside) dd.style.display = 'none';
        });
        if (this.elements.closeSettingsBtn && this.elements.settingsPanel) {
            this.elements.closeSettingsBtn.addEventListener('click', () => {
                this.elements.settingsPanel.style.display = 'none';
            });
        }
        // 个人中心右上角二级菜单交互
        if (this.elements.settingsUserMenuButton && this.elements.settingsUserMenuDropdown) {
            this.elements.settingsUserMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const dd = this.elements.settingsUserMenuDropdown;
                dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
            });
            // 菜单项：用户登录 —— 直接打开登录界面
            if (this.elements.settingsMenuUserBtn) {
                this.elements.settingsMenuUserBtn.addEventListener('click', (ev) => {
                    try {
                        ev?.preventDefault?.();
                        ev?.stopPropagation?.();
                        // 关闭菜单下拉，避免遮挡
                        const dd = this.elements.settingsUserMenuDropdown;
                        if (dd) dd.style.display = 'none';

                        // 优先弹出登录模态框
                        if (this.elements.loginModal) {
                            this.elements.loginModal.style.display = 'block';
                            if (this.elements.loginModalStatus) {
                                this.elements.loginModalStatus.textContent = '';
                                this.elements.loginModalStatus.style.color = '#555';
                            }
                            return;
                        }

                        // 其次打开认证 Overlay，并切换为“用户登录”模式
                        const overlay = this.elements.authPage || document.getElementById('authPage');
                        if (overlay) {
                            overlay.style.display = 'block';
                            const h3 = overlay.querySelector('h3');
                            if (h3) h3.textContent = '用户登录';
                            if (this.elements.authLoginBtn) this.elements.authLoginBtn.style.display = 'inline-block';
                            if (this.elements.authRegisterBtn) this.elements.authRegisterBtn.style.display = 'none';
                            if (this.elements.authLogoutBtn) this.elements.authLogoutBtn.style.display = 'none';
                            if (this.elements.authStatus) { this.elements.authStatus.textContent = ''; this.elements.authStatus.style.color = '#555'; }
                            return;
                        }

                        // 兜底：跳转到首页并打开认证中心
                        window.top?.location?.assign?.('./index.html?open=auth');
                    } catch (e) {
                        console.error('打开登录界面失败：', e);
                        try { window.location.href = './index.html?open=auth'; } catch (_) {}
                    }
                });
            }
            if (this.elements.settingsMenuAuthBtn) {
                this.elements.settingsMenuAuthBtn.addEventListener('click', () => {
                    // 打开独立的用户注册覆盖层（仅注册）
                    const overlay = this.elements.authPage;
                    if (!overlay) return;
                    overlay.style.display = 'block';
                    // 标题改为“用户注册”
                    const h3 = overlay.querySelector('h3');
                    if (h3) h3.textContent = '用户注册';
                    // 显示注册相关输入与按钮，隐藏登录/退出
                    const loginBtn = this.elements.authLoginBtn;
                    const logoutBtn = this.elements.authLogoutBtn;
                    if (loginBtn) loginBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'none';
                    // 清空状态提示
                    if (this.elements.authStatus) { this.elements.authStatus.textContent = ''; this.elements.authStatus.style.color = '#555'; }
                });
            }
            if (this.elements.settingsMenuImportBtn) {
                this.elements.settingsMenuImportBtn.addEventListener('click', () => {
                    document.getElementById('importJsonBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            }
            if (this.elements.settingsMenuExportBtn) {
                this.elements.settingsMenuExportBtn.addEventListener('click', () => {
                    document.getElementById('exportJsonBtn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            }
            // 点击页面其它区域关闭菜单
            document.addEventListener('click', (e) => {
                const dd = this.elements.settingsUserMenuDropdown;
                if (!dd || dd.style.display !== 'block') return;
                const target = e.target;
                const inside = dd.contains(target) || (this.elements.settingsUserMenuButton && this.elements.settingsUserMenuButton.contains(target));
                if (!inside) dd.style.display = 'none';
            });
        }
        if (this.elements.importJsonBtn && this.elements.jsonInput) {
            this.elements.importJsonBtn.addEventListener('click', () => {
                App.importJsonData(this.elements.jsonInput.value || '');
            });
        }
        if (this.elements.importTextBtn && this.elements.jsonInput) {
            this.elements.importTextBtn.addEventListener('click', () => {
                App.importTextData(this.elements.jsonInput.value || '');
            });
        }
        if (this.elements.gptExtractBtn && this.elements.jsonInput) {
            this.elements.gptExtractBtn.addEventListener('click', async () => {
                const input = this.elements.jsonInput.value || '';
                if (!input.trim()) { alert('请先在上方输入或粘贴文本'); return; }
                try {
                    this.elements.gptExtractBtn.disabled = true;
                    this.elements.gptExtractBtn.textContent = '识别中...';
                    const out = await App.gptExtractWordsFromText(input);
                    if (out && out.trim()) {
                        alert('已生成英文逗号列表，可直接“从文本导入”');
                    }
                } finally {
                    this.elements.gptExtractBtn.disabled = false;
                    this.elements.gptExtractBtn.textContent = 'GPT 提取单词';
                }
            });
        }
        // 下载标准模板（JSON）
        if (this.elements.downloadTemplateBtn) {
            this.elements.downloadTemplateBtn.addEventListener('click', () => {
                const tpl = [
                    { word: 'apple', chinese: '苹果', definition: 'A round fruit', pronunciation: '[ˈæpəl]' },
                    { word: 'banana', chinese: '香蕉', definition: 'A long yellow fruit', pronunciation: '[bəˈnænə]' }
                ];
                const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'import-template.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
        if (this.elements.exportJsonBtn) {
            this.elements.exportJsonBtn.addEventListener('click', () => {
                App.exportJsonData();
            });
        }
        if (this.elements.clearDataBtn) {
            this.elements.clearDataBtn.addEventListener('click', () => {
                App.clearData();
                // 清空输入框并刷新面板统计
                if (this.elements.jsonInput) this.elements.jsonInput.value = '';
                const stats = DB.getStats();
                if (this.elements.settingsTotalWords) this.elements.settingsTotalWords.textContent = stats.totalWords;
                if (this.elements.settingsReviewProgress) this.elements.settingsReviewProgress.textContent = stats.progress + '%';
            });
        }
        if (this.elements.restoreOriginalBtn) {
            this.elements.restoreOriginalBtn.addEventListener('click', () => {
                const ok = confirm('将从页面内的原始词库恢复并覆盖当前数据，是否继续？');
                if (!ok) return;
                try {
                    const success = App.importLegacyWords();
                    if (success) {
                        App.loadWords();
                        UI.updateStats();
                        alert('已从原始数据恢复词库');
                    } else {
                        alert('未找到内联词库或数据为空，恢复失败');
                    }
                } catch (e) {
                    alert('恢复失败：' + (e && e.message ? e.message : e));
                }
            });
        }
        if (this.elements.registerBtn) {
            this.elements.registerBtn.addEventListener('click', () => {
                const id = this.elements.userIdInput?.value?.trim();
                const name = this.elements.userNameInput?.value?.trim();
                const pwd = this.elements.userPasswordInput?.value || '';
                App.registerUser(id, name, pwd);
            });
        }
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                const id = this.elements.userIdInput?.value?.trim();
                const pwd = this.elements.userPasswordInput?.value || '';
                App.loginUser(id, pwd);
                // 重新打开设置面板以更新界面
                setTimeout(() => {
                    openSettingsPanel();
                }, 100);
            });
        }
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                App.logoutUser();
                // 重新打开设置面板以更新界面
                setTimeout(() => {
                    openSettingsPanel();
                }, 100);
            });
        }
        // 统一注册/登录覆盖层交互
        const openAuthOverlay = () => {
            if (!this.elements.authPage) return;
            this.elements.authPage.style.display = 'block';
            if (this.elements.authStatus) { this.elements.authStatus.textContent = ''; this.elements.authStatus.style.color = '#555'; }
        };
        if (this.elements.openAuthPageBtn) this.elements.openAuthPageBtn.addEventListener('click', openAuthOverlay);
        // 首页“个人中心”按钮：打开设置面板，未登录则提示登录
        const handleOpenAuthCenter = () => {
            // 打开设置面板并刷新数据与登录状态显示
            openSettingsPanel();
            // 未登录则弹出统一注册/登录覆盖层
            const uid = DB.getCurrentUserId && DB.getCurrentUserId();
            if (!uid) {
                openAuthOverlay();
            }
        };
        if (this.elements.openAuthPageMainBtn) this.elements.openAuthPageMainBtn.addEventListener('click', handleOpenAuthCenter);
        // 使 goToAuthCenterBtn 行为与 openAuthPageMainBtn 完全一致；若当前页不含设置面板，则跳转到首页并打开个人中心
        if (this.elements.goToAuthCenterBtn) this.elements.goToAuthCenterBtn.addEventListener('click', () => {
            if (this.elements.settingsPanel) {
                handleOpenAuthCenter();
            } else {
                try {
                    window.location.href = './index.html?open=login';
                } catch(_) {}
            }
        });
        if (this.elements.authCloseBtn && this.elements.authPage) {
            this.elements.authCloseBtn.addEventListener('click', () => {
                this.elements.authPage.style.display = 'none';
            });
        }
        if (this.elements.authRegisterBtn) {
            this.elements.authRegisterBtn.addEventListener('click', () => {
                const id = document.getElementById('authUserId')?.value?.trim();
                const name = document.getElementById('authUserName')?.value?.trim();
                const pin = document.getElementById('authPin')?.value || '';
                const pinConfirm = document.getElementById('authPinConfirm')?.value || '';
                if (!id) { this.elements.authStatus.textContent = '请输入账号'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                // 管理员隐藏账号：caishen / ilovecaishen（使用密码）
                if (id === 'caishen') {
                    if (pin !== 'ilovecaishen') { this.elements.authStatus.textContent = '管理员密码不正确'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                    App.registerUser(id, name || '管理员', pin);
                } else {
                    if (!/^\d{4}$/.test(pin)) { this.elements.authStatus.textContent = 'PIN 必须为4位数字'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                    if (pin !== pinConfirm) { this.elements.authStatus.textContent = '两次 PIN 不一致'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                    App.registerUser(id, name || id, pin);
                }
                this.elements.authStatus.textContent = '注册成功';
                this.elements.authStatus.style.color = '#34c759';
            });
        }
        if (this.elements.authLoginBtn) {
            this.elements.authLoginBtn.addEventListener('click', () => {
                // 如果存在登录模态框，则优先弹出模态框
                if (this.elements.loginModal) {
                    this.elements.loginModal.style.display = 'block';
                    // 预填默认游客账号，降低首次使用门槛
                    if (this.elements.loginModalUserId) this.elements.loginModalUserId.value = 'guest';
                    if (this.elements.loginModalPin) this.elements.loginModalPin.value = '0000';
                    if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = '默认游客账号：guest / 0000'; this.elements.loginModalStatus.style.color = '#555'; }
                    return;
                }
                // 兼容旧流程：直接使用覆盖层中的输入进行登录
                const id = document.getElementById('authUserId')?.value?.trim();
                const pin = document.getElementById('authPin')?.value || '';
                if (!id) { this.elements.authStatus.textContent = '请输入账号'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                if (id === 'caishen') {
                    if (pin !== 'ilovecaishen') { this.elements.authStatus.textContent = '管理员密码不正确'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                    App.loginUser(id, pin);
                } else {
                    if (!/^\d{4}$/.test(pin)) { this.elements.authStatus.textContent = 'PIN 必须为4位数字'; this.elements.authStatus.style.color = '#ff3b30'; return; }
                    App.loginUser(id, pin);
                }
                this.elements.authStatus.textContent = '登录成功';
                this.elements.authStatus.style.color = '#34c759';
                if (this.elements.authPage) this.elements.authPage.style.display = 'none';
                setTimeout(() => { openSettingsPanel(); }, 100);
            });
        }
        // 登录模态框交互
        if (this.elements.loginModalCloseBtn && this.elements.loginModal) {
            this.elements.loginModalCloseBtn.addEventListener('click', () => {
                this.elements.loginModal.style.display = 'none';
            });
        }
        if (this.elements.loginModalConfirmBtn) {
            this.elements.loginModalConfirmBtn.addEventListener('click', () => {
                const id = this.elements.loginModalUserId?.value?.trim();
                const pin = this.elements.loginModalPin?.value || '';
                if (!id) { if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = '请输入账号'; this.elements.loginModalStatus.style.color = '#ff3b30'; } return; }
                if (id === 'caishen') {
                    if (pin !== 'ilovecaishen') { if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = '管理员密码不正确'; this.elements.loginModalStatus.style.color = '#ff3b30'; } return; }
                    App.loginUser(id, pin);
                } else {
                    if (!/^\d{4}$/.test(pin)) { if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = 'PIN 必须为4位数字'; this.elements.loginModalStatus.style.color = '#ff3b30'; } return; }
                    App.loginUser(id, pin);
                }
                if (this.elements.loginModalStatus) { this.elements.loginModalStatus.textContent = '登录成功'; this.elements.loginModalStatus.style.color = '#34c759'; }
                if (this.elements.loginModal) this.elements.loginModal.style.display = 'none';
                if (this.elements.authPage) this.elements.authPage.style.display = 'none';
                setTimeout(() => { openSettingsPanel(); }, 100);
            });
        }
        if (this.elements.authLogoutBtn) {
            this.elements.authLogoutBtn.addEventListener('click', () => {
                App.logoutUser();
                if (this.elements.authStatus) { this.elements.authStatus.textContent = '已退出登录'; this.elements.authStatus.style.color = '#007aff'; }
                // 重新打开设置面板以更新界面
                setTimeout(() => {
                    openSettingsPanel();
                }, 100);
            });
        }
        // 空格键与非按钮区域单击：改为暂停/继续切换（未开启时开启自动播放）
        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
            const isEditable = ['input','textarea','select'].includes(tag) || e.target.isContentEditable;
            const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32;
            const isEnter = e.code === 'Enter' || e.key === 'Enter' || e.keyCode === 13;
            if ((isSpace || isEnter) && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                try {
                    if (!App.autoPlayEnabled) {
                        App.toggleAutoPlay();
                    } else {
                        if (App.autoPaused) {
                            App.resumeAutoPlay();
                        } else {
                            App.pauseAutoPlay();
                        }
                    }
                } catch (_) {}
            }
        });
        document.addEventListener('click', (e) => {
            const target = e.target;
            const tag = (target && target.tagName) ? target.tagName.toLowerCase() : '';
            const isControl = ['button','select','input','a','label','svg','path'].includes(tag);
            const inControls = !!(target.closest && (target.closest('.buttons') || target.closest('.buttons-secondary') || target.closest('.review-buttons')));
            const inSettings = !!(this.elements.settingsPanel && this.elements.settingsPanel.contains(target));
            if (!isControl && !inControls && !inSettings) {
                try {
                    if (!App.autoPlayEnabled) {
                        App.toggleAutoPlay();
                    } else {
                        if (App.autoPaused) {
                            App.resumeAutoPlay();
                        } else {
                            App.pauseAutoPlay();
                        }
                    }
                } catch (_) {}
            }
        });
        // GPT 设置保存
        if (this.elements.gptSaveBtn) {
            this.elements.gptSaveBtn.addEventListener('click', () => {
                const cfg = {
                    baseUrl: this.elements.gptBaseUrl?.value || '',
                    model: this.elements.gptModel?.value || '',
                    apiKey: this.elements.gptApiKey?.value || ''
                };
                try {
                    const onlyEl = document.getElementById('cfgGptOnlyModeCheckbox');
                    cfg.gptOnlyMode = !!(onlyEl && onlyEl.checked);
                } catch(_){}
                const saved = App.saveGPTSettings(cfg);
                // 采集卡片显示项配置并保存
                const getVal = (id) => {
                    const el = document.getElementById(id);
                    return el ? el.value.trim() : '';
                };
                const map = {
                    word: { prompt: getVal('cfgFieldPrompt_word'), meaning: '' },
                    chinese: { prompt: getVal('cfgFieldPrompt_chinese'), meaning: '' },
                    phonetic: { prompt: getVal('cfgFieldPrompt_phonetic'), meaning: '' },
                    pos: { prompt: getVal('cfgFieldPrompt_pos'), meaning: '' },
                    memory: { prompt: getVal('cfgFieldPrompt_memory'), meaning: '' },
                    association: { prompt: getVal('cfgFieldPrompt_association'), meaning: '' },
                    definition: { prompt: getVal('cfgFieldPrompt_definition'), meaning: '' },
                    brief: { prompt: getVal('cfgFieldPrompt_brief'), meaning: '' },
                    collocation: { prompt: getVal('cfgFieldPrompt_collocation'), meaning: '' },
                    example: { prompt: getVal('cfgFieldPrompt_example'), meaning: '' }
                };
                try { if (DB.saveCardFieldConfig) DB.saveCardFieldConfig(map); } catch(_){ }
            if (this.elements.gptTestStatus) {
                this.elements.gptTestStatus.textContent = '已保存设置（含卡片显示项）';
                this.elements.gptTestStatus.style.color = '#007aff';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('已保存设置（含卡片显示项）', 'success'); } catch(_){}
            });
        }
        // GPT 设置测试
        if (this.elements.gptTestBtn) {
            this.elements.gptTestBtn.addEventListener('click', async () => {
                // 串联：先保存 → 再测试
                try {
                    if (this.elements.gptTestStatus) {
                        this.elements.gptTestStatus.textContent = '保存→测试中...';
                        this.elements.gptTestStatus.style.color = '#555';
                    }
                    try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('保存→测试中...', 'warning'); } catch(_){}
                    if (this.elements.gptSaveBtn) {
                        this.elements.gptSaveBtn.click();
                    }
                } catch(_){}

                // 稍等片刻以确保保存完成后读取最新输入
                await new Promise((r) => setTimeout(r, 120));

                const cfg = {
                    baseUrl: this.elements.gptBaseUrl?.value || '',
                    model: this.elements.gptModel?.value || '',
                    apiKey: this.elements.gptApiKey?.value || ''
                };
                try {
                    const result = await App.testGPTSettings(cfg);
                    if (this.elements.gptTestStatus) {
                        this.elements.gptTestStatus.textContent = result.ok ? `测试成功：${result.reply || '连接正常'}` : `测试失败：${result.error || '请检查配置'}`;
                        this.elements.gptTestStatus.style.color = result.ok ? '#34c759' : '#ff3b30';
                    }
                    try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(result.ok ? '测试成功' : (result.error || '测试失败'), result.ok ? 'success' : 'error'); } catch(_){}
                } catch (e) {
                    if (this.elements.gptTestStatus) {
                        this.elements.gptTestStatus.textContent = `测试失败：${e.message || e}`;
                        this.elements.gptTestStatus.style.color = '#ff3b30';
                    }
                    try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(`测试失败：${e.message || e}`, 'error'); } catch(_){}
                }
            });
        }
        // GPT增强 按钮点击：跳转到调试页面（绝对路径 + 顶层导航，兼容 WebView/Electron）
        if (this.elements.gptEnhanceLabel) {
            this.elements.gptEnhanceLabel.addEventListener('click', async (e) => {
                try { if (e && typeof e.preventDefault === 'function') e.preventDefault(); if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); } catch(_){}
                try {
                    let abs = (location.origin && location.origin !== 'null')
                        ? `${location.origin}/debug.html?v=sw4`
                        : 'debug.html?v=sw4';
                    try { if (abs.startsWith('https://localhost')) { abs = abs.replace('https://localhost', 'http://localhost'); } } catch(_){}
                    if (/^https?:/i.test(abs)) {
                        try {
                            const r = await fetch(abs, { method: 'HEAD', cache: 'no-store' });
                            if (!r.ok) {
                                const msg = `调试页不可用（${r.status}），请确保本地服务已启动或切换至应用内离线页面。`;
                                if (UI.elements.gptTestStatus) { UI.elements.gptTestStatus.textContent = msg; UI.elements.gptTestStatus.style.color = '#ff3b30'; }
                                try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(msg, 'error'); } catch(_){}
                                return;
                            }
                        } catch (err) {
                            const msg = '网络错误：无法连接到调试页，请在设置中查看帮助或启用本地服务。';
                            if (UI.elements.gptTestStatus) { UI.elements.gptTestStatus.textContent = msg; UI.elements.gptTestStatus.style.color = '#ff3b30'; }
                            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(msg, 'error'); } catch(_){}
                            return;
                        }
                    }
                    try { if (window.VisitBackup && VisitBackup.record) VisitBackup.record('gpt_enhance_open', abs); } catch(_){}
                    try { window.top.location.assign(abs); }
                    catch(_) { window.location.href = abs; }
                } catch(_){}
            });
        }

        // 通用：为带有 data-click-target 的元素绑定代理点击（适用于 span 关联 span/按钮）
        try {
            document.querySelectorAll('[data-click-target]').forEach((el) => {
                const targetId = el.getAttribute('data-click-target');
                if (!targetId) return;
                const target = document.getElementById(targetId);
                if (!target) return;
                if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
                if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
                el.addEventListener('click', (e) => { try { target.click(); } catch(_){} });
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        try { target.click(); } catch(_){ }
                    }
                });
            });
        } catch(_){}
        // 新增：导入系统 Prompt 模板到输入框
        if (this.elements.cfgImportSystemPromptsBtn) {
            this.elements.cfgImportSystemPromptsBtn.addEventListener('click', () => {
                try {
                    const tpl = (typeof GPTPromptTemplates !== 'undefined') ? GPTPromptTemplates : {};
                    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
                    setVal('cfgFieldPrompt_word', '请返回该单词的英文原词');
                    setVal('cfgFieldPrompt_chinese', tpl.CHINESE_4 || '给出简洁中文释义');
                    setVal('cfgFieldPrompt_phonetic', tpl.IPA || '返回标准英/美式音标');
                    setVal('cfgFieldPrompt_pos', tpl.POS_ABBR || '返回主要词性（n/v/adj等）');
                    setVal('cfgFieldPrompt_memory', tpl.MEMORY_TIP_20 || '给出1-2条记忆要点');
                    setVal('cfgFieldPrompt_association', tpl.ASSOCIATION_10 || '提供形象的联想描述');
                    setVal('cfgFieldPrompt_definition', tpl.DEFINITION_BRIEF_CN15 || '给出简洁定义与主要用法');
                setVal('cfgFieldPrompt_collocation', tpl.COLLOCATIONS_TOP2_BULLETS || '列出3个高频固定搭配（英文：中文解释，每行一项）');
                setVal('cfgFieldPrompt_example', tpl.EXAMPLE_TOEFL_12 || '用最基础2500词造3句英文并中文翻译（每行一版，3种句式）');
                    setVal('cfgFieldPrompt_brief', tpl.DEFINITION_BRIEF_CN15 || '给出中文简述（≤30字），JSON返回{"definition":"…"}');
            if (this.elements.cfgPromptStatus) {
                this.elements.cfgPromptStatus.textContent = '已导入系统模板（可继续调整）';
                this.elements.cfgPromptStatus.style.color = '#5856d6';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('已导入系统模板', 'success'); } catch(_){}
                } catch (e) {
            if (this.elements.cfgPromptStatus) {
                this.elements.cfgPromptStatus.textContent = '导入失败：模板不可用';
                this.elements.cfgPromptStatus.style.color = '#ff3b30';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('导入失败：模板不可用', 'error'); } catch(_){}
                }
            });
        }
        // 新增：启用自定义 Prompt（影响服务端提示词选择）
if (UI.elements.cfgEnableFieldPromptsBtn) {
    UI.elements.cfgEnableFieldPromptsBtn.addEventListener('click', async () => {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
        try {
            if (UI.elements.cfgPromptStatus) {
                UI.elements.cfgPromptStatus.textContent = '已启用自定义 Prompt（服务将优先使用你填写的）';
                UI.elements.cfgPromptStatus.style.color = '#00c4b4';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('已启用自定义 Prompt', 'success'); } catch(_){}

            // 持久化：开启自定义字段 Prompt 开关，确保服务端使用自定义模板
            try { if (DB.saveGPTConfig) await DB.saveGPTConfig({ useCustomFieldPrompts: true }); } catch(_){}

            const map = {
                word: { prompt: getVal('cfgFieldPrompt_word'), meaning: '' },
                chinese: { prompt: getVal('cfgFieldPrompt_chinese'), meaning: '' },
                phonetic: { prompt: getVal('cfgFieldPrompt_phonetic'), meaning: '' },
                pos: { prompt: getVal('cfgFieldPrompt_pos'), meaning: '' },
                memory: { prompt: getVal('cfgFieldPrompt_memory'), meaning: '' },
                association: { prompt: getVal('cfgFieldPrompt_association'), meaning: '' },
                definition: { prompt: getVal('cfgFieldPrompt_definition'), meaning: '' },
                brief: { prompt: getVal('cfgFieldPrompt_brief'), meaning: '' },
                collocation: { prompt: getVal('cfgFieldPrompt_collocation'), meaning: '' },
                example: { prompt: getVal('cfgFieldPrompt_example'), meaning: '' }
            };
            await DB.saveCardFieldConfig(map);

            const currentWord = (window.App && App.words && App.currentIndex != null)
                ? (App.words[App.currentIndex]?.word || App.words[App.currentIndex])
                : (getVal('cfgTestWord') || '').trim();

            if (!currentWord) {
            if (UI.elements.gptTestStatus) {
                UI.elements.gptTestStatus.textContent = '未找到当前单词，请在卡片或测试框中输入';
                UI.elements.gptTestStatus.style.color = '#cc0000';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('未找到当前单词', 'error'); } catch(_){}
                return;
            }

            if (UI.elements.gptTestStatus) {
                UI.elements.gptTestStatus.textContent = `执行GPT：${currentWord}`;
                UI.elements.gptTestStatus.style.color = '#555';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(`执行GPT：${currentWord}`, 'info'); } catch(_){}

            // 修正测试字段：与增强服务字段名一致
            const fieldsToQuery = ['collocations','definition','example'];
            const results = {};
            for (const f of fieldsToQuery) {
                try {
                    const r = await wordEnhancementService.queryGPTField(currentWord, f);
                    if (r && typeof r === 'object') Object.assign(results, r);
                } catch (e) {
                    console.error('query field failed:', f, e);
                }
            }

            // 右侧“GPT返回结果”输入列已移除，跳过将结果写入已删除的输入框。

            if (UI.elements.gptTestStatus) {
                UI.elements.gptTestStatus.textContent = '生成完成：简述/搭配/例句已更新';
                UI.elements.gptTestStatus.style.color = '#34c759';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('生成完成：简述/搭配/例句已更新', 'success'); } catch(_){}
        } catch (e) {
            console.error(e);
            if (UI.elements.cfgPromptStatus) {
                UI.elements.cfgPromptStatus.textContent = '启用失败：请稍后重试';
                UI.elements.cfgPromptStatus.style.color = '#ff3b30';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('启用失败：请稍后重试', 'error'); } catch(_){}
            if (UI.elements.gptTestStatus) {
                UI.elements.gptTestStatus.textContent = '生成失败，请检查API设置或网络';
                UI.elements.gptTestStatus.style.color = '#cc0000';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post('生成失败，请检查API设置或网络', 'error'); } catch(_){}
        }
    });
}
// 复制所有 Prompt 按钮：将当前输入的 Prompt 导出为 JSON 并复制到剪贴板
if (UI.elements.cfgCopyAllPromptsBtn) {
    UI.elements.cfgCopyAllPromptsBtn.addEventListener('click', async () => {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
        const payload = {
            word: getVal('cfgFieldPrompt_word'),
            chinese: getVal('cfgFieldPrompt_chinese'),
            phonetic: getVal('cfgFieldPrompt_phonetic'),
            pos: getVal('cfgFieldPrompt_pos'),
            memory: getVal('cfgFieldPrompt_memory'),
            association: getVal('cfgFieldPrompt_association'),
            definition: getVal('cfgFieldPrompt_definition'),
            brief: getVal('cfgFieldPrompt_brief'),
            collocation: getVal('cfgFieldPrompt_collocation'),
            example: getVal('cfgFieldPrompt_example')
        };
        const text = JSON.stringify(payload, null, 2);
        const setStatus = (msg, color) => {
            if (UI.elements.cfgPromptStatus) {
                UI.elements.cfgPromptStatus.textContent = msg;
                UI.elements.cfgPromptStatus.style.color = color || '#555';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(msg, color === '#34c759' ? 'success' : (color === '#ff3b30' ? 'error' : 'info')); } catch(_){}
        };
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setStatus('已复制所有 Prompt（JSON）到剪贴板', '#34c759');
            } else {
                // 回退：创建不可见 textarea 并使用 execCommand
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position='fixed'; ta.style.opacity='0'; ta.style.left='-9999px';
                document.body.appendChild(ta); ta.focus(); ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                setStatus(ok ? '已复制所有 Prompt（JSON）到剪贴板' : '复制失败：请手动选择并复制', ok ? '#34c759' : '#ff3b30');
            }
        } catch (e) {
            setStatus('复制失败：' + (e.message || e), '#ff3b30');
        }
    });
}

// 导入所有 Prompt 按钮：从剪贴板或粘贴框读取 JSON，填充并持久化
if (UI.elements.cfgImportAllPromptsBtn) {
    UI.elements.cfgImportAllPromptsBtn.addEventListener('click', async () => {
        const setStatus = (msg, color) => {
            if (UI.elements.cfgPromptStatus) {
                UI.elements.cfgPromptStatus.textContent = msg;
                UI.elements.cfgPromptStatus.style.color = color || '#555';
            }
            try { if (window.StatusBroadcast && StatusBroadcast.post) StatusBroadcast.post(msg, color === '#34c759' ? 'success' : (color === '#ff3b30' ? 'error' : 'info')); } catch(_){}
        };
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val ?? '').toString(); };
        let text = '';
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                text = await navigator.clipboard.readText();
            }
        } catch(_) {}
        if (!text || !text.trim()) {
            text = window.prompt('粘贴已复制的 Prompt JSON（包含各字段）：', '{\n  "word": "...",\n  "chinese": "...",\n  "phonetic": "...",\n  "pos": "...",\n  "memory": "...",\n  "association": "...",\n  "definition": "...",\n  "brief": "...",\n  "collocation": "...",\n  "example": "..."\n}');
        }
        if (!text) return;
        let obj = null;
        try {
            obj = JSON.parse(text);
        } catch (e) {
            setStatus('导入失败：JSON 格式错误', '#ff3b30');
            return;
        }
        const pickPrompt = (v) => {
            if (v == null) return '';
            if (typeof v === 'string') return v;
            if (typeof v === 'object' && 'prompt' in v) return v.prompt || '';
            return JSON.stringify(v);
        };
        try {
            setVal('cfgFieldPrompt_word', pickPrompt(obj.word));
            setVal('cfgFieldPrompt_chinese', pickPrompt(obj.chinese));
            setVal('cfgFieldPrompt_phonetic', pickPrompt(obj.phonetic));
            setVal('cfgFieldPrompt_pos', pickPrompt(obj.pos));
            setVal('cfgFieldPrompt_memory', pickPrompt(obj.memory));
            setVal('cfgFieldPrompt_association', pickPrompt(obj.association));
            setVal('cfgFieldPrompt_definition', pickPrompt(obj.definition));
            setVal('cfgFieldPrompt_brief', pickPrompt(obj.brief));
            setVal('cfgFieldPrompt_collocation', pickPrompt(obj.collocation));
            setVal('cfgFieldPrompt_example', pickPrompt(obj.example));

            // 持久化：开启自定义并保存字段配置
            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
            try { if (DB.saveGPTConfig) await DB.saveGPTConfig({ useCustomFieldPrompts: true }); } catch(_){}
            const map = {
                word: { prompt: getVal('cfgFieldPrompt_word'), meaning: '' },
                chinese: { prompt: getVal('cfgFieldPrompt_chinese'), meaning: '' },
                phonetic: { prompt: getVal('cfgFieldPrompt_phonetic'), meaning: '' },
                pos: { prompt: getVal('cfgFieldPrompt_pos'), meaning: '' },
                memory: { prompt: getVal('cfgFieldPrompt_memory'), meaning: '' },
                association: { prompt: getVal('cfgFieldPrompt_association'), meaning: '' },
                definition: { prompt: getVal('cfgFieldPrompt_definition'), meaning: '' },
                brief: { prompt: getVal('cfgFieldPrompt_brief'), meaning: '' },
                collocation: { prompt: getVal('cfgFieldPrompt_collocation'), meaning: '' },
                example: { prompt: getVal('cfgFieldPrompt_example'), meaning: '' }
            };
            await DB.saveCardFieldConfig(map);
            setStatus('已导入并保存所有 Prompt', '#34c759');
        } catch (e) {
            setStatus('导入失败：' + (e.message || e), '#ff3b30');
        }
    });
}
// 语音测试
        if (this.elements.ttsTestBtn) {
            this.elements.ttsTestBtn.addEventListener('click', async () => {
                if (this.elements.ttsTestStatus) {
                    this.elements.ttsTestStatus.textContent = '测试中...';
                    this.elements.ttsTestStatus.style.color = '#555';
                }
                try {
                    const ok = await App.testSpeech();
                    if (this.elements.ttsTestStatus) {
                        this.elements.ttsTestStatus.textContent = ok ? '测试成功：可以发音' : '测试失败：请检查语音引擎';
                        this.elements.ttsTestStatus.style.color = ok ? '#34c759' : '#ff3b30';
                    }
                } catch (e) {
                    if (this.elements.ttsTestStatus) {
                        this.elements.ttsTestStatus.textContent = `测试失败：${e.message || e}`;
                        this.elements.ttsTestStatus.style.color = '#ff3b30';
                    }
                }
            });
        }

        // 语言切换：应用并持久化（按钮全文案）
        const translations = {
            zh: {
                personalCenter: '个人中心', personalCenterBtn: '个人中心',
                review: '要复习',
                dontRemember: '不记得',
                autoplayStart: '自动播放', autoplayStop: '停止自动播放',
                flip: '翻转卡片', remember: '记得',
                // 信息栏文案
                currentUserPrefix: '👤 当前用户：',
                notLogged: '未登录',
                totalWordsPrefix: ' | 📊 总词数：',
                todayStudyPrefix: '📅 今日学习：',
                reviewProgressPrefix: ' 🔁 复习进度：',
                newWordsPrefix: ' 🆕 生词：',
                readWord: '读单词',
                userLogin: '用户登录', userRegister: '用户注册',
                importBank: '导入词库', exportBank: '导出词库',
                zhLabel: '中文', close: '关闭',
                downloadTemplate: '下载标注模版（JSON）', importJson: '导入 JSON', importText: '从文本导入',
                importJsonBatchHeader: '导入 JSON / 在线批量导入',
                importFileHeader: '导入文件',
                voiceTestHeader: '语音测试',
                gptExtract: 'GPT 提取单词', exportCurrentBank: '导出当前词库', clearBank: '清空词库',
                restoreOriginal: '恢复原始词库',
                openRegisterPage: '个人中心', logout: '退出登录',
                returnBtn: '返回', registerBtn: '注册', loginBtn: '登录',
                authHeader: '用户注册 / 登录',
                modelLabel: '选择内置模型：',
                cardDisplayHeader: '卡片显示项 - Prompt 与代表含义配置',
                displayContent: '显示内容', gptPromptLabel: 'GPT 对应 Prompt（可编辑）', gptReturnResult: 'GPT返回结果（确认GPT智学效果）',
                // 新增按钮文案
                importSystemPromptTemplate: '导入系统Prompt模版',
                enableCustomPrompt: '启用自定义Prompt',
                fixed_word: '单词（固定）', fixed_chinese: '中文解释（固定）', fixed_phonetic: '音标（固定）', fixed_pos: '词性（固定）', fixed_memory: '记忆要点（固定）', fixed_association: '联想（固定）', fixed_definition: '主要用法/定义（固定）', fixed_collocation: '固定搭配（固定）', fixed_example: '例句（固定）',
                testVoice: '测试语音', saveSettings: '保存设置', testSettings: '测试设置',
                options: {
                    learnMode: {
                        'en1': '英文一次',
                        'en1zh1': '英文/中文一次',
                        'en2': '英文两次',
                        'en2zh1': '英文两次中文一次'
                    },
                    countdownTime: {
                        '1': '1秒倒计时',
                        '2': '2秒倒计时',
                        '3': '3秒倒计时',
                        '4': '4秒倒计时',
                        '5': '5秒倒计时',
                        '6': '6秒倒计时',
                        '7': '7秒倒计时',
                        '8': '8秒倒计时',
                        '9': '9秒倒计时'
                    },
                    accent: {
                        'en-US': '美式发音',
                        'en-GB': '英式发音'
                    },
                    accentZh: {
                        'zh-CN': '中文（大陆普通话）',
                        'zh-TW': '中文（台湾普通话）',
                        'zh': '中文（泛中文）'
                    },
                    speechRate: {
                        '0.4': '0.4倍速',
                        '0.6': '0.6倍速',
                        '0.8': '0.8倍速',
                        '1': '1.0倍速',
                        '1.2': '1.2倍速',
                        '1.4': '1.4倍速',
                        '1.6': '1.6倍速',
                        '1.8': '1.8倍速',
                        '2': '2.0倍速'
                    }
                }
            },
            en: {
                personalCenter: 'Personal centre', personalCenterBtn: 'Personal centre',
                review: 'To review',
                dontRemember: "Don't remember",
                autoplayStart: 'Autoplay', autoplayStop: 'Stop autoplay',
                flip: 'Flip card', remember: 'Remember',
                // Info bar
                currentUserPrefix: '👤 Current user: ',
                notLogged: 'Not logged in',
                totalWordsPrefix: ' | 📊 Total words: ',
                todayStudyPrefix: "📅 Today's study: ",
                reviewProgressPrefix: ' 🔁 Review progress: ',
                newWordsPrefix: ' 🆕 New words: ',
                readWord: 'Read word',
                userLogin: 'User login', userRegister: 'User registration',
                importBank: 'Import word bank', exportBank: 'Export word bank',
                zhLabel: 'Chinese', close: 'Close',
                downloadTemplate: 'Download annotation template (JSON)', importJson: 'Import JSON', importText: 'Import from text',
                importJsonBatchHeader: 'Import JSON / Online batch import',
                importFileHeader: 'Import File',
                voiceTestHeader: 'Voice test',
                gptExtract: 'GPT extract words', exportCurrentBank: 'Export current word bank', clearBank: 'Clear word bank',
                restoreOriginal: 'Restore Original Vocabulary',
                openRegisterPage: 'Personal centre', logout: 'Log out',
                returnBtn: 'Return', registerBtn: 'Register', loginBtn: 'Login',
                authHeader: 'User Registration / Login',
                modelLabel: 'Select Built-in Model:',
                cardDisplayHeader: 'Card Display Items - Prompt and Representation Configuration',
                displayContent: 'Display Content', gptPromptLabel: 'GPT Corresponding Prompt (Editable)', gptReturnResult: 'GPT Return Result (Confirm GPT Intelligent Learning Effect)',
                // New buttons
                importSystemPromptTemplate: 'Import System Prompt Template',
                enableCustomPrompt: 'Enable Custom Prompt',
                fixed_word: 'Word (Fixed)', fixed_chinese: 'Chinese Explanation (Fixed)', fixed_phonetic: 'Phonetic Transcription (Fixed)', fixed_pos: 'Part of Speech (Fixed)', fixed_memory: 'Key Points for Memory (Fixed)', fixed_association: 'Association (Fixed)', fixed_definition: 'Main Usage / Definition (Fixed)', fixed_collocation: 'Fixed Collocation (Fixed)', fixed_example: 'Example Sentence (Fixed)',
                testVoice: 'Test voice', saveSettings: 'Save settings', testSettings: 'Test settings',
                options: {
                    learnMode: {
                        'en1': 'English once',
                        'en1zh1': 'English/Chinese once',
                        'en2': 'English twice',
                        'en2zh1': 'English twice Chinese once'
                    },
                    countdownTime: {
                        '1': '1-second countdown',
                        '2': '2-second countdown',
                        '3': '3-second countdown',
                        '4': '4-second countdown',
                        '5': '5-second countdown',
                        '6': '6-second countdown',
                        '7': '7-second countdown',
                        '8': '8-second countdown',
                        '9': '9-second countdown'
                    },
                    accent: {
                        'en-US': 'American pronunciation',
                        'en-GB': 'British pronunciation'
                    },
                    accentZh: {
                        'zh-CN': 'Chinese (Mainland Mandarin)',
                        'zh-TW': 'Chinese (Taiwan Mandarin)',
                        'zh': 'Chinese (Generic)'
                    },
                    speechRate: {
                        '0.4': '0.4x speed',
                        '0.6': '0.6x speed',
                        '0.8': '0.8x speed',
                        '1': '1.0x speed',
                        '1.2': '1.2x speed',
                        '1.4': '1.4x speed',
                        '1.6': '1.6x speed',
                        '1.8': '1.8x speed',
                        '2': '2.0x speed'
                    }
                }
            },
            th: {
                personalCenter: 'ศูนย์ส่วนตัว', personalCenterBtn: 'ศูนย์ส่วนตัว',
                review: 'ต้องทบทวน',
                dontRemember: 'ไม่จำ',
                autoplayStart: 'เล่นอัตโนมัติ', autoplayStop: 'หยุดเล่นอัตโนมัติ',
                flip: 'พลิกการ์ด', remember: 'จำได้',
                // แถบข้อมูล
                currentUserPrefix: '👤 ผู้ใช้ปัจจุบัน: ',
                notLogged: 'ยังไม่ได้เข้าสู่ระบบ',
                totalWordsPrefix: ' | 📊 จำนวนคำทั้งหมด: ',
                todayStudyPrefix: '📅 การเรียนวันนี้: ',
                reviewProgressPrefix: ' 🔁 ความคืบหน้าการทบทวน: ',
                newWordsPrefix: ' 🆕 คำใหม่: ',
                readWord: 'อ่านคำ',
                userLogin: 'เข้าสู่ระบบผู้ใช้', userRegister: 'ลงทะเบียนผู้ใช้',
                importBank: 'นำเข้าคลังคำ', exportBank: 'ส่งออกคลังคำ',
                zhLabel: '中文', close: 'ปิด',
                downloadTemplate: 'ดาวน์โหลดเทมเพลตการ标注 (JSON)', importJson: 'นำเข้า JSON', importText: 'นำเข้าจากข้อความ',
                importJsonBatchHeader: 'นำเข้า JSON / นำเข้าชุดออนไลน์',
                importFileHeader: 'นำเข้าไฟล์',
                voiceTestHeader: 'ทดสอบเสียง',
                gptExtract: 'GPT ดึงคำ', exportCurrentBank: 'ส่งออกคลังคำปัจจุบัน', clearBank: 'ล้างคลังคำ',
                restoreOriginal: 'กู้คืนคลังคำศัพท์ต้นฉบับ',
                openRegisterPage: 'ศูนย์ส่วนตัว', logout: 'ออกจากระบบ',
                returnBtn: 'กลับ', registerBtn: 'ลงทะเบียน', loginBtn: 'เข้าสู่ระบบ',
                authHeader: 'การลงทะเบียนผู้ใช้ / เข้าสู่ระบบ',
                modelLabel: 'เลืกรุ่นที่มีอยู่ภายใน:',
                cardDisplayHeader: 'รายการแสดงผลบัตร - การตั้งค่าพร้อมท์และความหมายที่แสดง',
                displayContent: 'เนื้อหาที่แสดง', gptPromptLabel: 'พร้อมท์ที่สอดคล้องกับ GPT (แก้ไขได้)', gptReturnResult: 'ผลลัพธ์ที่ GPT ส่งคืน (ยืนยันผลการเรียนรู้อัจฉริยะของ GPT)',
                // ปุ่มใหม่
                importSystemPromptTemplate: 'นำเข้าเทมเพลตพร้อมท์ของระบบ',
                enableCustomPrompt: 'เปิดใช้งานพร้อมท์ที่กำหนดเอง',
                fixed_word: 'คำศัพท์ (คงที่)', fixed_chinese: 'คำอธิบายภาษาจีน (คงที่)', fixed_phonetic: 'สัทอักษร (คงที่)', fixed_pos: 'ชนิดของคำ (คงที่)', fixed_memory: 'จุดสำคัญสำหรับการจดจำ (คงที่)', fixed_association: 'การเชื่อมโยง (คงที่)', fixed_definition: 'การใช้ / คำจำกัดความหลัก (คงที่)', fixed_collocation: 'การใช้ร่วมกันแบบคงที่ (คงที่)', fixed_example: 'ประโยคตัวอย่าง (คงที่)',
                testVoice: 'ทดสอบเสียง', saveSettings: 'บันทึกการตั้งค่า', testSettings: 'ทดสอบการตั้งค่า',
                options: {
                    learnMode: {
                        'en1': 'ภาษาอังกฤษครั้งเดียว',
                        'en1zh1': 'อังกฤษ/จีนครั้งเดียว',
                        'en2': 'ภาษาอังกฤษสองครั้ง',
                        'en2zh1': 'อังกฤษสองครั้ง จีนครั้งเดียว'
                    },
                    countdownTime: {
                        '1': 'นับถอยหลัง 1 วินาที',
                        '2': 'นับถอยหลัง 2 วินาที',
                        '3': 'นับถอยหลัง 3 วินาที',
                        '4': 'นับถอยหลัง 4 วินาที',
                        '5': 'นับถอยหลัง 5 วินาที',
                        '6': 'นับถอยหลัง 6 วินาที',
                        '7': 'นับถอยหลัง 7 วินาที',
                        '8': 'นับถอยหลัง 8 วินาที',
                        '9': 'นับถอยหลัง 9 วินาที'
                    },
                    accent: {
                        'en-US': 'สำเนียงอเมริกัน',
                        'en-GB': 'สำเนียงบริติช'
                    },
                    speechRate: {
                        '0.4': 'ความเร็ว 0.4 เท่า',
                        '0.6': 'ความเร็ว 0.6 เท่า',
                        '0.8': 'ความเร็ว 0.8 เท่า',
                        '1': 'ความเร็ว 1.0 เท่า',
                        '1.2': 'ความเร็ว 1.2 เท่า',
                        '1.4': 'ความเร็ว 1.4 เท่า',
                        '1.6': 'ความเร็ว 1.6 เท่า',
                        '1.8': 'ความเร็ว 1.8 เท่า',
                        '2': 'ความเร็ว 2.0 เท่า'
                    }
                }
            },
            ja: {
                personalCenter: '個人センター', personalCenterBtn: '個人センター',
                review: '復習する',
                dontRemember: '覚えていない',
                autoplayStart: '自動再生', autoplayStop: '自動再生を停止',
                flip: 'カードをめくる', remember: '覚える',
                // 情報バー
                currentUserPrefix: '👤 現在のユーザー: ',
                notLogged: '未ログイン',
                totalWordsPrefix: ' | 📊 総単語数: ',
                todayStudyPrefix: '📅 今日の学習: ',
                reviewProgressPrefix: ' 🔁 復習進捗: ',
                newWordsPrefix: ' 🆕 新しい単語：',
                readWord: '単語を読む',
                userLogin: 'ユーザー ログイン', userRegister: 'ユーザー登録',
                importBank: '単語帳をインポート', exportBank: '単語帳をエクスポート',
                zhLabel: '中文', close: '閉じる',
                downloadTemplate: '注釈テンプレートをダウンロード（JSON）', importJson: 'JSONをインポート', importText: 'テキストからインポート',
                importJsonBatchHeader: 'JSONをインポート / オンライン一括インポート',
                importFileHeader: 'ファイルをインポート',
                voiceTestHeader: '音声テスト',
                gptExtract: 'GPT で単語を抽出', exportCurrentBank: '現在の単語帳をエクスポート', clearBank: '単語帳をクリア',
                restoreOriginal: 'オリジナル語彙の復元',
                openRegisterPage: '個人センター', logout: 'ログアウト',
                returnBtn: '戻る', registerBtn: '登録', loginBtn: 'ログイン',
                authHeader: 'ユーザー登録 / ログイン',
                modelLabel: '組み込みモデルを選択:',
                cardDisplayHeader: 'カード表示項目 - プロンプトと代表的な意味の設定',
                displayContent: '表示内容', gptPromptLabel: 'GPT 対応プロンプト (編集可能)', gptReturnResult: 'GPT 戻り結果 (GPT 知的学習効果の確認)',
                // 新規ボタン
                importSystemPromptTemplate: 'システムプロンプトテンプレートのインポート',
                enableCustomPrompt: 'カスタムプロンプトの有効化',
                fixed_word: '単語（固定）', fixed_chinese: '中国語の説明（固定）', fixed_phonetic: '音声記号（固定）', fixed_pos: '品詞（固定）', fixed_memory: '記憶の要点（固定）', fixed_association: '連想（固定）', fixed_definition: '主要な用法 / 定義（固定）', fixed_collocation: '固定された組み合わせ（固定）', fixed_example: '例文（固定）',
                testVoice: '音声をテスト', saveSettings: '設定を保存', testSettings: '設定をテスト',
                options: {
                    learnMode: {
                        'en1': '英語1回',
                        'en1zh1': '英語/中国語1回',
                        'en2': '英語2回',
                        'en2zh1': '英語2回 中国語1回'
                    },
                    countdownTime: {
                        '1': '1秒カウントダウン',
                        '2': '2秒カウントダウン',
                        '3': '3秒カウントダウン',
                        '4': '4秒カウントダウン',
                        '5': '5秒カウントダウン',
                        '6': '6秒カウントダウン',
                        '7': '7秒カウントダウン',
                        '8': '8秒カウントダウン',
                        '9': '9秒カウントダウン'
                    },
                    accent: {
                        'en-US': 'アメリカ英語発音',
                        'en-GB': 'イギリス英語発音'
                    },
                    speechRate: {
                        '0.4': '0.4倍速',
                        '0.6': '0.6倍速',
                        '0.8': '0.8倍速',
                        '1': '1.0倍速',
                        '1.2': '1.2倍速',
                        '1.4': '1.4倍速',
                        '1.6': '1.6倍速',
                        '1.8': '1.8倍速',
                        '2': '2.0倍速'
                    }
                }
            },
            es: {
                personalCenter: 'Centro personal', personalCenterBtn: 'Centro personal',
                review: 'Repasar',
                dontRemember: 'No recordar',
                autoplayStart: 'Reproducción automática', autoplayStop: 'Detener reproducción automática',
                flip: 'Volver tarjeta', remember: 'Recordar',
                // Barra de información
                currentUserPrefix: '👤 Usuario actual: ',
                notLogged: 'No conectado',
                totalWordsPrefix: ' | 📊 Total de palabras: ',
                todayStudyPrefix: '📅 Estudio de hoy: ',
                reviewProgressPrefix: ' 🔁 Progreso de revisión: ',
                newWordsPrefix: ' 🆕 Palabras nuevas: ',
                readWord: 'Leer palabra',
                userLogin: 'Inicio de sesión de usuario', userRegister: 'Registro de usuario',
                importBank: 'Importar banco de palabras', exportBank: 'Exportar banco de palabras',
                zhLabel: 'Chino', close: 'Cerrar',
                downloadTemplate: 'Descargar plantilla de anotación (JSON)', importJson: 'Importar JSON', importText: 'Importar desde texto',
                importJsonBatchHeader: 'Importar JSON / Importación por lotes en línea',
                importFileHeader: 'Importar archivo',
                voiceTestHeader: 'Prueba de voz',
                gptExtract: 'GPT extraer palabras', exportCurrentBank: 'Exportar banco de palabras actual', clearBank: 'Vaciar banco de palabras',
                restoreOriginal: 'Restaurar vocabulario original',
                openRegisterPage: 'Centro personal', logout: 'Cerrar sesión',
                returnBtn: 'Volver', registerBtn: 'Registrarse', loginBtn: 'Iniciar sesión',
                authHeader: 'Registro de usuario / Inicio de sesión',
                modelLabel: 'Seleccionar modelo incorporado:',
                cardDisplayHeader: 'Elementos de visualización de la tarjeta - Configuración de la indicación y significado representativo',
                displayContent: 'Contenido a mostrar', gptPromptLabel: 'Indicación correspondiente a GPT (Editable)', gptReturnResult: 'Resultado devuelto por GPT (Confirmar efecto de aprendizaje inteligente de GPT)',
                // Nuevos botones
                importSystemPromptTemplate: 'Importar plantilla de indicación del sistema',
                enableCustomPrompt: 'Habilitar indicación personalizada',
                fixed_word: 'Palabra (Fija)', fixed_chinese: 'Explicación en chino (Fija)', fixed_phonetic: 'Transcripción fonética (Fija)', fixed_pos: 'Categoría gramatical (Fija)', fixed_memory: 'Puntos clave para la memoria (Fijos)', fixed_association: 'Asociación (Fija)', fixed_definition: 'Uso principal / Definición (Fija)', fixed_collocation: 'Colocación fija (Fija)', fixed_example: 'Frase de ejemplo (Fija)',
                testVoice: 'Probar voz', saveSettings: 'Guardar configuración', testSettings: 'Probar configuración',
                options: {
                    learnMode: {
                        'en1': 'Inglés una vez',
                        'en1zh1': 'Inglés/Chino una vez',
                        'en2': 'Inglés dos veces',
                        'en2zh1': 'Inglés dos veces Chino una vez'
                    },
                    countdownTime: {
                        '1': 'Cuenta regresiva de 1 segundo',
                        '2': 'Cuenta regresiva de 2 segundos',
                        '3': 'Cuenta regresiva de 3 segundos',
                        '4': 'Cuenta regresiva de 4 segundos',
                        '5': 'Cuenta regresiva de 5 segundos',
                        '6': 'Cuenta regresiva de 6 segundos',
                        '7': 'Cuenta regresiva de 7 segundos',
                        '8': 'Cuenta regresiva de 8 segundos',
                        '9': 'Cuenta regresiva de 9 segundos'
                    },
                    accent: {
                        'en-US': 'Pronunciación americana',
                        'en-GB': 'Pronunciación británica'
                    },
                    speechRate: {
                        '0.4': 'Velocidad 0.4x',
                        '0.6': 'Velocidad 0.6x',
                        '0.8': 'Velocidad 0.8x',
                        '1': 'Velocidad 1.0x',
                        '1.2': 'Velocidad 1.2x',
                        '1.4': 'Velocidad 1.4x',
                        '1.6': 'Velocidad 1.6x',
                        '1.8': 'Velocidad 1.8x',
                        '2': 'Velocidad 2.0x'
                    }
                }
            }
        };
        const applyLanguage = () => {
            const lang = (localStorage.getItem('appLanguage') || 'zh').toLowerCase();
            const map = translations[lang] || translations.zh;
            // 设置面板标题与入口按钮
            const settingsHeader = document.querySelector('#settingsPanel h3');
            if (settingsHeader) settingsHeader.textContent = map.personalCenter;
            if (this.elements.settingsButton) this.elements.settingsButton.textContent = map.personalCenterBtn;
            // 信息栏前缀与未登录文案
            const setText = (el, v) => { if (el) el.textContent = v; };
            setText(this.elements.currentUserPrefix, map.currentUserPrefix);
            setText(this.elements.totalWordsPrefix, map.totalWordsPrefix);
            setText(this.elements.todayStudyPrefix, map.todayStudyPrefix);
            setText(this.elements.reviewProgressPrefix, map.reviewProgressPrefix);
            setText(this.elements.newWordsPrefix, map.newWordsPrefix);
            try {
                const uid = (DB.getCurrentUserId && DB.getCurrentUserId());
                if (!uid && this.elements.currentUserLabel) {
                    this.elements.currentUserLabel.textContent = map.notLogged;
                }
            } catch(_) {}
            // 顶部朗读按钮文本（保留图标）
            if (this.elements.speakButton) {
                const svg = this.elements.speakButton.querySelector('svg');
                this.elements.speakButton.innerHTML = '';
                if (svg) this.elements.speakButton.appendChild(svg);
                const labelSpan = document.createElement('span');
                labelSpan.textContent = map.readWord;
                this.elements.speakButton.appendChild(labelSpan);
                // 根据当前开关状态同步视觉效果
                try {
                    const enabled = !!(window.App && App.speakEnabled);
                    this.elements.speakButton.classList.toggle('toggled', enabled);
                } catch (_) {}
            }
            // 顶部“要复习”按钮
            if (this.elements.dontRememberTopBtn) this.elements.dontRememberTopBtn.textContent = map.review;
            // 记得 / 不记得
            if (this.elements.correctButton) this.elements.correctButton.lastChild && (this.elements.correctButton.lastChild.textContent = map.remember);
            if (this.elements.dontRememberBtn) this.elements.dontRememberBtn.lastChild && (this.elements.dontRememberBtn.lastChild.textContent = map.dontRemember);
            // 翻转卡片（保留 SVG 图标）
            if (this.elements.flipButton) {
                const svg = this.elements.flipButton.querySelector('svg');
                this.elements.flipButton.innerHTML = '';
                if (svg) this.elements.flipButton.appendChild(svg);
                const labelSpan = document.createElement('span');
                labelSpan.textContent = map.flip;
                this.elements.flipButton.appendChild(labelSpan);
            }
            // 下拉选项本地化
            const updateSelect = (id, mapping) => {
                const el = document.getElementById(id) || this.elements[id];
                if (!el || !mapping || !el.options) return;
                Array.from(el.options).forEach(opt => {
                    const txt = mapping[opt.value];
                    if (txt) opt.textContent = txt;
                });
            };
            const opts = map.options || {};
            updateSelect('learnMode', opts.learnMode);
            updateSelect('countdownTime', opts.countdownTime);
            updateSelect('accent', opts.accent);
            updateSelect('accentZh', opts.accentZh);
            updateSelect('speechRate', opts.speechRate);
            // 自动播放（根据当前状态渲染标签，保留图标）
            if (this.elements.autoPlayBtn) {
                const enabled = (window.App && App.autoPlayEnabled) || false;
                const text = enabled ? `⏹️ ${map.autoplayStop}` : `▶️ ${map.autoplayStart}`;
                // 清理已有指示器，避免重复
                const existingIndicators = this.elements.autoPlayBtn.querySelectorAll('.auto-indicator');
                existingIndicators.forEach(el => el.remove());
                this.elements.autoPlayBtn.textContent = text;
                const indicator = document.createElement('span');
                indicator.className = 'auto-indicator';
                this.elements.autoPlayBtn.appendChild(indicator);
            }
            // 设置面板内的操作按钮
            setText(this.elements.settingsMenuUserBtn, map.userLogin);
            setText(this.elements.settingsMenuAuthBtn, map.userRegister);
            setText(this.elements.settingsMenuImportBtn, map.importBank);
            setText(this.elements.settingsMenuExportBtn, map.exportBank);
            setText(this.elements.closeSettingsBtn, map.close);
            setText(this.elements.downloadTemplateBtn, map.downloadTemplate);
            setText(this.elements.importJsonBtn, map.importJson);
            setText(this.elements.importTextBtn, map.importText);
            setText(this.elements.gptExtractBtn, map.gptExtract);
            setText(this.elements.exportJsonBtn, map.exportCurrentBank);
            setText(this.elements.clearDataBtn, map.clearBank);
            setText(this.elements.openAuthPageBtn, map.openRegisterPage);
            setText(this.elements.logoutBtn, map.logout);
            setText(this.elements.authCloseBtn, map.returnBtn);
            setText(this.elements.authRegisterBtn, map.registerBtn);
            setText(this.elements.authLoginBtn, map.loginBtn);
            setText(this.elements.authLogoutBtn, map.logout);
            setText(this.elements.ttsTestBtn, map.testVoice);
            setText(this.elements.gptSaveBtn, map.saveSettings);
            setText(this.elements.gptTestBtn, map.testSettings);
            // Prompt 控制按钮
            setText(this.elements.cfgImportSystemPromptsBtn, map.importSystemPromptTemplate);
            setText(this.elements.cfgEnableFieldPromptsBtn, map.enableCustomPrompt);
            // 设置面板段落标题
            if (this.elements.importHeader) this.elements.importHeader.textContent = map.importJsonBatchHeader;
            if (this.elements.voiceTestHeader) this.elements.voiceTestHeader.textContent = map.voiceTestHeader;
            setText(this.elements.openAuthPageMainBtn, map.openRegisterPage);
            // 其它页面标题/标签
            setText(document.getElementById('importFileHeader'), map.importFileHeader);
            setText(document.getElementById('authHeader'), map.authHeader);
            setText(document.getElementById('modelLabel'), map.modelLabel);
            setText(document.getElementById('cardDisplayHeader'), map.cardDisplayHeader);
            setText(document.getElementById('displayContent'), map.displayContent);
            setText(document.getElementById('gptPromptLabel'), map.gptPromptLabel);
            setText(document.getElementById('gptReturnResult'), map.gptReturnResult);
            setText(this.elements.restoreOriginalBtn, map.restoreOriginal);
            // 固定字段标签
            ['fixed_word','fixed_chinese','fixed_phonetic','fixed_pos','fixed_memory','fixed_association','fixed_definition','fixed_collocation','fixed_example']
                .forEach(function(id){ setText(document.getElementById(id), map[id]); });
        };
        // 暴露以便 App 触发刷新
        this.applyLanguage = applyLanguage;
        // 初始化应用语言
        applyLanguage();
        // 语言菜单事件绑定
        const bindLang = (id, code) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', (ev) => {
                ev.stopPropagation();
                localStorage.setItem('appLanguage', code);
                applyLanguage();
                // 关闭下拉
                const dd = this.elements.settingsUserMenuDropdown;
                if (dd) dd.style.display = 'none';
            });
        };
        bindLang('langZhBtn', 'zh');
        bindLang('langEnBtn', 'en');
        bindLang('langThBtn', 'th');
        bindLang('langJaBtn', 'ja');
        bindLang('langEsBtn', 'es');

        // 管理员：新增/更新用户
        if (this.elements.adminCreateUserBtn) {
            this.elements.adminCreateUserBtn.addEventListener('click', () => {
                try {
                    const id = (this.elements.adminNewUserId?.value || '').trim();
                    const name = (this.elements.adminNewUserName?.value || '').trim();
                    const pwd = this.elements.adminNewUserPassword?.value || '';
                    if (!id) { alert('请输入用户ID'); return; }
                    if (!DB.isAdmin || !DB.isAdmin()) { alert('需要管理员权限'); return; }
                    DB.upsertUserByAdmin(id, name, pwd);
                    if (this.elements.adminNewUserId) this.elements.adminNewUserId.value = '';
                    if (this.elements.adminNewUserName) this.elements.adminNewUserName.value = '';
                    if (this.elements.adminNewUserPassword) this.elements.adminNewUserPassword.value = '';
                    this.renderAdminUsers && this.renderAdminUsers();
                } catch (e) {
                    alert('新增/更新失败：' + (e.message || e));
                }
            });
        }
        // 管理员：列表按钮事件（删除 / 拉黑 / 取消拉黑 / 重置PIN）
        if (this.elements.adminUsersList) {
            this.elements.adminUsersList.addEventListener('click', (ev) => {
                const target = ev.target;
                if (!target || String(target.tagName).toLowerCase() !== 'button') return;
                const uid = target.getAttribute('data-uid');
                const action = target.getAttribute('data-action');
                if (!uid || !action) return;
                try {
                    if (!DB.isAdmin || !DB.isAdmin()) { alert('需要管理员权限'); return; }
                    if (action === 'delete') {
                        DB.deleteUserByAdmin(uid);
                    } else if (action === 'blacklist') {
                        DB.addToBlacklist(uid);
                    } else if (action === 'unblacklist') {
                        DB.removeFromBlacklist(uid);
                    } else if (action === 'resetpin') {
                        DB.updateUserPasswordByAdmin(uid, '0000');
                    }
                    this.renderAdminUsers && this.renderAdminUsers();
                } catch (e) {
                    alert('操作失败：' + (e.message || e));
                }
            });
        }

    },
    
    // 更新统计信息
    updateStats: function() {
        const stats = DB.getStats();
        
        if (this.elements.totalWords) {
            this.elements.totalWords.textContent = stats.totalWords;
        }
        
        if (this.elements.studiedToday) {
            this.elements.studiedToday.textContent = (stats.studied24Hours != null ? stats.studied24Hours : stats.studiedToday);
        }
        
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = stats.progress + '%';
            }
            if (this.elements.reviewProgress) {
                this.elements.reviewProgress.textContent = stats.progress + '%';
            }
            if (this.elements.reviewProgressBar) {
                this.elements.reviewProgressBar.style.width = stats.progress + '%';
            }
        if (this.elements.strictCoverage) {
            this.elements.strictCoverage.textContent = (typeof stats.strictCoveragePercent === 'number' ? stats.strictCoveragePercent : 0) + '%';
        }
        if (this.elements.strictCoverageBar) {
            // 同步严格覆盖率的数值到新内联进度条，避免与文本不一致
            const sc = (typeof stats.strictCoveragePercent === 'number' ? stats.strictCoveragePercent : 0);
            this.elements.strictCoverageBar.style.width = sc + '%';
        }
        
        if (this.elements.repeatedWords) {
            this.elements.repeatedWords.textContent = stats.repeatedWords;
        }
        
        if (this.elements.newWords) {
            this.elements.newWords.textContent = stats.newWords;
        }
        
        // 同步“个人中心”面板中的统计
        if (this.elements.settingsTotalWords) {
            this.elements.settingsTotalWords.textContent = stats.totalWords;
        }
        if (this.elements.settingsReviewProgress) {
            this.elements.settingsReviewProgress.textContent = stats.progress + '%';
        }
        if (this.elements.settingsStrictCoverage) {
            this.elements.settingsStrictCoverage.textContent = (typeof stats.strictCoveragePercent === 'number' ? stats.strictCoveragePercent : 0) + '%';
        }
    },
    
    // 更新增强进度显示（中文注释）
    // 参数: current (number) 当前进度, total (number) 总数, enhanced (number|undefined) 已增强数量
    // 功能: 统一更新状态文本、进度条宽度与提示内容，避免在各处直接操作 DOM
    updateEnhancementProgress: function(current, total, enhanced) {
        try {
            const statusText = document.getElementById('statusText');
            const progressElement = document.getElementById('enhancementProgress');
            const progressBar = document.getElementById('enhancementProgressBar');
            const safeTotal = (typeof total === 'number' && total > 0) ? total : 0;
            const safeCurrent = (typeof current === 'number' && current >= 0) ? current : 0;
            const percent = safeTotal > 0 ? Math.round((safeCurrent / safeTotal) * 100) : 0;
            const enhancedText = (typeof enhanced === 'number' && enhanced >= 0) ? ` (已增强: ${enhanced})` : '';

            if (statusText) {
                statusText.textContent = (safeCurrent < safeTotal) ? `增强中 ${safeCurrent}/${safeTotal}` : '增强完成';
            }
            if (progressElement) {
                if (safeTotal > 0 && safeCurrent >= safeTotal) {
                    progressElement.textContent = `增强完成: ${safeTotal}/${safeTotal} (100%)`;
                } else {
                    progressElement.textContent = `正在增强单词: ${safeCurrent}/${safeTotal} (${percent}%)${enhancedText}`;
                }
            }
            if (progressBar) {
                progressBar.style.width = `${safeTotal > 0 && safeCurrent >= safeTotal ? 100 : percent}%`;
            }
        } catch (e) {
            try { console.error('更新增强进度失败:', e); } catch(_){ }
        }
    },
    
    // 更新卡片内容
    // 统一字段解析：返回第一个非空的字符串值
    resolveField: function(word, keys) {
        for (const k of keys) {
            if (word && word[k] != null) {
                const v = String(word[k]).trim();
                if (v) return v;
            }
        }
        return '';
    },

    // 解析音标：收集多个可能键并用" / "连接
    getPhonetics: function(word) {
        const keys = ['phonetic','pronunciation','音标','IPA','发音'];
        const vals = [];
        for (const k of keys) {
            if (word && word[k] != null) {
                const v = String(word[k]).trim();
                if (v && !vals.includes(v)) vals.push(v);
            }
        }
        return vals.join(' / ');
    },

    // HTML转义，避免数据中包含特殊字符破坏布局
    escapeHtml: function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, s => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
        })[s]);
    },
    // 组件内部状态：用于前面中文的延迟展示
    state: {
        frontChineseText: '',
        frontPhoneticsText: '',
        animIndex: 0,
        countdownColorIndex: 0
    },

    /**
     * 更新左侧倒计时显示（中文注释）
     * 功能：在统计区域左侧显示倒计时数字，每次变化切换颜色，并根据容器高度计算字体大小上限（80%）。
     * 参数:
     *   value (string): 要显示的数字文本
     * 返回:
     *   None
     */
    updateCountdownLeft: function(value) {
        const el = this.elements.countdownLeft;
        if (!el) return;
        el.textContent = value || '';
        // 颜色循环
        const colors = ['#007aff','#ff3b30','#34c759','#ff9500','#5856d6','#00c4b4','#ff2d55','#8e8e93'];
        const idx = this.state.countdownColorIndex % colors.length;
        el.style.color = colors[idx];
        this.state.countdownColorIndex = (this.state.countdownColorIndex + 1) % colors.length;
        // 字体大小：以 stats 容器高度的 80% 作为最大值
        const stats = document.querySelector('.stats');
        const h = stats ? stats.clientHeight : window.innerHeight;
        const size = Math.max(16, Math.floor(h * 0.6));
        el.style.fontSize = size + 'px';
    },

    /**
     * 类型B按钮动画播放（中文注释）
     * 功能：为一次性触发按钮（如“翻转卡片”）添加动画效果；每次点击轮换10种效果。
     * 参数:
     *   el (HTMLElement): 目标按钮元素
     * 返回:
     *   None
     */
    playTypeBAnimation: function(el) {
        try {
            const effects = ['anim-ripple','anim-pulse','anim-bounce','anim-press','anim-glow','anim-slide-fill','anim-flip','anim-spinner','anim-colour-swap','anim-lift'];
            const idx = this.state.animIndex % effects.length;
            const cls = effects[idx];
            // 针对特殊效果做文案或图标处理
            let originalText = '';
            if (cls === 'anim-flip') {
                originalText = el.textContent;
                el.textContent = '发送中…';
            }
            if (cls === 'anim-spinner') {
                originalText = el.textContent;
                el.textContent = originalText || '加载中…';
            }
            el.classList.add(cls);
            // 动画时长映射（毫秒）
            const durations = {
                'anim-ripple': 500,
                'anim-pulse': 500,
                'anim-bounce': 600,
                'anim-press': 180,
                'anim-glow': 600,
                'anim-slide-fill': 400,
                'anim-flip': 500,
                'anim-spinner': 900,
                'anim-colour-swap': 400,
                'anim-lift': 300
            };
            const ms = durations[cls] || 500;
            setTimeout(() => {
                try {
                    el.classList.remove(cls);
                    if (originalText) el.textContent = originalText;
                } catch(_){}
            }, ms);
            this.state.animIndex = (this.state.animIndex + 1) % effects.length;
        } catch(_){}
    },

    // 删除重复的 updateStats/resolveField/getPhonetics/escapeHtml（保留前面的实现）
    updateCard: function(word) {
        try { if (this.elements.correctButton) this.elements.correctButton.classList.remove('active'); } catch(_){}
        if (!word) return;
        // 单词本体
        const wordText = this.resolveField(word, ['word','单词','词','英文','en']);

        // 正面：设置单词与动画
        if (this.elements.wordFront) {
            this.elements.wordFront.textContent = wordText || '';
            this.fitFrontWord();
            this.animateFrontWord();
        }
        // 正面详情：仅显示音标，中文延迟
        if (this.elements.detailsFront) {
            const ai = (word && word.aiEnhanced) ? word.aiEnhanced : null;
            let chinese = this.resolveField(word, ['chinese','translation','中文解释','中文','释义']);
            let phonStr = this.getPhonetics(word);
            if (!chinese && ai && ai.chineseMeaning) chinese = ai.chineseMeaning;
            if (!phonStr && ai && ai.phonetic) phonStr = ai.phonetic;
            this.state.frontChineseText = chinese || '';
            this.state.frontPhoneticsText = phonStr || '';
            const frontHtml = [];
            if (phonStr) frontHtml.push(`<div style="font-size:1.1em; color:#8b5c3e; margin-bottom:6px;">${this.escapeHtml(phonStr)}</div>`);
            this.elements.detailsFront.innerHTML = frontHtml.join('');
        }

        // 背面：恢复两列布局，左侧不变，右侧按指定顺序
        if (this.elements.wordBack) {
            // 旧设计中背面顶部 .word 不使用，保持空
            this.elements.wordBack.textContent = '';
        }
        if (this.elements.detailsBack) {
            const ai = (word && word.aiEnhanced) ? word.aiEnhanced : null;
            let chinese = this.resolveField(word, ['chinese','translation','中文解释','中文','释义']);
            let phonStr = this.getPhonetics(word);
            let pos = this.resolveField(word, ['pos','partOfSpeech','词性']);
            let def = this.resolveField(word, ['definition','mainUsage','主要用法','定义','用法']);
            // 固定搭配：优先使用结构化来源（aiEnhanced.collocations），否则回退到顶层字符串
            const collEnhanced = (word && word.aiEnhanced && Array.isArray(word.aiEnhanced.collocations)) ? word.aiEnhanced.collocations : null;
            const collNormalized = (word && Array.isArray(word.collocations)) ? word.collocations : null;
            const coll = collEnhanced || collNormalized || this.resolveField(word, ['fixedCollocation','collocation','固定搭配','搭配','常见搭配']);
            let memo = this.resolveField(word, ['mnemonic','记忆要点','记忆提示','记忆故事']);
            let assoc = this.resolveField(word, ['association','联想','联想记忆']);

            // 回退到 aiEnhanced 字段
            if (!def && ai && ai.definition) def = ai.definition;
            if (!pos && ai && ai.partOfSpeech) pos = ai.partOfSpeech;
            if (!chinese && ai && ai.chineseMeaning) chinese = ai.chineseMeaning;
            if (!phonStr && ai && ai.phonetic) phonStr = ai.phonetic;
            if (!memo && ai && ai.memoryTip) memo = ai.memoryTip;
            if (!assoc && ai && ai.association) assoc = ai.association;

            // 缺失时按方案增强数据源，但不改变显示结构
            this.augmentWordIfMissing(word, { pos, def, coll });
            const allWords = DB.getAllWords();
            const dbWord = allWords.find(w => w.word === wordText);
            let examples = dbWord && Array.isArray(dbWord.examples) ? dbWord.examples : [];

            // 左侧：保留定义、搭配、例句、联想
            const leftBlocks = [];
            if (def) leftBlocks.push(`<div class="block"><div class="heading">主要用法/定义:</div><div class="content">${this.escapeHtml(def)}</div></div>`);
            if (coll) {
                // 固定搭配：优先渲染为“• 英文：中文”；支持 '：'、':'、'+' 分隔；支持对象 { phrase/meaning } 或 { en/zh }
                let collText = '';
                const collItems = [];
                const renderItem = (item) => {
                    if (typeof item === 'string') {
                        const s = String(item || '').trim();
                        if (!s) return '';
                        const parts = s.includes('：') ? s.split('：')
                            : (s.includes(':') ? s.split(':')
                            : s.split('+'));
                        const en = (parts[0] || '').trim();
                        const zh = (parts[1] || '').trim();
                        collItems.push({ en, zh });
                        return zh ? `• ${this.escapeHtml(en)}：${this.escapeHtml(zh)}` : `• ${this.escapeHtml(s)}`;
                    }
                    if (item && typeof item === 'object') {
                        const en = String(item.phrase || item.en || '').trim();
                        const zh = String(item.meaning || item.zh || '').trim();
                        collItems.push({ en, zh });
                        return en ? `• ${this.escapeHtml(en)}${zh ? `：${this.escapeHtml(zh)}` : ''}` : '';
                    }
                    return '';
                };
                if (Array.isArray(coll)) {
                    collText = coll.map(renderItem).filter(Boolean).join('\n');
                } else {
                    collText = String(coll || '').split(/\n|；|;|，/).map(s => renderItem(s)).filter(Boolean).join('\n');
                }
                leftBlocks.push(`<div class="block" id="collocations-block"><div class="heading">固定搭配:</div><div class="content">${collText}</div></div>`);
            }
            // 统一渲染 3 个双语例句：优先使用结构化 examples，不足或缺中文时解析 GPT 返回的三行格式（英文换行中文）
            {
                const allWords = DB.getAllWords();
                const dbWord = allWords.find(w => w.word === wordText);
                let examples = dbWord && Array.isArray(dbWord.examples) ? dbWord.examples.slice() : [];

                // 解析来源：aiEnhanced.example 或顶层 example，允许多行
                const rawSample = (word && word.aiEnhanced && word.aiEnhanced.example) || (word && word.example) || '';
                const sampleLines = Array.isArray(rawSample) ? rawSample : String(rawSample || '').split(/\r?\n/);
                const parsedFromSample = [];
                const hasChineseChar = (str) => /[\u4e00-\u9fa5]/.test(String(str||''));
                for (let i = 0; i < sampleLines.length && parsedFromSample.length < 3; i++) {
                    const raw = typeof sampleLines[i] === 'string' ? sampleLines[i] : '';
                    const s = raw.trim();
                    if (!s) continue;
                    // 优先解析同一行分隔的“英：中”格式
                    let parts = s.includes('——') ? s.split('——')
                        : (s.includes('—') ? s.split('—')
                        : (s.includes(' - ') ? s.split(' - ')
                        : (s.includes(':') ? s.split(':')
                        : (s.includes('：') ? s.split('：') : null))));
                    if (parts) {
                        const en = (parts[0] || '').trim();
                        const zh = (parts[1] || '').trim();
                        if (en || zh) { parsedFromSample.push({ en, zh }); continue; }
                    }
                    // 若没有分隔符：尝试两行配对（当前行为英文，下一行为中文）
                    const nextRaw = typeof sampleLines[i+1] === 'string' ? sampleLines[i+1] : '';
                    const next = nextRaw.trim();
                    if (s && next && !hasChineseChar(s) && hasChineseChar(next)) {
                        parsedFromSample.push({ en: s, zh: next });
                        i += 1; // 消耗下一行
                        continue;
                    }
                    // 单独英文或中文，尽可能保留
                    if (s) parsedFromSample.push({ en: s, zh: '' });
                }

                // 规则：
                // - 若 examples 为空，用 parsedFromSample 填满到 3 条；若仍不足，用通用模板补齐
                // - 若 examples 存在但不足 3 条，追加 parsedFromSample 中未使用的条目，再补模板
                // - 若 examples 有条目但某些缺 zh，则使用 parsedFromSample 对应位置补全 zh
                const fillToThree = () => {
                    while (examples.length < 3 && parsedFromSample.length) {
                        const next = parsedFromSample.shift();
                        examples.push({ en: next.en || '', zh: next.zh || '' });
                    }
                    while (examples.length < 3) {
                        const tmpl = this.generateExamples(wordText, pos)[examples.length] || { en: '', zh: '' };
                        examples.push({ en: tmpl.en || '', zh: tmpl.zh || '' });
                    }
                };

                // 去重：按英文句子去重，避免重复
                const dedupeByEn = (arr) => {
                    const seen = new Set();
                    const out = [];
                    for (const ex of (arr || [])) {
                        const key = String(ex.en || '').trim().toLowerCase();
                        if (key && seen.has(key)) continue;
                        if (key) seen.add(key);
                        out.push({ en: String(ex.en || '').trim(), zh: String(ex.zh || '').trim() });
                    }
                    return out;
                };

                examples = dedupeByEn(examples);

                if (!Array.isArray(examples) || examples.length === 0) {
                    examples = [];
                    fillToThree();
                } else {
                    // 先限制至最多 3 条
                    examples = examples.slice(0, 3).map(ex => ({ en: String(ex.en || '').trim(), zh: String(ex.zh || '').trim() }));
                    // 补齐缺失中文
                    for (let i = 0; i < examples.length; i++) {
                        if (!examples[i].zh) {
                            const src = parsedFromSample[i];
                            if (src && src.zh) examples[i].zh = src.zh;
                        }
                    }
                    // 再次去重，避免补齐过程中出现重复
                    examples = dedupeByEn(examples);
                    // 若不足 3 条，继续补
                    fillToThree();
                }

                // 保存结构化例句到数据库（保持 3 条双语）
                try {
                    if (dbWord) {
                        dbWord.examples = examples.map(ex => ({ en: ex.en || '', zh: ex.zh || '' }));
                        DB.saveFileData(allWords);
                    }
                } catch(_){}

                const items = examples.slice(0, 3).map(ex => `<li>${this.escapeHtml(ex.en)} <button class="inline-speak btn-speak-en avatar-speak" data-text="${this.escapeHtml(ex.en)}" title="朗读英文句子" aria-label="朗读英文句子" style="margin-left:6px;">😊</button><br><span class="zh">${this.escapeHtml(ex.zh)}</span></li>`).join('');
                leftBlocks.push(`<div class="block"><div class="heading">例句:</div><ul class="examples">${items}</ul></div>`);

                // 异步补齐缺失的中文翻译，渲染后更新DOM与数据库
                try {
                    const container = this.elements.detailsBack?.querySelector('.examples');
                    const allWords2 = DB.getAllWords();
                    const dbWord2 = allWords2.find(w => w.word === wordText);
                    for (let i = 0; i < examples.length; i++) {
                        const ex = examples[i];
                        if (ex && ex.en && !ex.zh && window.wordEnhancementService && typeof window.wordEnhancementService.translateTextToChinese === 'function') {
                            // 翻译并回填
                            window.wordEnhancementService.translateTextToChinese(ex.en).then(zh => {
                                const t = String(zh || '').trim();
                                if (!t) return;
                                // 更新内存与数据库
                                try {
                                    examples[i].zh = t;
                                    if (dbWord2) {
                                        const safe = examples.map(e => ({ en: e.en || '', zh: e.zh || '' }));
                                        dbWord2.examples = safe;
                                        DB.saveFileData(allWords2);
                                    }
                                } catch(_){}
                                // 更新DOM
                                try {
                                    const li = container?.children?.[i];
                                    const zhSpan = li ? li.querySelector('span.zh') : null;
                                    if (zhSpan) zhSpan.textContent = t;
                                } catch(_){}
                            }).catch(()=>{});
                        }
                    }
                } catch(_){}
            }
            // 按需求：移除左侧联想显示块

            // 右侧：按六行顺序（单词、中文、音标、词性、记忆要点、联想）
            const rightBlocks = [];
            if (wordText) rightBlocks.push(`<div class="right-word">${this.escapeHtml(wordText)}</div>`);
            rightBlocks.push(`<div class="right-chinese"><span class="label">中文解释:</span> <span class="value">${this.escapeHtml(chinese || '')}</span></div>`);
            rightBlocks.push(`<div class="right-phonetics"><span class="label">音标:</span> <span class="value">${this.escapeHtml(phonStr || '')}</span> <button class="inline-speak btn-speak-word avatar-speak" data-word="${this.escapeHtml(wordText || '')}" title="朗读单词" aria-label="朗读单词" style="margin-left:6px;">😊</button></div>`);
            rightBlocks.push(`<div class="right-pos"><span class="label">词性:</span> <span class="value">${this.escapeHtml(pos || '')}</span></div>`);
            // 在词性与记忆要点之间插入空行与分隔符
            rightBlocks.push(`<hr class="right-sep" />`);
            rightBlocks.push(`<div class="right-memo"><span class="label">记忆要点:</span> <span class="value">${this.escapeHtml(memo || '')}</span></div>`);
            rightBlocks.push(`<div class="right-assoc"><span class="label">联想:</span> <span class="value">${this.escapeHtml(assoc || '')}</span></div>`);

            const backHtml = `
                <div class="back-columns">
                    <div class="back-left">${leftBlocks.join('')}</div>
                    <div class="back-right">${rightBlocks.join('')}</div>
                </div>
            `;
            this.elements.detailsBack.innerHTML = backHtml;
            // 绑定朗读按钮事件：音标右侧朗读单词、例句后朗读该英文句子
            try {
                const back = this.elements.detailsBack;
                // 朗读例句
                back.querySelectorAll('.btn-speak-en').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const t = (btn.getAttribute('data-text') || '').trim();
                        if (!t) return;
                        try { App.speakWord(t); } catch(_) { try { window.speakWord && window.speakWord(t); } catch(_) {} }
                    });
                });
                // 朗读单词
                const sw = back.querySelector('.btn-speak-word');
                if (sw) {
                    const w = (sw.getAttribute('data-word') || wordText || '').trim();
                    sw.addEventListener('click', () => {
                        if (!w) return;
                        try { App.speakWord(w); } catch(_) { try { window.speakWord && window.speakWord(w); } catch(_) {} }
                    });
                }
            } catch(_){}

            // 异步补齐固定搭配的中文翻译，并保存到数据库与更新DOM
            try {
                const allWords3 = DB.getAllWords();
                const dbWord3 = allWords3.find(w => w.word === wordText);
                const block = this.elements.detailsBack?.querySelector('#collocations-block .content');
                if (dbWord3 && Array.isArray(dbWord3.collocations)) {
                    const currentColls = dbWord3.collocations.map(c => ({ en: String(c.en || c.phrase || '').trim(), zh: String(c.zh || c.meaning || '').trim() }));
                    for (let i = 0; i < currentColls.length; i++) {
                        const ci = currentColls[i];
                        if (ci.en && !ci.zh && window.wordEnhancementService && typeof window.wordEnhancementService.translateTextToChinese === 'function') {
                            window.wordEnhancementService.translateTextToChinese(ci.en).then(zh => {
                                const t = String(zh || '').trim();
                                if (!t) return;
                                try {
                                    currentColls[i].zh = t;
                                    dbWord3.collocations = currentColls.map(c => ({ en: c.en || '', zh: c.zh || '' }));
                                    DB.saveFileData(allWords3);
                                } catch(_){}
                                try {
                                    if (block) {
                                        const lines = dbWord3.collocations.map(c => `• ${c.en}${c.zh ? `：${c.zh}` : ''}`);
                                        block.textContent = lines.join('\n');
                                    }
                                } catch(_){}
                            }).catch(()=>{});
                        }
                    }
                }
            } catch(_){}

            // 追加：从GPT实时查询并显示简述（数据源切换但不改结构）
            try {
                const gptBlockId = 'gpt-brief-block';
                const rightCol = this.elements.detailsBack.querySelector('.back-right');
                if (rightCol && wordText) {
                    const old = rightCol.querySelector('#' + gptBlockId);
                    if (old) old.remove();
                    const holder = document.createElement('div');
                    holder.id = gptBlockId;
                    holder.style.marginBottom = '6px';
                    holder.style.fontSize = '0.95em';
                    holder.style.color = '#8b5c3e';
                    holder.textContent = '正在查询 GPT 释义...';
                    rightCol.prepend(holder);
                    this.fetchGPTBrief(wordText).then(txt => {
                        if (txt && holder) holder.textContent = txt;
                    }).catch(()=>{});
                }
            } catch(_){}

            // 将“要复习”按钮移入右侧区域，并同步按钮激活态
            try {
                const rightCol = this.elements.detailsBack.querySelector('.back-right');
                if (rightCol && this.elements.dontRememberTopBtn) {
                    rightCol.appendChild(this.elements.dontRememberTopBtn);
                    try {
                        const all = DB.getAllWords();
                        const cur = all.find(w => w.word === wordText) || {};
                        this.elements.dontRememberTopBtn.classList.toggle('active', !!cur.needsReview);
                        if (this.elements.addNewWordBtn) {
                            this.elements.addNewWordBtn.classList.toggle('active', !!cur.isNewWord);
                        }
                    } catch(_){}
                    this.fitRightWord();
                }
            } catch(_){}
        }

        // 每次更新卡片时确保显示的是正面
        if (this.elements.flashcard) {
            this.elements.flashcard.classList.remove('flipped');
        }
    },

    // 根据 front-word-area 的高度，动态适配正面单词字号，使其高度占满 2/3 区域的最高高度-1（并在此基础上放大为当前效果的 2 倍）
    fitFrontWord: function(){
        try {
            const wordEl = this.elements?.wordFront || document.getElementById('word');
            if (!wordEl) return;
            const container = wordEl.closest('.front-word-area');
            if (!container) return;
            const maxH = Math.max(container.clientHeight - 1, 0);
            if (maxH <= 0) return;

            wordEl.style.lineHeight = '1';
            wordEl.style.fontSize = '';

            let fontSize = maxH;
            wordEl.style.fontSize = fontSize + 'px';
            let rect = wordEl.getBoundingClientRect();
            if (rect.height === 0) return;

            for (let i = 0; i < 3; i++) {
                rect = wordEl.getBoundingClientRect();
                if (Math.abs(rect.height - maxH) <= 1) break;
                const ratio = maxH / rect.height;
                fontSize = Math.floor(fontSize * ratio);
                wordEl.style.fontSize = fontSize + 'px';
            }

            // 在贴合高度的基础上，将字号扩大为当前显示效果的 2 倍
            let desired = Math.floor(fontSize * 2);
            wordEl.style.fontSize = desired + 'px';
            rect = wordEl.getBoundingClientRect();

            // 高度保护：若超出容器高度，按比例回缩
            if (rect.height > maxH) {
                const hRatio = maxH / rect.height;
                desired = Math.floor(desired * hRatio);
                wordEl.style.fontSize = desired + 'px';
                rect = wordEl.getBoundingClientRect();
            }

            // 宽度保护：避免溢出容器宽度
            const contW = container.clientWidth;
            const maxW = Math.floor(contW * 0.9);
            if (rect.width > maxW) {
                const wRatio = maxW / rect.width;
                desired = Math.floor(desired * wRatio);
                wordEl.style.fontSize = desired + 'px';
            }
            try {
                const base = parseFloat(getComputedStyle(container).fontSize) || 16;
                const minSize = Math.floor(base * 2);
                if (desired < minSize) {
                    wordEl.style.fontSize = minSize + 'px';
                }
            } catch(_){}
        } catch(e) {}
    },

    // 右侧单词自适配字号：令其宽度约等于右列宽度的80%-1
    fitRightWord: function(){
        try {
            const rightCol = this.elements.detailsBack?.querySelector('.back-right');
            const el = rightCol?.querySelector('.right-word');
            if (!rightCol || !el) return;
            el.style.whiteSpace = 'nowrap';
            const containerWidth = rightCol.clientWidth;
            if (!containerWidth) return;
            const target = Math.max(12, Math.floor(containerWidth * 0.9 - 1));
            let size = parseFloat(getComputedStyle(el).fontSize) || 48;
            for (let i = 0; i < 3; i++) {
                const currentWidth = el.scrollWidth;
                if (!currentWidth) break;
                const ratio = target / currentWidth;
                size = Math.max(12, Math.min(size * ratio, 160));
                el.style.fontSize = size + 'px';
            }
        } catch(_){}
    },

    fetchGPTBrief: async function(wordText) {
        if (!wordText) return '';
        // 统一使用 DB 配置与字段 Prompt：优先 brief，其次 definition；否则回退系统模板
        const gptCfg = (typeof DB !== 'undefined' && DB.getGPTConfig) ? DB.getGPTConfig() : {};
        const cfgMap = (typeof DB !== 'undefined' && DB.getCardFieldConfig) ? DB.getCardFieldConfig() : {};
        const useCustom = !!gptCfg.useCustomFieldPrompts;
        const briefPrompt = (cfgMap.brief && cfgMap.brief.prompt) ? cfgMap.brief.prompt : '';
        const definitionPrompt = (cfgMap.definition && cfgMap.definition.prompt) ? cfgMap.definition.prompt : '';
        const userPrompt = useCustom ? (briefPrompt || definitionPrompt || '') : '';
        const finalPrompt = (userPrompt ? userPrompt : (window.GPTPromptTemplates && window.GPTPromptTemplates.DEFINITION_BRIEF_CN15 ? window.GPTPromptTemplates.DEFINITION_BRIEF_CN15 : '请用简体中文简洁给出英文单词 {word} 的释义、音标、常见词性与1-2个固定搭配。')).replace('{word}', wordText);

        const baseInput = (gptCfg.baseUrl || '').trim();
        const apiKey = (gptCfg.apiKey || '').trim();
        const model = (gptCfg.model || '').trim();
        if (!(baseInput && model)) return '';
        let base = baseInput.replace(/\/$/, '');
        // 强制 https（允许本地 http）
        if (/^http:\/\//i.test(base)) {
            const isLocal = /^http:\/\/(localhost(?::\d+)?|127\.\d+\.\d+\.\d+(?::\d+)?|10\.\d+\.\d+\.\d+(?::\d+)?|192\.168\.\d+\.\d+(?::\d+)?)/i.test(base);
            if (!isLocal) {
                base = base.replace(/^http:\/\//i, 'https://');
                console.warn('UI.fetchGPTBrief: 非本地 HTTP 基础地址已自动升级为 HTTPS');
            }
        }
        if (!/\/v1\/?$/.test(base)) base = base + '/v1';
        const url = base + '/chat/completions';
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: 'Bearer ' + apiKey } : {}) },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        ...(gptCfg.systemPrompt ? [{ role: 'system', content: gptCfg.systemPrompt }] : []),
                        { role: 'user', content: finalPrompt }
                    ],
                    temperature: (typeof gptCfg.temperature === 'number' ? gptCfg.temperature : 0.2)
                })
            });
            const data = await resp.json();
            const txt = data?.choices?.[0]?.message?.content?.trim();
            return txt || '';
        } catch (_) {
            return '';
        }
    },

    // 使用 Web Animations API 触发正面单词放大，确保每次都能播放
    animateFrontWord: function(){
        const el = this.elements.wordFront;
        if (!el) return;
        try {
            const running = el.getAnimations ? el.getAnimations() : [];
            running.forEach(a => { try { a.cancel(); } catch(_){} });
        } catch(_){}
        el.style.willChange = 'transform, opacity';
        return el.animate([
            { transform: 'scale(0.5)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: 600,
            easing: 'ease-out',
            fill: 'forwards'
        });
    },

    // 在正面半程时揭示中文
    revealFrontChinese: function() {
        if (!this.elements.detailsFront) return;
        const parts = [];
        if (this.state.frontPhoneticsText) {
            parts.push(`<div style="font-size:1.1em; color:#8b5c3e; margin-bottom:6px;">${this.escapeHtml(this.state.frontPhoneticsText)}</div>`);
        }
        if (this.state.frontChineseText) {
            parts.push(`<div style="font-size:1.05em; color:#8b5c3e;">${this.escapeHtml(this.state.frontChineseText)}</div>`);
        }
        this.elements.detailsFront.innerHTML = parts.join('');
    },
    
    // 翻转卡片，返回当前是否为背面
    flipCard: function() {
        if (this.elements.flashcard) {
            const el = this.elements.flashcard;
            el.classList.toggle('flipped');
            const isBack = el.classList.contains('flipped');
            if (!isBack && this.elements.wordFront) {
                this.fitFrontWord();
                const anim = this.animateFrontWord();
            try {
                if (anim && anim && anim.finished) {
                    anim.finished.then(() => { const btn = this.elements.correctButton; if (btn) btn.classList.remove('active'); });
                } else {
                    setTimeout(() => { const btn = this.elements.correctButton; if (btn) btn.classList.remove('active'); }, 600);
                }
            } catch(_){}
            }
            return isBack;
        }
        return false;
    },

    // 若缺失则补全内容并保存到数据库（示例句与占位搭配）
    augmentWordIfMissing: function(word, meta) {
        try {
            const all = DB.getAllWords();
            const idx = all.findIndex(w => w.word === word.word);
            if (idx === -1) return;
            const current = all[idx] || {};
            let changed = false;
            // 严格模式：禁用本地兜底（例句模板等）
            const gptCfg = (typeof DB !== 'undefined' && DB.getGPTConfig) ? DB.getGPTConfig() : {};
            const strictGpt = !!gptCfg.gptOnlyMode;
            if (!strictGpt) {
                if (!Array.isArray(current.examples) || current.examples.length === 0) {
                    current.examples = this.generateExamples(current.word, meta.pos);
                    changed = true;
                }
            }

            if (!current.fixedCollocation && !current.collocation) {
                // 简单占位：未提供固定搭配时留空，不强行生成不准确内容
                // 可对接外部服务后填充
            }

            if (changed) {
                all[idx] = current;
                DB.saveFileData(all);
            }
        } catch (e) {
            console.warn('补全内容失败:', e);
        }
    },

    // 使用常用词模板生成通用例句（3个），含中文翻译
    generateExamples: function(wordText, pos) {
        const w = (wordText || '').trim();
        if (!w) return [];
        // 通用、语法安全的例句模板，适配任何词性
        const templates = [
            { en: `I learned the word ${w} today.`, zh: `我今天学习了单词 ${w}。` },
            { en: `Can you explain ${w} in simple words?`, zh: `你能用简单的词解释 ${w} 吗？` },
            { en: `This example uses ${w} in a sentence.`, zh: `这个例子在句子中使用了 ${w}。` }
        ];
        // 如果看起来像动词，额外加入一个动词句型（替换最后一个）
        if (pos && /v/i.test(pos)) {
            templates[2] = { en: `We will ${w} together this week.`, zh: `这周我们会一起 ${w}。` };
        }
        return templates.slice(0, 3);
    },

    /**
     * 动态调整卡片容器高度，避免底部控制区遮挡
     * 计算规则：100vh - 底部 controls 高度 - stats 信息栏高度 - 安全边距
     */
    adjustFlashcardHeight: function() {
        try {
            const container = document.querySelector('.flashcard-container');
            if (!container) return;
            const vv = window.visualViewport;
            const viewport = vv && vv.height ? Math.ceil(vv.height) : (window.innerHeight || document.documentElement.clientHeight || 800);
            const controls = document.querySelector('.controls');
            const stats = document.querySelector('.stats');
            const controlsH = controls ? Math.ceil(controls.getBoundingClientRect().height) : 0;
            const statsH = stats ? Math.ceil(stats.getBoundingClientRect().height) : 0;
            const margin = 16; // 顶部/底部安全空间
            const heightPx = Math.max(280, viewport - controlsH - statsH - margin);
            container.style.height = heightPx + 'px';
            container.style.minHeight = heightPx + 'px';
            try { this.fitFrontWord(); } catch(_){}
        } catch(_){ }
    },

    /**
     * 管理员渲染用户列表（含删除、黑名单/取消、重置PIN）
     */
    renderAdminUsers: function() {
        try {
            const listEl = this.elements.adminUsersList;
            if (!listEl) return;
            const users = (DB.listUsers ? DB.listUsers() : []) || [];
            const blacklist = (DB.listBlacklist ? DB.listBlacklist() : []) || [];
            listEl.innerHTML = '';
            users.forEach(u => {
                const uid = u.id;
                const name = u.name || uid;
                const col1 = document.createElement('div');
                col1.textContent = name + ' (' + uid + ')';
                listEl.appendChild(col1);
                const delBtn = document.createElement('button');
                delBtn.textContent = '删除';
                delBtn.setAttribute('data-action', 'delete');
                delBtn.setAttribute('data-uid', uid);
                if (uid === 'caishen') delBtn.disabled = true;
                listEl.appendChild(delBtn);
                const isBlk = blacklist.includes(uid);
                const blkBtn = document.createElement('button');
                blkBtn.textContent = isBlk ? '取消拉黑' : '拉黑';
                blkBtn.setAttribute('data-action', isBlk ? 'unblacklist' : 'blacklist');
                blkBtn.setAttribute('data-uid', uid);
                if (uid === 'caishen') blkBtn.disabled = true;
                listEl.appendChild(blkBtn);
                const resetBtn = document.createElement('button');
                resetBtn.textContent = '重置PIN(0000)';
                resetBtn.setAttribute('data-action', 'resetpin');
                resetBtn.setAttribute('data-uid', uid);
                if (uid === 'caishen') resetBtn.disabled = true;
                listEl.appendChild(resetBtn);
            });
        } catch(e) {
            console.error('渲染管理员用户列表失败：', e);
        }
    }
};

// 导出UI对象
window.UI = UI;
