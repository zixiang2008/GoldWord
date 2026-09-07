/**
 * GoldWord - 应用主模块
 * 负责：
 * - 初始化数据库与 UI
 * - 加载与解析词库（支持旧版内联数据、Excel/CSV、docx、纯文本）
 * - 学习流程（卡片展示、统计刷新、Service Worker 注册）
 * - GPT 设置的保存与测试（按用户隔离）
 * 关键控制：自动播放与暂停（toggleAutoPlay/pauseAutoPlay/resumeAutoPlay），
 * 朗读开关与朗读一次（toggleSpeakMode/speakWord）。事件绑定统一在 UI.bindEvents 执行一次。
 */
// SA (StorageAdapter 回退机制) 由 index.html 提供
// 应用程序主逻辑
const App = {
    // 当前单词索引
    currentIndex: 0,
    
    // 学习单词列表
    words: [],
    // 历史栈：用于“上一张”导航（不改变数据库标记）
    history: [],

    // 5秒倒计时控制
    countdownSeconds: 5,
    countdownTimerId: null,
    // 自动播放开关
    autoPlayEnabled: false,
    // 自动播放暂停状态与剩余秒数
    autoPaused: false,
    countdownRemaining: 0,
    // 生词本词在本轮重放计数
    replayCounts: {},
    // 发音开关（开启时在自动播放半程进行朗读；按钮可切换）
    speakEnabled: true,

    // 从旧版页面内联数据导入词库
    importLegacyWords: function() {
        try {
            const legacy = (typeof words !== 'undefined' && Array.isArray(words))
                ? words
                : ((typeof window !== 'undefined' && Array.isArray(window.words)) ? window.words : null);
            if (!legacy || legacy.length === 0) return false;
            
            // 读取旧版localStorage的复习标记
            let needsReviewMap = {};
            try {
                needsReviewMap = JSON.parse(localStorage.getItem('needsReview') || '{}');
            } catch (_) {}
            
            // 读取旧版今日学习记录（仅供参考，不强制标记为已学习）
            let studiedTodaySet = [];
            try {
                studiedTodaySet = JSON.parse(localStorage.getItem('studiedWords') || '[]');
            } catch (_) {}
            const studiedDate = localStorage.getItem('studiedDate') || null;
            
            const processed = legacy.map(item => {
                const word = item.word || '';
                const phonUS = item.phonetic || item.pronunciation || '';
                const phonUK = item.pronunciation || item.phonetic || '';
                const pos = item.partOfSpeech || '';
                const chinese = item.chinese || item.translation || '';
                const def = item.definition || '';
                const coll = item.collocation || '';
                const memo = item.mnemonic || '';
                const needsReview = item.needsReview || (needsReviewMap && needsReviewMap[word]) || false;
                const studied = Array.isArray(studiedTodaySet) ? studiedTodaySet.includes(word) : false;
                
                return {
                    word,
                    phonetic: phonUS,
                    pronunciation: phonUK,
                    partOfSpeech: pos,
                    chinese,
                    translation: chinese,
                    definition: def,
                    collocation: coll,
                    mnemonic: memo,
                    studied: !!studied,
                    studiedDate: studied ? (studiedDate ? studiedDate : null) : null,
                    needsReview: !!needsReview,
                    isNewWord: !!item.isNewWord
                };
            });
            
            DB.saveFileData(processed);
            return true;
        } catch (e) {
            console.error('导入旧版词库失败:', e);
            return false;
        }
    },
    
    /**
     * 初始化应用：
     * - 初始化数据库与 UI
     * - 若本地词库为空，尝试从旧版内联数据导入
     * - 加载需要学习的单词并更新 UI
     * - 注册 Service Worker 支持离线
     */
    // 初始化应用
    init: function() {
        // 初始化数据库
        DB.init();
        
        // 初始化UI
        UI.init();
        // 绑定交互事件（按钮与全局交互）
        try { UI.bindEvents && UI.bindEvents(); } catch(_) {}
        
        // 如果本地没有词库，尝试从旧版内联数据导入
        if ((DB.getAllWords() || []).length === 0) {
            this.importLegacyWords();
        }
        
        // 始终尝试加载单词（无数据时将提供示例词条）
        this.loadWords();
        
        // 启动单词增强服务（后台自动补全单词信息）
        this.startWordEnhancement();
        
        // 初始化状态指示器
        this.initStatusIndicator();
        
        // 注册Service Worker
        this.registerServiceWorker();

        // 结束初始化方法
    },

    // 朗读中文解释（使用中文口音选择，并选择中文语音）
    speakChinese: async function(text) {
        const rate = parseFloat(UI.elements.speechRate?.value || '1');
        const accentSel = UI.elements.accentZh?.value;
        const accent = accentSel || 'zh-CN';
        const content = (text != null && text !== undefined && String(text).trim()) || (UI.state?.frontChineseText || '');
        const t = String(content || '').trim();
        if (!t) return;
        try {
            const cap = window.Capacitor;
            let ttsPlugin = null;
            if (cap && typeof cap.getPlugin === 'function') { ttsPlugin = cap.getPlugin('TextToSpeech'); }
            else if (cap && cap.Plugins && cap.Plugins.TextToSpeech) { ttsPlugin = cap.Plugins.TextToSpeech; }
            else if (window.TextToSpeech) { ttsPlugin = window.TextToSpeech; }
            if (ttsPlugin && typeof ttsPlugin.speak === 'function') {
                try { await ttsPlugin.speak({ text: t, lang: accent, rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){ }
                try { await ttsPlugin.speak({ text: t, locale: accent, rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){ }
                // 进一步回退到泛中文
                try { await ttsPlugin.speak({ text: t, lang: 'zh', rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){ }
                try { await ttsPlugin.speak({ text: t, locale: 'zh', rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){ }
            }
        } catch(e) { console.warn('Capacitor TTS 中文失败，回退到 Web Speech:', e); }
        const synth = window.speechSynthesis;
        if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return;
        const utterance = new SpeechSynthesisUtterance(t);
        utterance.rate = rate;
        utterance.lang = accent;
        async function getVoicesAsync() {
            let voices = synth.getVoices ? synth.getVoices() : [];
            if (voices && voices.length) return voices;
            await new Promise(resolve => {
                try {
                    const handler = () => { resolve(); synth.removeEventListener('voiceschanged', handler); };
                    synth.addEventListener('voiceschanged', handler);
                    setTimeout(resolve, 500);
                } catch(_) { setTimeout(resolve, 300); }
            });
            return synth.getVoices ? synth.getVoices() : [];
        }
        try {
            const voices = await getVoicesAsync();
            const langLower = String(accent).toLowerCase();
            const selectedVoice = voices && (
                voices.find(v => String(v.lang).toLowerCase() === langLower) ||
                voices.find(v => String(v.lang).toLowerCase().startsWith('zh')) ||
                voices.find(v => String(v.lang).toLowerCase().includes('cmn'))
            );
            if (selectedVoice) utterance.voice = selectedVoice;
        } catch(_){}
        try { synth.cancel && synth.cancel(); } catch(_) {}
        synth.speak(utterance);
    },

    // 简单延时辅助
    delay: function(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

    // 学习模式：按下按钮根据选择执行朗读序列
    runLearnMode: async function() {
        const mode = UI.elements.learnMode ? UI.elements.learnMode.value : 'en1';
        const current = this.words[this.currentIndex] ? this.words[this.currentIndex].word : '';
        if (!current) return;
        const speakOnce = async () => { await this.speakWord(current); await this.delay(400); };
        // 保证中文朗读有内容：优先使用渲染层的中文，其次读取 DB，最后回退到英文词本身
        let chineseText = UI.state?.frontChineseText || '';
        if (!chineseText) {
            try {
                const all = DB.getAllWords();
                const rec = all.find(w => w.word === current) || {};
                // 复用 UI 的字段解析逻辑以覆盖各种键名
                if (typeof UI !== 'undefined' && UI.resolveField) {
                    chineseText = UI.resolveField(rec, ['chinese','translation','中文解释','中文','释义']) || '';
                    if (!chineseText && rec.aiEnhanced && rec.aiEnhanced.chineseMeaning) {
                        chineseText = rec.aiEnhanced.chineseMeaning || '';
                    }
                } else {
                    chineseText = rec.chinese || (rec.translation || '') || '';
                    if (!chineseText && rec.aiEnhanced && rec.aiEnhanced.chineseMeaning) chineseText = rec.aiEnhanced.chineseMeaning || '';
                }
            } catch(_){}
        }
        if (!String(chineseText).trim()) chineseText = current;
        switch(mode) {
            case 'en1':
                await speakOnce();
                break;
            case 'en1zh1':
                await speakOnce();
                await this.speakChinese(chineseText);
                break;
            case 'en2':
                await speakOnce();
                await speakOnce();
                break;
            case 'en2zh1':
                await speakOnce();
                await this.speakChinese(chineseText);
                await speakOnce();
                break;
            default:
                await speakOnce();
                break;
        }
    },
    
    
    // 加载单词
    loadWords: function() {
        // 使用新的记忆循环系统生成每日学习计划（缺失时回退）
        if (typeof DB.generateDailyPlan === 'function') {
            this.words = DB.generateDailyPlan();
        } else {
            console.warn('DB.generateDailyPlan is not available. Falling back to legacy selection.');
            if (typeof DB.getWordsForReview === 'function') {
                this.words = DB.getWordsForReview();
            } else if (typeof DB.getWordsToStudy === 'function') {
                this.words = DB.getWordsToStudy();
            } else {
                this.words = DB.getAllWords();
            }
        }
        this.currentIndex = 0;
        
        // 如果计划为空，则回退到所有词；若仍为空，提供一个示例词条并写入数据库
        if (!this.words || this.words.length === 0) {
            const all = DB.getAllWords();
            if (all && all.length > 0) {
                this.words = all;
            } else {
                this.words = [{
                    word: 'Remote',
                    phonetic: 'rɪˈmoʊt',
                    translation: '偏远的; 遥远的; 疏远的',
                    pronunciation: 'rɪˈməʊt',
                    partOfSpeech: 'adj. 偏远的',
                    chinese: '偏远的; 遥远的; 疏远的',
                    definition: 'Far away from other places or people.',
                    collocation: 'Remote island (偏远岛屿)',
                    mnemonic: '联想：Remote control（遥控器）',
                    studied: false,
                    studiedDate: null,
                    needsReview: false,
                    isNewWord: false,
                    // 新增记忆循环字段
                    errors: 0,
                    correctStreak: 0,
                    bucket: 'new',
                    nextReview: Date.now(),
                    lastReviewed: null,
                    reviewHistory: [],
                    learningStage: 0,
                    proficiencyLevel: 0
                }];
                // 将示例词写入数据库，保证统计可用
                DB.saveFileData(this.words);
            }
        }
        
        if (this.words.length > 0) {
            UI.updateCard(this.words[this.currentIndex]);
        }
        
        UI.updateStats();
    },
    
    // 处理文件上传
    handleFileUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const name = (file.name || '').toLowerCase();
        const ext = name.split('.').pop();
        
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            DB.processExcelFile(file, () => {
                App.loadWords();
            });
        } else if (ext === 'txt') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = (e.target.result || '').toString();
                    if (!text.trim()) { alert('文件内容为空'); return; }
                    App.importTextData(text);
                } catch (err) {
                    console.error('读取 txt 失败:', err);
                    alert('读取 txt 失败：' + err.message);
                }
            };
            reader.readAsText(file);
        } else if (ext === 'docx') {
            this.importDocxFile(file);
        } else if (ext === 'doc') {
            alert('当前浏览器无法直接解析 .doc（旧版Word）文件，请在Word中将其另存为 .docx 再导入，或复制文档文本到“导入 JSON/文本”区域，使用“从文本导入”。');
        } else {
            alert('不支持的文件类型：' + ext + '。请使用 .xlsx/.xls/.csv/.docx，或复制文本到“导入 JSON/文本”。');
        }
    },
    
    // 导入 docx 文件（使用 mammoth 提取纯文本）
    importDocxFile: function(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const result = await window.mammoth.extractRawText({ arrayBuffer });
                const text = result && result.value ? result.value : '';
                this.importTextData(text);
            } catch (err) {
                console.error('解析 docx 失败:', err);
                alert('解析 docx 失败：' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    
    // 从纯文本解析导入
    importTextData: function(text) {
        try {
            const processed = this.parseWordText(text);
            if (!processed || processed.length === 0) {
                alert('未能从文本解析出词条，请检查文本格式。');
                return;
            }
            DB.saveFileData(processed);
            this.loadWords();
            UI.updateStats();
            alert('文本导入成功：' + processed.length + ' 条');
        } catch (e) {
            console.error('从文本导入失败:', e);
            alert('从文本导入失败：' + e.message);
        }
    },
    
    /**
     * 解析自定义纯文本为词条数组
     * 规则：
     * - 词头行：仅包含字母/空格/短横线（作为新词开始）
     * - 详情行：以“中文/翻译/音标/发音/词性/定义/搭配/助记/已学/需要复习/生词”等键值对形式描述
     * - 分类行：罗马序号或主题词（可选），写入 `category`
     * - 自动清洗：剔除 Emoji、去除音标方括号、布尔值规整
     * @param {string} text 原始纯文本
     * @returns {Array<Object>} 词条数组（字段：word/chinese/translation/phonetic/pronunciation/partOfSpeech/definition/collocation/mnemonic/studied/studiedDate/needsReview/isNewWord/category）
     */
    // 解析自定义文本格式为词条数组
    parseWordText: function(text) {
        if (!text || typeof text !== 'string') return [];
        // 快速路径：英文逗号分隔的简易词列表
        const simpleTokens = text.split(/[，,、;\r\n]+/).map(t => t.trim()).filter(Boolean);
        const simpleWords = simpleTokens.filter(t => /^[A-Za-z][A-Za-z\- ]*$/.test(t));
        if (simpleWords.length >= Math.max(1, Math.floor(simpleTokens.length * 0.5))) {
            return simpleWords.map(w => ({
                word: w,
                chinese: '',
                translation: '',
                phonetic: '',
                pronunciation: '',
                partOfSpeech: '',
                definition: '',
                collocation: '',
                mnemonic: '',
                studied: false,
                studiedDate: null,
                needsReview: false,
                isNewWord: false
            }));
        }
        const lines = text.split(/\r?\n/).map(l => l.trim());
        const results = [];
        let current = null;
        let currentCategory = '';
        
        const stripEmoji = (s) => s.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/[💡]/g, '').trim();
        const isBullet = (s) => /^(?:[•\-\*\·]\s*|•)/.test(s);
        const afterColon = (s) => {
            const m = s.match(/^[^:：]*[:：]\s*(.*)$/);
            return m ? m[1].trim() : s.trim();
        };
        const isCategory = (s) => /^[IVXLCDM]+\./i.test(s) || /地理|环境|生存|生物|科技|教育|文化|社会|经济|政治|历史/.test(s);
        const isWordHeader = (s) => !!s && !isBullet(s) && !isCategory(s) && /^[A-Za-z][A-Za-z\- ]*$/.test(s);
        
        const pushCurrent = () => {
            if (current && current.word) {
                // 去重 & 清洗
                current.word = current.word.trim();
                current.chinese = (current.chinese || '').trim();
                current.translation = current.chinese;
                current.partOfSpeech = (current.partOfSpeech || '').trim();
                current.definition = (current.definition || '').trim();
                current.collocation = (current.collocation || '').trim();
                current.mnemonic = (current.mnemonic || '').trim();
                current.phonetic = (current.phonetic || '').replace(/[\[\]]/g, '').trim();
                current.pronunciation = (current.pronunciation || '').replace(/[\[\]]/g, '').trim();
                current.studied = !!current.studied;
                current.needsReview = !!current.needsReview;
                current.studiedDate = current.studied ? (current.studiedDate || null) : null;
                current.isNewWord = !!current.isNewWord;
                // 可选：保留分类标签
                if (currentCategory) current.category = currentCategory;
                results.push(current);
            }
        };
        
        for (let raw of lines) {
            const line = stripEmoji(raw);
            if (!line) continue;
            
            if (isCategory(line)) {
                currentCategory = line.replace(/^[IVXLCDM]+\./i, '').trim();
                continue;
            }
            
            if (isWordHeader(line)) {
                // 新词开始，推入上一个
                pushCurrent();
                current = {
                    word: line.trim(),
                    chinese: '',
                    translation: '',
                    phonetic: '',
                    pronunciation: '',
                    partOfSpeech: '',
                    definition: '',
                    collocation: '',
                    mnemonic: '',
                    studied: false,
                    studiedDate: null,
                    needsReview: false,
                    isNewWord: false
                };
                continue;
            }
            
            if (isBullet(line)) {
                if (/中文解释/.test(line)) {
                    const val = afterColon(line);
                    if (current) current.chinese = val;
                } else if (/音标/.test(line)) {
                    const val = afterColon(line).replace(/\s+/g, ' ');
                    const parts = val.split(/\s*\/\s*/);
                    if (current) {
                        current.phonetic = (parts[0] || '').trim();
                        current.pronunciation = (parts[1] || '').trim();
                    }
                } else if (/词性/.test(line)) {
                    const val = afterColon(line);
                    if (current) current.partOfSpeech = val;
                } else if (/主要用法\/?定义/.test(line)) {
                    const val = afterColon(line);
                    const m = val.match(/(.*?)(?:\s*搭配[:：]\s*(.*))?$/);
                    if (current) {
                        current.definition = (m && m[1] ? m[1].trim() : val);
                        current.collocation = (m && m[2] ? m[2].trim() : (current.collocation || ''));
                    }
                } else if (/记忆要点|记忆|联想/.test(line)) {
                    const val = afterColon(line);
                    if (current) current.mnemonic = val;
                }
                continue;
            }
            
            // 其他非项目行：可能是延续说明或定义的一部分
            if (current) {
                // 如果包含“搭配：”，拆分定义与搭配
                if (/搭配[:：]/.test(line)) {
                    const m = line.match(/(.*?)(?:\s*搭配[:：]\s*(.*))?$/);
                    if (m) {
                        current.definition = (current.definition ? current.definition + ' ' : '') + (m[1] ? m[1].trim() : '');
                        if (m[2]) current.collocation = (current.collocation ? current.collocation + ' ' : '') + m[2].trim();
                    }
                } else {
                    // 追加到定义
                    current.definition = (current.definition ? current.definition + ' ' : '') + line;
                }
            }
        }
        
        // 推入最后一个
        pushCurrent();
        return results;
    },

    // 使用 GPT 从文本中提取英文单词并格式化为逗号列表
    gptExtractWordsFromText: async function(text) {
        try {
            const cfg = (DB.getExtendedGPTConfig ? DB.getExtendedGPTConfig() : DB.getGPTConfig());
            const baseUrlInput = (cfg?.baseUrl || '').trim();
            const apiKey = (cfg?.apiKey || '').trim();
            const model = (cfg?.model || '').trim();
            if (!baseUrlInput || !apiKey || !model) {
                alert('请在“GPT 服务设置”中填写基础地址、模型名与 API 密钥');
                return '';
            }
            // 规范并强制安全：仅允许本地 http，其余一律升级为 https
            let base = baseUrlInput.replace(/\/$/, '');
            if (/^http:\/\//i.test(base)) {
                const isLocal = /^http:\/\/(localhost(?::\d+)?|127\.\d+\.\d+\.\d+(?::\d+)?|10\.\d+\.\d+\.\d+(?::\d+)?|192\.168\.\d+\.\d+(?::\d+)?)/i.test(base);
                if (!isLocal) {
                    base = base.replace(/^http:\/\//i, 'https://');
                    console.warn('检测到非本地 HTTP 基础地址，已自动升级为 HTTPS');
                }
            }
            if (!/\/v1\/?$/.test(base)) base = base + '/v1';
            const url = base + '/chat/completions';
            const systemPrompt = (cfg.system_prompt || 'You extract distinct English words and output only a comma-separated list. No explanations. No extra text.').slice(0, 2000);
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'Extract distinct English words from the following text and return ONLY a comma-separated list:\n\n' + String(text).slice(0, 8000) }
                    ],
                    max_tokens: Math.min(1024, cfg.max_tokens || 512),
                    temperature: typeof cfg.temperature === 'number' ? cfg.temperature : 0
                })
            });
            if (!resp.ok) {
                const t = await resp.text().catch(() => '');
                throw new Error('HTTP ' + resp.status + ' ' + resp.statusText + ' ' + t);
            }
            const data = await resp.json();
            let reply = data?.choices?.[0]?.message?.content || '';
            reply = reply.replace(/[\n\r]+/g, ' ').replace(/[;、，]/g, ',').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();
            if (UI.elements && UI.elements.jsonInput) {
                UI.elements.jsonInput.value = reply;
            }
            return reply;
        } catch (e) {
            alert('GPT 识别失败：' + (e.message || e));
            return '';
        }
    },
    
    // 新增：导入 JSON 数据
    importJsonData: function(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            if (!Array.isArray(data)) {
                alert('JSON 格式错误：顶层必须是数组');
                return;
            }
            // 规范化字段，确保必要属性存在
            const processed = data.map(item => {
                const word = item.word || '';
                const phonUS = item.phonetic || item.pronunciation || '';
                const phonUK = item.pronunciation || item.phonetic || '';
                const pos = item.partOfSpeech || '';
                const chinese = item.chinese || item.translation || '';
                const def = item.definition || '';
                const coll = item.collocation || '';
                const memo = item.mnemonic || '';
                const studied = !!item.studied;
                const needsReview = !!item.needsReview;
                const studiedDate = item.studiedDate || (studied ? (new Date().toISOString().split('T')[0]) : null);
                return {
                    word,
                    phonetic: phonUS,
                    pronunciation: phonUK,
                    partOfSpeech: pos,
                    chinese,
                    translation: chinese,
                    definition: def,
                    collocation: coll,
                    mnemonic: memo,
                    studied,
                    studiedDate,
                    needsReview,
                    isNewWord: !!item.isNewWord
                };
            });
            DB.saveFileData(processed);
            this.loadWords();
            UI.updateStats();
            alert('JSON 导入成功：' + processed.length + ' 条');
        } catch (e) {
            console.error('导入 JSON 失败:', e);
            alert('导入 JSON 失败：' + e.message);
        }
    },
    
    // 新增：导出当前词库为 JSON 下载
    exportJsonData: function() {
        try {
            const data = DB.getAllWords();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vocabulary_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('导出 JSON 失败:', e);
            alert('导出 JSON 失败：' + e.message);
        }
    },
    
    // 新增：清空词库
    clearData: function() {
        try {
            if (typeof DB.clearCurrentUserData === 'function') {
                DB.clearCurrentUserData();
            } else {
                localStorage.removeItem('gk_fileData');
                DB.fileData = null;
            }
            this.loadWords();
            UI.updateStats();
            alert('已清空当前用户词库');
        } catch (e) {
            console.error('清空词库失败:', e);
            alert('清空词库失败：' + e.message);
        }
    },
    
    // 用户注册/登录/退出
    registerUser: function(id, name, password) {
        try {
            DB.registerUser(id, name, password);
            this.loadWords();
            UI.updateStats();
            alert('注册成功，已切换到用户：' + id);
            if (UI.elements.currentUserLabel) {
                UI.elements.currentUserLabel.textContent = id;
            }
        } catch (e) {
            alert('注册失败：' + e.message);
        }
    },
    loginUser: function(id, password) {
        try {
            if (!id) { alert('请输入用户ID'); return; }
            if (typeof DB.verifyLogin === 'function' && !DB.verifyLogin(id, password)) {
                alert('登录失败：用户不存在或密码错误');
                return;
            }
            if (typeof DB.setCurrentUser === 'function') {
                DB.setCurrentUser(id);
            }
            this.loadWords();
            UI.updateStats();
            alert('登录成功：' + id);
            if (UI.elements.currentUserLabel) {
                UI.elements.currentUserLabel.textContent = id;
            }
        } catch (e) {
            alert('登录失败：' + e.message);
        }
    },
    logoutUser: function() {
        try {
            if (typeof DB.logoutUser === 'function') {
                DB.logoutUser();
            }
            this.loadWords();
            UI.updateStats();
            if (UI.elements.currentUserLabel) {
                UI.elements.currentUserLabel.textContent = '未登录';
            }
            alert('已退出登录');
        } catch (e) {
            alert('退出登录失败：' + e.message);
        }
    },

    // 保存 GPT 设置
    saveGPTSettings: function(cfg) {
        const saved = DB.saveGPTConfig ? DB.saveGPTConfig(cfg) : cfg;
        return saved;
    },

    // 测试 GPT 设置（OpenAI 兼容接口：/v1/chat/completions）
    testGPTSettings: async function(cfg) {
        const baseUrlInput = (cfg?.baseUrl || '').trim();
        const apiKey = (cfg?.apiKey || '').trim();
        const model = (cfg?.model || '').trim();
        
        console.log('测试GPT配置:', {
            baseUrl: baseUrlInput,
            model: model,
            apiKeyLength: apiKey ? apiKey.length : 0
        });
        
        if (!baseUrlInput || !apiKey || !model) {
            return { ok: false, error: '请填写基础地址、模型名与 API 密钥' };
        }
        // 规范化基础地址并强制 https（本地开发例外）
        let base = baseUrlInput.replace(/\/$/, '');
        if (/^http:\/\//i.test(base)) {
            const isLocal = /^http:\/\/(localhost(?::\d+)?|127\.\d+\.\d+\.\d+(?::\d+)?|10\.\d+\.\d+\.\d+(?::\d+)?|192\.168\.\d+\.\d+(?::\d+)?)/i.test(base);
            if (!isLocal) {
                base = base.replace(/^http:\/\//i, 'https://');
                console.warn('测试设置：非本地 HTTP 基础地址已自动升级为 HTTPS');
            }
        }
        if (!/\/v1\/?$/.test(base)) {
            base = base + '/v1';
        }
        const url = base + '/chat/completions';
        
        console.log('GPT测试请求URL:', url);
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: '只回复：设置已连接' }
                    ],
                    max_tokens: 16,
                    temperature: 0
                })
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                return { ok: false, error: `HTTP ${resp.status} ${resp.statusText} ${text}` };
            }
            const data = await resp.json();
            const reply = data?.choices?.[0]?.message?.content || '';
            return { ok: true, reply };
        } catch (e) {
            return { ok: false, error: e.message || String(e) };
        }
    },

    // 翻转卡片并控制倒计时
    flipCard: function() {
        const isBack = UI.flipCard();
        // 翻到正面时不立即朗读，等待半程揭示
        if (!isBack) {
            this.frontChineseRevealed = false;
        }
        if (this.autoPlayEnabled) {
            try { document.body.classList.remove('paused'); } catch(_) {}
            this.startCountdown();
        } else {
            this.stopCountdown();
            try { document.body.classList.add('paused'); } catch(_) {}
        }
    },

    // 启动倒计时，并在正面半程揭示中文与朗读
    startCountdown: function() {
        try { document.body.classList.remove('paused'); } catch(_) {}
        this.stopCountdown();
        // 获取用户选择的倒计时时长
        const selectedTime = UI.elements.countdownTime ? parseInt(UI.elements.countdownTime.value) : 5;
        let remaining = selectedTime;
        this.countdownRemaining = remaining;
        this.frontChineseRevealed = false;
        if (UI.elements.countdown) {
            UI.elements.countdown.textContent = String(remaining);
        }
        try { UI.updateCountdownLeft(String(remaining)); } catch(_) {}
        if (UI.elements.countdownStatus) { UI.elements.countdownStatus.textContent = String(remaining); }
        const halfPoint = Math.ceil(selectedTime / 2);
        this.countdownTimerId = setInterval(() => {
            remaining -= 1;
            this.countdownRemaining = remaining;
            if (UI.elements.countdown) {
                UI.elements.countdown.textContent = String(Math.max(remaining, 0));
            }
            try { UI.updateCountdownLeft(String(Math.max(remaining, 0))); } catch(_) {}
            if (UI.elements.countdownStatus) { UI.elements.countdownStatus.textContent = String(Math.max(remaining, 0)); }
            if (UI.elements.countdownStatus) { UI.elements.countdownStatus.textContent = String(Math.max(remaining, 0)); }

            const isBack = UI.elements.flashcard && UI.elements.flashcard.classList.contains('flipped');
            // 正面半程时：揭示中文并朗读
            if (!isBack && !this.frontChineseRevealed && remaining === halfPoint) {
                UI.revealFrontChinese();
                if (this.speakEnabled) {
                    // 按当前学习模式执行朗读序列（支持英语/中文组合）
                    try { this.runLearnMode(); } catch(_) { try { this.speakWord(); } catch(_) {} }
                }
                this.frontChineseRevealed = true;
            }

            if (remaining <= 0) {
                if (window.speechSynthesis && window.speechSynthesis.speaking) { return; }
                this.stopCountdown();
                if (!isBack) {
                    // 正面倒计时结束：翻到背面并重新倒计时
                    this.flipCard();
                } else {
                    // 背面倒计时结束：切到下一个单词
                    this.nextCard();
                }
            }
        }, 1000);
    },

    // 从当前剩余秒数恢复倒计时（暂停/继续）
    resumeCountdown: function() {
        if (!this.autoPlayEnabled) return;
        
        // 清除可能存在的定时器
        if (this.countdownTimerId) {
            clearInterval(this.countdownTimerId);
            this.countdownTimerId = null;
        }
        
        // 如果没有剩余时间，重新开始倒计时
        if (this.countdownRemaining <= 0) {
            this.startCountdown();
            return;
        }
        
        // 从剩余时间继续倒计时
        let remaining = this.countdownRemaining;
        const selectedTime = UI.elements.countdownTime ? parseInt(UI.elements.countdownTime.value) : 5;
        const halfPoint = Math.ceil(selectedTime / 2);
        
        // 更新显示
        if (UI.elements.countdown) {
            UI.elements.countdown.textContent = String(remaining);
        }
        try { UI.updateCountdownLeft(String(remaining)); } catch(_) {}
        if (UI.elements.countdownStatus) { 
            UI.elements.countdownStatus.textContent = String(remaining); 
        }
        
        this.countdownTimerId = setInterval(() => {
            remaining -= 1;
            this.countdownRemaining = remaining;
            if (UI.elements.countdown) {
                UI.elements.countdown.textContent = String(Math.max(remaining, 0));
            }
            try { UI.updateCountdownLeft(String(Math.max(remaining, 0))); } catch(_) {}
            if (UI.elements.countdownStatus) { UI.elements.countdownStatus.textContent = String(Math.max(remaining, 0)); }
            
            const isBack = UI.elements.flashcard && UI.elements.flashcard.classList.contains('flipped');
            // 正面半程时：揭示中文并朗读（只有在未揭示时才执行）
            if (!isBack && !this.frontChineseRevealed && remaining === halfPoint) {
                UI.revealFrontChinese();
                if (this.speakEnabled) {
                    // 按当前学习模式执行朗读序列（支持英语/中文组合）
                    try { this.runLearnMode(); } catch(_) { try { this.speakWord(); } catch(_) {} }
                }
                this.frontChineseRevealed = true;
            }
            
            if (remaining <= 0) {
                if (window.speechSynthesis && window.speechSynthesis.speaking) { return; }
                this.stopCountdown();
                if (!isBack) {
                    this.flipCard();
                } else {
                    this.nextCard();
                }
            }
        }, 1000);
    },

    // 停止倒计时
    stopCountdown: function() {
        if (this.countdownTimerId) {
            clearInterval(this.countdownTimerId);
            this.countdownTimerId = null;
        }
        // 只有在完全停止自动播放时才重置剩余时间和清空显示
        if (!this.autoPlayEnabled) {
            this.countdownRemaining = 0;
            if (UI.elements.countdown) {
                UI.elements.countdown.textContent = '';
            }
            try { UI.updateCountdownLeft(''); } catch(_) {}
        }
        this.autoPaused = false;
        try { document.body.classList.add('paused'); } catch(_) {}
    },

    // 切换自动播放
    toggleAutoPlay: function() {
        this.autoPlayEnabled = !this.autoPlayEnabled;
        // 更新按钮文案（根据当前语言）
        if (UI.elements.autoPlayBtn) {
            try {
                if (UI.applyLanguage) {
                    UI.applyLanguage();
                } else {
                    UI.elements.autoPlayBtn.textContent = this.autoPlayEnabled ? '⏹️ 停止自动播放' : '▶️ 自动播放';
                }
            } catch(_) {}
            // 切换视觉状态指示
            try { UI.elements.autoPlayBtn.classList.toggle('auto-on', this.autoPlayEnabled); } catch(_){}
        }
        // 启用时在当前页面直接启动倒计时；关闭时停止
        if (this.autoPlayEnabled) {
            this.startCountdown();
        } else {
            this.stopCountdown();
        }
    },

    // 暂停自动播放（保留剩余时间与显示）
    pauseAutoPlay: function() {
        if (!this.autoPlayEnabled) return;
        
        if (this.countdownTimerId) {
            clearInterval(this.countdownTimerId);
            this.countdownTimerId = null;
        }
        this.autoPaused = true;
        try { document.body.classList.add('paused'); } catch(_) {}
    },
    
    // 继续自动播放（从剩余时间恢复）
    resumeAutoPlay: function() {
        if (!this.autoPlayEnabled || !this.autoPaused) return;
        
        this.autoPaused = false;
        try { document.body.classList.remove('paused'); } catch(_) {}
        
        // 恢复倒计时
        this.resumeCountdown();
    },

    // 切换发音模式（按钮蓝色为开启，白色为关闭）
    toggleSpeakMode: function() {
        this.speakEnabled = !this.speakEnabled;
        const btn = UI.elements.speakButton;
        if (btn) {
            try { btn.classList.toggle('toggled', this.speakEnabled); } catch(_){}
        }
    },

    // 下一张卡片（不在切换时立即朗读，等待半程）
    nextCard: async function() {
        if (this.words.length === 0) return;
        
        // 停止倒计时（切换卡片前）
        this.stopCountdown();
        
        // 移除当前单词并压入历史栈
        const removed = this.words.splice(this.currentIndex, 1)[0];
        if (removed) {
            this.history.push(removed);
        }
        
        // 如果需要学习的词为空，则重新加载
        if (this.words.length === 0) {
            this.loadWords();
            // 自动播放：正面开始倒计时
            if (this.autoPlayEnabled) {
                this.startCountdown();
            }
            return;
        }
        
        // 确保索引在有效范围内
        if (this.currentIndex >= this.words.length) {
            this.currentIndex = 0;
        }
        
        // 更新卡片和统计
        UI.updateCard(this.words[this.currentIndex]);
        UI.updateStats();
        this.frontChineseRevealed = false;
        // 非自动播放时：中文模式下无论是否开启“读单词”都执行学习模式朗读；其他模式遵循开关
        if (!this.autoPlayEnabled) {
            const mode = UI.elements.learnMode ? UI.elements.learnMode.value : 'en1';
            const includesZh = /zh/i.test(String(mode));
            if (includesZh) {
                try { await this.runLearnMode(); } catch(_) {}
            } else if (this.speakEnabled) {
                try { await this.runLearnMode(); } catch(_) { try { this.speakWord(); } catch(_) {} }
            }
        }

        // 自动播放：正面开始倒计时
        if (this.autoPlayEnabled) {
            this.startCountdown();
        }
    },

        // 上一张卡片：从历史栈恢复最近移除的词，不改变数据库学习标记
        prevCard: async function() {
        if (!Array.isArray(this.history) || this.history.length === 0) return;
        // 切换前停止倒计时
        this.stopCountdown();
        const previous = this.history.pop();
        if (!previous) return;
        // 插入到当前索引处，显示它
        this.words.splice(this.currentIndex, 0, previous);
        UI.updateCard(this.words[this.currentIndex]);
        UI.updateStats();
        this.frontChineseRevealed = false;
        if (this.autoPlayEnabled) {
            this.startCountdown();
        } else {
            const mode = UI.elements.learnMode ? UI.elements.learnMode.value : 'en1';
            const includesZh = /zh/i.test(String(mode));
            if (includesZh) {
                try { await this.runLearnMode(); } catch(_) {}
            } else if (this.speakEnabled) {
                try { await this.runLearnMode(); } catch(_) { try { this.speakWord(); } catch(_) {} }
            }
        }
    },
    
    // 标记为需要复习
    // 记录正确答案
    markCorrect: function() {
        if (this.words.length === 0) return;
        const wordText = this.words[this.currentIndex].word;
        const all = DB.getAllWords();
        const wordIndex = all.findIndex(w => w.word === wordText);
        if (wordIndex !== -1) {
            // 标记为已学习（用于24小时统计）
            if (typeof DB.markWordAsStudied === 'function') {
                DB.markWordAsStudied(wordIndex);
            }
            DB.recordAnswer(wordIndex, true);
            // 更新当前显示的单词状态
            const updatedWord = all[wordIndex];
            Object.assign(this.words[this.currentIndex], updatedWord);
        }
        UI.updateStats();
        this.nextCard();
    },

    // 记录错误答案
    markIncorrect: function() {
        if (this.words.length === 0) return;
        const wordText = this.words[this.currentIndex].word;
        const all = DB.getAllWords();
        const wordIndex = all.findIndex(w => w.word === wordText);
        if (wordIndex !== -1) {
            DB.recordAnswer(wordIndex, false);
            // 答错标记为生词并保存
            all[wordIndex].isNewWord = true;
            if (typeof DB.saveFileData === 'function') {
                DB.saveFileData(all);
            }
            // 更新当前显示的单词状态
            const updatedWord = all[wordIndex];
            Object.assign(this.words[this.currentIndex], updatedWord);
        }
        UI.updateStats();
        this.nextCard();
    },

    markDontRemember: function() {
        if (this.words.length === 0) return;
        const wordText = this.words[this.currentIndex].word;
        const all = DB.getAllWords();
        const wordIndex = all.findIndex(w => w.word === wordText);
        if (wordIndex !== -1) {
            const current = all[wordIndex] || {};
            const next = !current.needsReview;
            if (next) DB.markWordForReview(wordIndex); else if (typeof DB.unmarkWordForReview === 'function') DB.unmarkWordForReview(wordIndex);
            this.words[this.currentIndex].needsReview = next;
            // 关联生词统计：标记为需要复习时，自动记为生词
            if (next) {
                if (typeof DB.markWordAsNew === 'function') DB.markWordAsNew(wordIndex); else { all[wordIndex].isNewWord = true; DB.saveFileData(all); }
                this.words[this.currentIndex].isNewWord = true;
            }
            try { const btn = UI.elements.dontRememberTopBtn; if (btn) btn.classList.toggle('active', !!next); } catch(_){}
        }
        UI.updateStats();
    },

    // 新增：标记为生词本（点击后跳过当前词）
    markNewWord: function() {
        if (this.words.length === 0) return;
        const wordText = this.words[this.currentIndex].word;
        const all = DB.getAllWords();
        const wordIndex = all.findIndex(w => w.word === wordText);
        if (wordIndex !== -1) {
            const current = all[wordIndex] || {};
            const next = !current.isNewWord;
            if (next) { if (typeof DB.markWordAsNew === 'function') DB.markWordAsNew(wordIndex); else { all[wordIndex].isNewWord = true; DB.saveFileData(all);} }
            else { if (typeof DB.unmarkWordAsNew === 'function') DB.unmarkWordAsNew(wordIndex); else { all[wordIndex].isNewWord = false; DB.saveFileData(all);} }
            this.words[this.currentIndex].isNewWord = next;
            try { const btn = UI.elements.addNewWordBtn; if (btn) btn.classList.toggle('active', !!next); } catch(_){}
        }
        UI.updateStats();
        // 跳过当前单词，直接到下一张卡片
        this.nextCard();
    },
    
    // 朗读单词（若未传入，则朗读当前卡片词）
    speakWord: async function(word) {
        if (typeof word === 'undefined' && !this.speakEnabled) return;
        const current = (word != null && word !== undefined) ? String(word) : (this.words[this.currentIndex] ? this.words[this.currentIndex].word : '');
        if (!current) return;
        const rate = parseFloat(UI.elements.speechRate?.value || '1');
        const accent = UI.elements.accent?.value || 'en-US';
        try {
            const cap = window.Capacitor;
            let ttsPlugin = null;
            if (cap && typeof cap.getPlugin === 'function') {
                ttsPlugin = cap.getPlugin('TextToSpeech');
            } else if (cap && cap.Plugins && cap.Plugins.TextToSpeech) {
                ttsPlugin = cap.Plugins.TextToSpeech;
            } else if (window.TextToSpeech) {
                ttsPlugin = window.TextToSpeech;
            }
            if (ttsPlugin && typeof ttsPlugin.speak === 'function') {
                try { await ttsPlugin.speak({ text: current, lang: accent, rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){}
                try { await ttsPlugin.speak({ text: current, locale: accent, rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){}
                try { await ttsPlugin.speak({ text: current, lang: 'en', rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){}
                try { await ttsPlugin.speak({ text: current, locale: 'en', rate: rate, pitch: 1.0, volume: 1.0 }); return; } catch(_){}
            }
        } catch (e) {
            console.warn('Capacitor TTS 调用失败，回退到 Web Speech API:', e);
        }
        const synth = window.speechSynthesis;
        if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
            alert('当前环境不支持语音朗读，请在浏览器中使用或安装支持的引擎。');
            return;
        }
        const utterance = new SpeechSynthesisUtterance(current);
        utterance.rate = rate;
        utterance.lang = accent;
        async function getVoicesAsync() {
            let voices = synth.getVoices ? synth.getVoices() : [];
            if (voices && voices.length) return voices;
            await new Promise(resolve => {
                try {
                    const handler = () => { resolve(); synth.removeEventListener('voiceschanged', handler); };
                    synth.addEventListener('voiceschanged', handler);
                    setTimeout(resolve, 500);
                } catch(_) { setTimeout(resolve, 300); }
            });
            return synth.getVoices ? synth.getVoices() : [];
        }
        try {
            const voices = await getVoicesAsync();
            const selectedVoice = voices && voices.find(v => String(v.lang).toLowerCase().includes(String(accent).toLowerCase()));
            if (selectedVoice) utterance.voice = selectedVoice;
        } catch(_){}
        return await new Promise(resolve => { try { synth.cancel && synth.cancel(); } catch(_) {} utterance.onend = resolve; utterance.onerror = resolve; synth.speak(utterance); });
    },

    // 测试语音

    testSpeech: async function() {
        const testText = 'hello';
        const rate = parseFloat(UI.elements.speechRate?.value || '1');
        const accent = UI.elements.accent?.value || 'en-US';
        try {
            const cap = window.Capacitor;
            let ttsPlugin = null;
            if (cap && typeof cap.getPlugin === 'function') {
                ttsPlugin = cap.getPlugin('TextToSpeech');
            } else if (cap && cap.Plugins && cap.Plugins.TextToSpeech) {
                ttsPlugin = cap.Plugins.TextToSpeech;
            } else if (window.TextToSpeech) {
                ttsPlugin = window.TextToSpeech;
            }
            if (ttsPlugin && typeof ttsPlugin.speak === 'function') {
                try { await ttsPlugin.speak({ text: testText, lang: String(accent), rate: rate, pitch: 1.0, volume: 1.0 }); return true; } catch(_){}
                try { await ttsPlugin.speak({ text: testText, locale: String(accent), rate: rate, pitch: 1.0, volume: 1.0 }); return true; } catch(_){}
                try { await ttsPlugin.speak({ text: testText, lang: 'en', rate: rate, pitch: 1.0, volume: 1.0 }); return true; } catch(_){}
                try { await ttsPlugin.speak({ text: testText, locale: 'en', rate: rate, pitch: 1.0, volume: 1.0 }); return true; } catch(_){}
            }
        } catch (e) {
            console.warn('Capacitor TTS 测试失败，回退到 Web Speech API:', e);
        }
        const synth = window.speechSynthesis;
        if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
            return false;
        }
        try {
            const ensureVoicesLoaded = async (timeout = 1500) => {
                return new Promise(resolve => {
                    let voices = (synth.getVoices && synth.getVoices()) || [];
                    if (voices.length) return resolve(voices);
                    const handler = () => {
                        voices = (synth.getVoices && synth.getVoices()) || [];
                        if (voices.length) {
                            synth.removeEventListener('voiceschanged', handler);
                            resolve(voices);
                        }
                    };
                    try { synth.addEventListener('voiceschanged', handler); } catch(_) {}
                    setTimeout(() => {
                        try { synth.removeEventListener('voiceschanged', handler); } catch(_) {}
                        resolve((synth.getVoices && synth.getVoices()) || []);
                    }, timeout);
                });
            };
            const voices = await ensureVoicesLoaded();
            const utterance = new SpeechSynthesisUtterance(testText);
            utterance.rate = rate;
            utterance.lang = accent;
            const selectedVoice = voices && voices.find(v => String(v.lang).toLowerCase().includes(String(accent).toLowerCase()));
            if (selectedVoice) utterance.voice = selectedVoice;
            synth.cancel && synth.cancel();
            synth.speak(utterance);
            return true;
        } catch (e) {
            return false;
        }
    },

    // 启动单词增强服务
    startWordEnhancement: async function() {
        try {
            console.log('启动单词增强服务...');
            
            // 检查单词增强服务是否可用
            if (typeof wordEnhancementService === 'undefined') {
                console.warn('单词增强服务不可用');
                return;
            }

            // 检查并输出服务状态
            const status = wordEnhancementService.logServiceStatus();
            
            // 如果GPT未配置，提示用户
            if (!status.gptConfigured) {
                console.warn('⚠️ GPT未配置或配置不完整，将仅使用本地词典');
                console.log('💡 要启用GPT增强，请在设置中配置GPT服务：');
                console.log('   1. 点击右上角设置按钮');
                console.log('   2. 填写GPT设置：API地址、模型和密钥');
                console.log('   3. 点击"测试连接"验证配置');
            }

            // 获取所有单词
            let allWords = DB.getAllWords() || [];
            if (allWords.length === 0) {
                console.log('没有单词需要增强');
                return;
            }

            // 优先增强当前学习的单词：将当前索引的单词移动到队列最前
            if (this.currentIndex >= 0 && this.currentIndex < allWords.length) {
                const [currentWord] = allWords.splice(this.currentIndex, 1);
                allWords.unshift(currentWord);
            }

            // 设置进度回调（统一通过 UI.updateEnhancementProgress 更新）
            wordEnhancementService.setProgressCallback((current, total, enhanced) => {
                try {
                    UI.updateEnhancementProgress(current, total, enhanced);
                } catch (e) {
                    // 兜底日志，避免因 UI 未初始化导致报错
                    try {
                        const progress = Math.round((current / total) * 100);
                        console.log(`单词增强进度: ${current}/${total} (${progress}%)${enhanced ? ` (已增强: ${enhanced})` : ''}`);
                    } catch(_){ }
                }
            });

            // 开始批量增强
            const enhancedWords = await wordEnhancementService.batchEnhanceWords(allWords);
            
            // 更新本地单词数据
            this.words = enhancedWords;
            
            // 刷新当前显示的卡片
            if (this.words.length > 0 && this.currentIndex < this.words.length) {
                UI.updateCard(this.words[this.currentIndex]);
            }
            
            console.log(`单词增强完成，处理了 ${enhancedWords.length} 个单词`);

            // 增强完成后统一通过 UI 接口设置到 100%
            try {
                UI.updateEnhancementProgress(enhancedWords.length, enhancedWords.length, enhancedWords.length);
            } catch(_){ }
            
        } catch (error) {
            console.error('单词增强服务启动失败:', error);
        }
    },

    // 手动触发单个单词增强
    enhanceSingleWord: async function(wordIndex) {
        try {
            if (!this.words[wordIndex]) {
                console.error('单词索引无效:', wordIndex);
                return;
            }

            const word = this.words[wordIndex];
            console.log(`开始增强单词: ${word.word}`);

            // 检查单词增强服务是否可用
            if (typeof wordEnhancementService === 'undefined') {
                console.warn('单词增强服务不可用');
                return;
            }

            const enhancedWord = await wordEnhancementService.enhanceWord(word);
            
            // 更新本地数据
            this.words[wordIndex] = enhancedWord;
            
            // 如果是当前显示的单词，刷新显示
            if (wordIndex === this.currentIndex) {
                UI.updateCard(enhancedWord);
            }
            
            console.log(`单词增强完成: ${word.word}`);
            return enhancedWord;
            
        } catch (error) {
            console.error('单词增强失败:', error);
            return null;
        }
    },

    // 检查单词增强状态
    checkEnhancementStatus: function() {
        if (typeof wordEnhancementService === 'undefined') {
            return { available: false, processing: false };
        }
        
        return {
            available: true,
            processing: wordEnhancementService.isProcessingWords()
        };
    },

    // 更新状态指示器
    updateStatusIndicator: function() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const enhancementStatus = document.getElementById('enhancementStatus');
        
        if (!statusIndicator || !statusText || !enhancementStatus) return;

        try {
            // 检查增强服务状态
            if (typeof wordEnhancementService === 'undefined') {
                statusIndicator.className = 'status-indicator disabled';
                statusText.textContent = '服务未加载';
                enhancementStatus.title = '增强服务未加载';
                return;
            }

            const serviceStatus = wordEnhancementService.getServiceStatus();
            
            if (!serviceStatus.gptConfigured) {
                statusIndicator.className = 'status-indicator disabled';
                statusText.textContent = 'GPT未配置';
                enhancementStatus.title = '请在设置中配置GPT API';
            } else if (serviceStatus.processing) {
                statusIndicator.className = 'status-indicator working';
                statusText.textContent = '增强中...';
                enhancementStatus.title = '正在增强单词内容';
            } else if (serviceStatus.localDictionaryLoaded) {
                statusIndicator.className = 'status-indicator ready';
                statusText.textContent = '就绪';
                enhancementStatus.title = '增强服务已就绪';
            } else {
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = '加载失败';
                enhancementStatus.title = '本地词典加载失败';
            }
        } catch (error) {
            console.error('更新状态指示器失败:', error);
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = '错误';
            enhancementStatus.title = '状态检查失败: ' + error.message;
        }
    },

    // 初始化状态指示器
    initStatusIndicator: function() {
        const enhancementStatus = document.getElementById('enhancementStatus');
        if (enhancementStatus) {
            // 点击状态指示器：在同页跳转到调试页面（强制顶层、绝对路径），避免新窗口与相对路径问题
            enhancementStatus.setAttribute('role', 'button');
            enhancementStatus.setAttribute('tabindex', '0');
            const goDebug = () => {
                try {
                    const abs = (location.origin && location.origin !== 'null')
                        ? `${location.origin}/debug.html?v=sw4`
                        : 'debug.html?v=sw4';
                    try { window.top.location.assign(abs); }
                    catch(_) { window.location.href = abs; }
                } catch(_) {}
            };
            enhancementStatus.addEventListener('click', (e) => {
                try {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                } catch(_) {}
                goDebug();
            });
            enhancementStatus.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goDebug();
                }
            });
        }

        // 定期更新状态
        this.updateStatusIndicator();
        setInterval(() => {
            this.updateStatusIndicator();
        }, 3000); // 每3秒更新一次状态
    },

    // 注册Service Worker
    registerServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker 注册成功:', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker 注册失败:', error);
                    });
            });
        }
    }
};

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    try { UI.adjustFlashcardHeight && UI.adjustFlashcardHeight(); } catch(_){ }
});

// 导出App对象
window.App = App;

// 兼容旧版内联事件函数，统一指向App/UI实现
window.flipCard = () => App.flipCard();
window.nextCard = () => App.nextCard();
window.prevCard = () => App.prevCard();
window.markDontRemember = () => App.markDontRemember();
window.speakWord = () => App.speakWord();
window.updateStats = () => UI.updateStats();
// 部分页面使用的设置更新为无操作（App在朗读时读取当前值）
window.updateSpeechSettings = () => {};
