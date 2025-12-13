/**
 * GoldWord 多语言UI组件
 * Language UI Components
 * 
 * 功能：
 * - 语言选择器
 * - 翻译控制面板
 * - 翻译进度显示
 * - 语言切换界面
 */

const LanguageUI = {
    // 语言选择器组件
    createLanguageSelector() {
        const currentLang = window.LanguageManager ? window.LanguageManager.getCurrentLanguageInfo() : { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' };
        const supportedLangs = window.LanguageManager ? window.LanguageManager.getSupportedLanguages() : [];
        
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.innerHTML = `
            <div class="language-selector-button" id="languageSelectorBtn">
                <span class="language-flag">${currentLang.flag}</span>
                <span class="language-name">${currentLang.name}</span>
                <span class="language-arrow">▼</span>
            </div>
            <div class="language-dropdown" id="languageDropdown" style="display: none;">
                <div class="language-search">
                    <input type="text" id="languageSearchInput" placeholder="${window.t ? window.t('buttons.search', '搜索语言...') : '搜索语言...'}" />
                </div>
                <div class="language-list" id="languageList">
                    ${supportedLangs.map(lang => `
                        <div class="language-item ${lang.code === currentLang.code ? 'active' : ''}" 
                             data-lang-code="${lang.code}" 
                             data-lang-name="${lang.name}"
                             data-lang-flag="${lang.flag}">
                            <span class="language-item-flag">${lang.flag}</span>
                            <span class="language-item-name">${lang.name}</span>
                            ${lang.code === currentLang.code ? '<span class="check-mark">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // 添加样式
        this.addLanguageSelectorStyles();
        
        // 绑定事件
        this.bindLanguageSelectorEvents(selector);
        
        return selector;
    },
    
    // 翻译控制面板
    createTranslationPanel() {
        const panel = document.createElement('div');
        panel.className = 'translation-panel';
        panel.innerHTML = `
            <div class="translation-panel-header">
                <h3>${window.t ? window.t('settings.translation', 'AI翻译') : 'AI翻译'}</h3>
                <button class="close-panel-btn" id="closeTranslationPanel">✕</button>
            </div>
            <div class="translation-panel-content">
                <div class="translation-section">
                    <h4>${window.t ? window.t('settings.quickTranslate', '快速翻译') : '快速翻译'}</h4>
                    <div class="quick-translate-controls">
                        <select id="quickTranslateSourceLang" class="language-select">
                            <option value="auto">${window.t ? window.t('settings.autoDetect', '自动检测') : '自动检测'}</option>
                            <option value="zh-CN">🇨🇳 简体中文</option>
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="th">🇹🇭 ภาษาไทย</option>
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="es">🇪🇸 Español</option>
                        </select>
                        <span class="arrow">→</span>
                        <select id="quickTranslateTargetLang" class="language-select">
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="zh-CN">🇨🇳 简体中文</option>
                            <option value="th">🇹🇭 ภาษาไทย</option>
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="es">🇪🇸 Español</option>
                        </select>
                        <button id="quickTranslateBtn" class="translate-btn">
                            ${window.t ? window.t('buttons.translate', '翻译') : '翻译'}
                        </button>
                    </div>
                </div>
                
                <div class="translation-section">
                    <h4>${window.t ? window.t('settings.translateUI', '翻译界面') : '翻译界面'}</h4>
                    <p class="section-description">
                        ${window.t ? window.t('settings.translateUIDesc', '使用AI自动翻译整个界面到目标语言') : '使用AI自动翻译整个界面到目标语言'}
                    </p>
                    <div class="ui-translate-controls">
                        <select id="uiTargetLang" class="language-select">
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="zh-CN">🇨🇳 简体中文</option>
                            <option value="zh-TW">🇭🇰 繁體中文</option>
                            <option value="th">🇹🇭 ภาษาไทย</option>
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="es">🇪🇸 Español</option>
                            <option value="fr">🇫🇷 Français</option>
                            <option value="de">🇩🇪 Deutsch</option>
                            <option value="ko">🇰🇷 한국어</option>
                            <option value="ar">🇸🇦 العربية</option>
                            <option value="ru">🇷🇺 Русский</option>
                        </select>
                        <button id="translateUIBtn" class="translate-btn primary">
                            ${window.t ? window.t('buttons.translateAll', '翻译全部界面') : '翻译全部界面'}
                        </button>
                    </div>
                    <div class="translation-progress" id="translationProgress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>
                </div>
                
                <div class="translation-section">
                    <h4>${window.t ? window.t('settings.translationSettings', '翻译设置') : '翻译设置'}</h4>
                    <div class="translation-settings">
                        <label class="setting-item">
                            <input type="checkbox" id="enableTranslationCache" checked />
                            <span>${window.t ? window.t('settings.enableCache', '启用翻译缓存') : '启用翻译缓存'}</span>
                        </label>
                        <label class="setting-item">
                            <input type="checkbox" id="enableTranslationHistory" checked />
                            <span>${window.t ? window.t('settings.enableHistory', '启用翻译历史') : '启用翻译历史'}</span>
                        </label>
                        <label class="setting-item">
                            <input type="number" id="translationDelay" value="1000" min="500" max="5000" step="100" />
                            <span>${window.t ? window.t('settings.translationDelay', '翻译延迟 (ms)') : '翻译延迟 (ms)'}</span>
                        </label>
                    </div>
                </div>
                
                <div class="translation-section">
                    <h4>${window.t ? window.t('settings.translationStats', '翻译统计') : '翻译统计'}</h4>
                    <div class="translation-stats" id="translationStats">
                        ${this.renderTranslationStats()}
                    </div>
                </div>
            </div>
        `;
        
        this.addTranslationPanelStyles();
        this.bindTranslationPanelEvents(panel);
        
        return panel;
    },
    
    // 添加语言选择器样式
    addLanguageSelectorStyles() {
        if (document.getElementById('languageSelectorStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'languageSelectorStyles';
        style.textContent = `
            .language-selector {
                position: relative;
                display: inline-block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .language-selector-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                color: #333;
            }
            
            .language-selector-button:hover {
                background: #f5f5f5;
                border-color: #007aff;
            }
            
            .language-flag {
                font-size: 16px;
            }
            
            .language-name {
                font-weight: 500;
            }
            
            .language-arrow {
                font-size: 12px;
                color: #666;
                transition: transform 0.2s ease;
            }
            
            .language-selector.active .language-arrow {
                transform: rotate(180deg);
            }
            
            .language-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                margin-top: 4px;
                max-height: 300px;
                overflow: hidden;
            }
            
            .language-search {
                padding: 8px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .language-search input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                font-size: 14px;
                outline: none;
            }
            
            .language-search input:focus {
                border-color: #007aff;
            }
            
            .language-list {
                max-height: 240px;
                overflow-y: auto;
            }
            
            .language-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 14px;
            }
            
            .language-item:hover {
                background-color: #f8f9fa;
            }
            
            .language-item.active {
                background-color: #007aff;
                color: white;
            }
            
            .language-item-flag {
                font-size: 16px;
                width: 20px;
            }
            
            .language-item-name {
                flex: 1;
                font-weight: 500;
            }
            
            .check-mark {
                color: #34c759;
                font-weight: bold;
            }
            
            .language-item.active .check-mark {
                color: white;
            }
            
            /* 翻译面板样式 */
            .translation-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%;
                max-width: 500px;
                z-index: 2000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .translation-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .translation-panel-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .close-panel-btn {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
                padding: 4px;
                border-radius: 4px;
            }
            
            .close-panel-btn:hover {
                background: #f5f5f5;
            }
            
            .translation-panel-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .translation-section {
                margin-bottom: 24px;
            }
            
            .translation-section:last-child {
                margin-bottom: 0;
            }
            
            .translation-section h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .section-description {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #666;
                line-height: 1.4;
            }
            
            .quick-translate-controls,
            .ui-translate-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .language-select {
                padding: 8px 12px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                cursor: pointer;
                outline: none;
            }
            
            .language-select:focus {
                border-color: #007aff;
            }
            
            .arrow {
                color: #666;
                font-weight: bold;
            }
            
            .translate-btn {
                padding: 8px 16px;
                background: #007aff;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .translate-btn:hover {
                background: #0056b3;
            }
            
            .translate-btn.primary {
                background: #34c759;
            }
            
            .translate-btn.primary:hover {
                background: #2aa047;
            }
            
            .translation-progress {
                margin-top: 12px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: #007aff;
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .progress-text {
                text-align: center;
                font-size: 14px;
                color: #666;
                font-weight: 500;
            }
            
            .translation-settings {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .setting-item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                cursor: pointer;
            }
            
            .setting-item input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .setting-item input[type="number"] {
                width: 80px;
                padding: 6px 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .translation-stats {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                color: #666;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }
            
            .stat-item:last-child {
                margin-bottom: 0;
            }
            
            .stat-label {
                font-weight: 500;
            }
            
            .stat-value {
                color: #007aff;
                font-weight: 600;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 添加翻译面板样式
    addTranslationPanelStyles() {
        if (document.getElementById('translationPanelStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'translationPanelStyles';
        style.textContent = `
            .translation-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                width: 90%;
                max-width: 500px;
                z-index: 2000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .translation-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .translation-panel-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .close-panel-btn {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
                padding: 4px;
                border-radius: 4px;
            }
            
            .close-panel-btn:hover {
                background: #f5f5f5;
            }
            
            .translation-panel-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .translation-section {
                margin-bottom: 24px;
            }
            
            .translation-section:last-child {
                margin-bottom: 0;
            }
            
            .translation-section h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .section-description {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #666;
                line-height: 1.4;
            }
            
            .quick-translate-controls,
            .ui-translate-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .language-select {
                padding: 8px 12px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                cursor: pointer;
                outline: none;
            }
            
            .language-select:focus {
                border-color: #007aff;
            }
            
            .arrow {
                color: #666;
                font-weight: bold;
            }
            
            .translate-btn {
                padding: 8px 16px;
                background: #007aff;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .translate-btn:hover {
                background: #0056b3;
            }
            
            .translate-btn.primary {
                background: #34c759;
            }
            
            .translate-btn.primary:hover {
                background: #2aa047;
            }
            
            .translation-progress {
                margin-top: 12px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: #007aff;
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .progress-text {
                text-align: center;
                font-size: 14px;
                color: #666;
                font-weight: 500;
            }
            
            .translation-settings {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .setting-item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                cursor: pointer;
            }
            
            .setting-item input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .setting-item input[type="number"] {
                width: 80px;
                padding: 6px 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .translation-stats {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                color: #666;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }
            
            .stat-item:last-child {
                margin-bottom: 0;
            }
            
            .stat-label {
                font-weight: 500;
            }
            
            .stat-value {
                color: #007aff;
                font-weight: 600;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 绑定语言选择器事件
    bindLanguageSelectorEvents(selector) {
        const button = selector.querySelector('#languageSelectorBtn');
        const dropdown = selector.querySelector('#languageDropdown');
        const searchInput = selector.querySelector('#languageSearchInput');
        const languageItems = selector.querySelectorAll('.language-item');
        
        // 切换下拉菜单
        button.addEventListener('click', () => {
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            selector.classList.toggle('active', !isOpen);
            
            if (!isOpen) {
                searchInput.focus();
                searchInput.value = '';
                this.filterLanguages('');
            }
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.style.display = 'none';
                selector.classList.remove('active');
            }
        });
        
        // 搜索功能
        searchInput.addEventListener('input', (e) => {
            this.filterLanguages(e.target.value);
        });
        
        // 语言选择
        languageItems.forEach(item => {
            item.addEventListener('click', async () => {
                const langCode = item.dataset.langCode;
                
                if (window.LanguageManager) {
                    try {
                        await window.LanguageManager.setLanguage(langCode);
                        this.updateLanguageSelector(selector, langCode);
                        dropdown.style.display = 'none';
                        selector.classList.remove('active');
                    } catch (error) {
                        console.error('切换语言失败:', error);
                        alert('切换语言失败: ' + error.message);
                    }
                }
            });
        });
    },
    
    // 绑定翻译面板事件
    bindTranslationPanelEvents(panel) {
        const closeBtn = panel.querySelector('#closeTranslationPanel');
        const quickTranslateBtn = panel.querySelector('#quickTranslateBtn');
        const translateUIBtn = panel.querySelector('#translateUIBtn');
        
        // 关闭面板
        closeBtn.addEventListener('click', () => {
            panel.remove();
        });
        
        // 快速翻译
        quickTranslateBtn.addEventListener('click', async () => {
            const sourceLang = panel.querySelector('#quickTranslateSourceLang').value;
            const targetLang = panel.querySelector('#quickTranslateTargetLang').value;
            
            // 这里可以实现快速翻译功能
            console.log(`快速翻译: ${sourceLang} -> ${targetLang}`);
        });
        
        // 翻译全部界面
        translateUIBtn.addEventListener('click', async () => {
            const targetLang = panel.querySelector('#uiTargetLang').value;
            
            if (window.AITranslationService) {
                const progressDiv = panel.querySelector('#translationProgress');
                const progressFill = panel.querySelector('#progressFill');
                const progressText = panel.querySelector('#progressText');
                
                progressDiv.style.display = 'block';
                
                const success = await window.AITranslationService.translateAllUIElements(targetLang, (progress) => {
                    progressFill.style.width = progress.percentage + '%';
                    progressText.textContent = progress.message || `${progress.percentage}%`;
                });
                
                if (success) {
                    setTimeout(() => {
                        progressDiv.style.display = 'none';
                        this.updateTranslationStats(panel);
                    }, 2000);
                }
            } else {
                alert('AI翻译服务未初始化');
            }
        });
    },
    
    // 过滤语言
    filterLanguages(searchTerm) {
        const items = document.querySelectorAll('.language-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const langName = item.dataset.langName.toLowerCase();
            const langCode = item.dataset.langCode.toLowerCase();
            
            if (langName.includes(term) || langCode.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    // 更新语言选择器
    updateLanguageSelector(selector, newLangCode) {
        const button = selector.querySelector('#languageSelectorBtn');
        const flag = button.querySelector('.language-flag');
        const name = button.querySelector('.language-name');
        
        const langInfo = window.LanguageManager.config.languages[newLangCode];
        if (langInfo) {
            flag.textContent = langInfo.flag;
            name.textContent = langInfo.name;
        }
        
        // 更新选中状态
        const items = selector.querySelectorAll('.language-item');
        items.forEach(item => {
            if (item.dataset.langCode === newLangCode) {
                item.classList.add('active');
                if (!item.querySelector('.check-mark')) {
                    const checkMark = document.createElement('span');
                    checkMark.className = 'check-mark';
                    checkMark.textContent = '✓';
                    item.appendChild(checkMark);
                }
            } else {
                item.classList.remove('active');
                const checkMark = item.querySelector('.check-mark');
                if (checkMark) {
                    checkMark.remove();
                }
            }
        });
    },
    
    // 渲染翻译统计
    renderTranslationStats() {
        if (!window.AITranslationService) {
            return '<div class="stat-item"><span class="stat-label">翻译服务未初始化</span></div>';
        }
        
        const stats = window.AITranslationService.getTranslationStats();
        
        return `
            <div class="stat-item">
                <span class="stat-label">总翻译次数:</span>
                <span class="stat-value">${stats.totalTranslations}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">总字符数:</span>
                <span class="stat-value">${stats.totalCharacters.toLocaleString()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">缓存命中:</span>
                <span class="stat-value">${stats.cacheHits}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">平均字符数:</span>
                <span class="stat-value">${stats.averageCharacters}</span>
            </div>
        `;
    },
    
    // 更新翻译统计
    updateTranslationStats(panel) {
        const statsDiv = panel.querySelector('#translationStats');
        if (statsDiv) {
            statsDiv.innerHTML = this.renderTranslationStats();
        }
    },
    
    // 显示翻译面板
    showTranslationPanel() {
        const existingPanel = document.querySelector('.translation-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = this.createTranslationPanel();
        document.body.appendChild(panel);
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1999;
        `;
        document.body.appendChild(overlay);
        
        // 绑定关闭事件
        const closePanel = () => {
            panel.remove();
            overlay.remove();
        };
        
        overlay.addEventListener('click', closePanel);
        panel.querySelector('#closeTranslationPanel').addEventListener('click', closePanel);
    }
};

// 初始化语言UI组件
document.addEventListener('DOMContentLoaded', function() {
    // 将语言UI组件添加到全局
    window.LanguageUI = LanguageUI;
    
    console.log('GoldWord语言UI组件已加载');
});