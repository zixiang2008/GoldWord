/**
 * GoldWord - 单词信息自动补全服务
 * 
 * 核心原则：
 * 1. 用户输入时只需要单词一项
 * 2. 软件启动时自动后台运行补充单词信息
 * 3. 数据库中完整数据跳过
 * 4. 优先调用本地服务，不能完成的调用GPT
 */

class WordEnhancementService {
    constructor() {
        this.isProcessing = false;
        this.processingQueue = [];
        this.localDictionary = null;
        this.gptConfig = null;
        
        // 初始化本地词典
        this.initLocalDictionary();
    }

    /**
     * 初始化本地词典数据
     */
    async initLocalDictionary() {
        try {
            // 尝试加载本地词典文件
            const response = await fetch('./local-dictionary.json');
            if (response.ok) {
                this.localDictionary = await response.json();
                console.log('本地词典加载成功');
            } else {
                console.warn('本地词典文件不存在，将完全依赖GPT服务');
                this.localDictionary = { basicWords: {}, collocations: {}, etymology: {} };
            }
        } catch (error) {
            console.warn('本地词典加载失败:', error);
            this.localDictionary = { basicWords: {}, collocations: {}, etymology: {} };
        }
    }

    /**
     * 检查单词是否需要增强
     * @param {Object} word - 单词对象
     * @returns {boolean} 是否需要增强
     */
    needsEnhancement(word) {
        if (!word.aiStatus) return true;
        if (!word.aiStatus.isComplete) return true;
        
        // 检查必要字段是否完整
        const requiredFields = ['phonetic', 'partOfSpeech'];
        for (const field of requiredFields) {
            if (!word[field]) return true;
        }
        
        // 检查AI增强信息是否完整
        if (!word.aiEnhanced) return true;
        const aiRequiredFields = ['definition', 'chineseMeaning'];
        for (const field of aiRequiredFields) {
            if (!word.aiEnhanced[field]) return true;
        }
        
        return false;
    }

    /**
     * 批量处理单词增强
     * @param {Array} words - 单词数组
     * @returns {Promise<Array>} 增强后的单词数组
     */
    async batchEnhanceWords(words, opts) {
        if (this.isProcessing) {
            console.log('批量增强已在进行中，跳过重复请求');
            return words;
        }

        this.isProcessing = true;
        const force = !!(opts && opts.force);
        const enhancedWords = [];
        let processedCount = 0;
        let enhancedCount = 0;

        // 检查GPT配置
        const gptConfig = await this.getGPTConfig();
        const hasGPTConfig = gptConfig && gptConfig.apiKey && gptConfig.baseUrl && gptConfig.model;
        
        if (!hasGPTConfig) {
            console.warn('GPT未配置，仅使用本地词典增强');
        }

        console.log(`开始批量增强 ${words.length} 个单词${force ? '（强制）' : ''}，GPT配置: ${hasGPTConfig ? '已配置' : '未配置'}`);

        for (const word of words) {
            try {
                if (force || this.needsEnhancement(word)) {
                    console.log(`正在增强单词: ${word.word} (${processedCount + 1}/${words.length})`);
                    const enhancedWord = await this.enhanceWord(word, { force });
                    enhancedWords.push(enhancedWord);
                    enhancedCount++;
                    
                    // 保存到数据库
                    if (typeof DB !== 'undefined' && DB.saveWordData) {
                        DB.saveWordData(enhancedWord);
                    }
                    
                    // 智能延迟：GPT查询需要更长延迟
                    if (hasGPTConfig && this.hasIncompleteFields(word)) {
                        await this.delay(800); // GPT查询延迟
                    } else {
                        await this.delay(200); // 本地查询延迟
                    }
                } else {
                    enhancedWords.push(word);
                }
                
                processedCount++;
                
                // 更新进度（如果有UI回调）
                if (this.onProgress) {
                    this.onProgress(processedCount, words.length, enhancedCount);
                }
                
            } catch (error) {
                console.error(`增强单词 ${word.word} 失败:`, error);
                enhancedWords.push(word); // 保留原始单词
                processedCount++;
            }
        }

        this.isProcessing = false;
        console.log(`批量增强完成，处理了 ${processedCount} 个单词，其中 ${enhancedCount} 个被增强`);
        return enhancedWords;
    }

    /**
     * 检查单词是否有不完整的字段（需要GPT查询）
     * @param {Object} word - 单词对象
     * @returns {boolean} 是否有不完整字段
     */
    hasIncompleteFields(word) {
        const requiredFields = ['phonetic', 'partOfSpeech', 'definition', 'chinese'];
        return requiredFields.some(field => !word[field] || word[field].trim() === '');
    }

    /**
     * 获取GPT配置
     * @returns {Promise<Object|null>} GPT配置对象
     */
    async getGPTConfig() {
        // 始终从数据库读取最新配置，避免缓存造成的误判
        if (typeof DB !== 'undefined' && DB.getGPTConfig) {
            this.gptConfig = DB.getGPTConfig();
        }
        return this.gptConfig;
    }

    /**
     * 增强单个单词
     * @param {Object} word - 单词对象
     * @returns {Promise<Object>} 增强后的单词对象
     */
    async enhanceWord(word, opts) {
        const enhancedWord = { ...word };
        const force = !!(opts && opts.force);
        
        // 初始化必要的数据结构
        if (!enhancedWord.aiEnhanced) {
            enhancedWord.aiEnhanced = {};
        }
        if (!enhancedWord.aiStatus) {
            enhancedWord.aiStatus = {
                isComplete: false,
                lastEnhanced: Date.now(),
                enhancementSource: '',
                enhancementVersion: 1,
                generationSteps: {}
            };
        }

        try {
            // 1. 尝试本地词典查询
            const localData = await this.queryLocalDictionary(word.word);
            if (localData) {
                this.mergeLocalData(enhancedWord, localData);
                enhancedWord.aiStatus.enhancementSource = 'local';
            }

            // 2. 如果本地数据不完整，或启用强制模式，调用GPT
            if (force || !this.isDataComplete(enhancedWord)) {
                const gptData = await this.queryGPTService(word.word);
                if (gptData) {
                    this.mergeGPTData(enhancedWord, gptData);
                    enhancedWord.aiStatus.enhancementSource = enhancedWord.aiStatus.enhancementSource 
                        ? enhancedWord.aiStatus.enhancementSource + '+gpt' 
                        : 'gpt';
                }
            }

            // 2.1 如果仍然缺项，逐字段补齐
            const fieldsOrder = [
                'phonetic',
                'partOfSpeech',
                'definition',
                'chineseMeaning',
                'collocations',
                'example',
                'memoryTip',
                'association'
            ];
            for (const f of fieldsOrder) {
                const hasValue = (() => {
                    if (f === 'phonetic' || f === 'partOfSpeech') return !!enhancedWord[f];
                    return !!enhancedWord.aiEnhanced[f];
                })();
                if (!hasValue) {
                    const obj = await this.queryGPTField(enhancedWord.word, f);
                    if (obj && obj[f] !== undefined) {
                        this.assignFieldToWord(enhancedWord, f, obj[f]);
                        // 小间隔，避免打爆速率限制
                        await this.delay(200);
                    }
                }
            }

            // 3. 更新完成状态
            enhancedWord.aiStatus.isComplete = this.isDataComplete(enhancedWord);
            enhancedWord.aiStatus.lastEnhanced = Date.now();
            enhancedWord.updatedAt = Date.now();

        } catch (error) {
            console.error(`增强单词 ${word.word} 时出错:`, error);
        }

        return enhancedWord;
    }

    /**
     * 查询本地词典
     * @param {string} word - 单词
     * @returns {Promise<Object|null>} 本地词典数据
     */
    async queryLocalDictionary(word) {
        if (!this.localDictionary) return null;

        const wordLower = word.toLowerCase();
        const result = {};

        // 基础信息
        if (this.localDictionary.basicWords[wordLower]) {
            Object.assign(result, this.localDictionary.basicWords[wordLower]);
        }

        // 搭配信息
        if (this.localDictionary.collocations[wordLower]) {
            result.collocations = this.localDictionary.collocations[wordLower];
        }

        // 词源信息
        if (this.localDictionary.etymology[wordLower]) {
            result.etymology = this.localDictionary.etymology[wordLower];
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * 查询GPT服务
     * @param {string} word - 单词
     * @returns {Promise<Object|null>} GPT返回的数据
     */
    async queryGPTService(word) {
        try {
            // 获取最新GPT配置
            this.gptConfig = await this.getGPTConfig();

            console.log('GPT配置检查:', {
                hasConfig: !!this.gptConfig,
                hasApiKey: !!(this.gptConfig && this.gptConfig.apiKey),
                hasBaseUrl: !!(this.gptConfig && this.gptConfig.baseUrl),
                hasModel: !!(this.gptConfig && this.gptConfig.model),
                config: this.gptConfig ? {
                    baseUrl: this.gptConfig.baseUrl,
                    model: this.gptConfig.model,
                    apiKeyLength: this.gptConfig.apiKey ? this.gptConfig.apiKey.length : 0
                } : null
            });

            if (!this.gptConfig || !this.gptConfig.apiKey || !this.gptConfig.baseUrl || !this.gptConfig.model) {
                console.warn('GPT配置不完整，跳过GPT查询。需要: baseUrl, apiKey, model');
                return null;
            }

            const prompt = GPTPromptTemplates.COMPLETE_WORD_INFO.replace('{word}', word);
            // 规范化基础地址：去除空格/引号/反引号，补齐 /v1 前缀
            const base = this.normalizeBaseUrl(this.gptConfig.baseUrl);
            const apiUrl = base + '/chat/completions';
            // 输出请求提示词，方便调试
            console.log('GPT请求提示词:', prompt);
            
            console.log('发起GPT请求:', {
                word: word,
                apiUrl: apiUrl,
                model: this.gptConfig.model || 'gpt-4o-mini'
            });
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.gptConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.gptConfig.model || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            console.log('GPT响应状态:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('GPT API 错误响应:', errorText);
                throw new Error(`GPT API 请求失败: ${response.status} - ${errorText}`);
            }

            // 解析JSON；若返回非JSON（例如HTML）会抛错
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                throw new Error('GPT 返回内容为空');
            }

            // 尝试从内容中提取 JSON（支持 ```json 代码块等）
            console.log('GPT原始返回文本:', content);
            const obj = this.extractJsonFromContent(content);
            if (obj) {
                console.log('GPT解析结果对象:', obj);
                return obj;
            }
            console.error('GPT 返回内容不是有效的JSON:', content);
            return null;

        } catch (error) {
            console.error('GPT查询失败:', error);
            return null;
        }
    }

    /**
     * 构建单字段提示词
     * @param {string} field - 字段名
     * @param {string} word - 单词文本
     * @returns {string} prompt
     */
    buildPromptForField(field, word) {
        const map = {
            definition: 'DEFINITION_BRIEF_CN15',
            collocations: 'COLLOCATIONS_TOP2_BULLETS',
            example: 'EXAMPLE_TOEFL_12',
            chineseMeaning: 'CHINESE_4',
            phonetic: 'IPA',
            partOfSpeech: 'POS_ABBR',
            memoryTip: 'MEMORY_TIP_20',
            association: 'ASSOCIATION_10'
        };
        const tplKey = map[field];
        if (!tplKey || !GPTPromptTemplates[tplKey]) return '';
        return GPTPromptTemplates[tplKey].replace('{word}', word);
    }

    /**
     * 查询单字段 GPT
     * @param {string} wordText - 单词文本
     * @param {string} field - 目标字段
     * @returns {Promise<Object|null>} 返回包含该字段的对象
     */
    async queryGPTField(wordText, field) {
        try {
            // 获取最新GPT配置
            this.gptConfig = await this.getGPTConfig();
            if (!this.gptConfig || !this.gptConfig.apiKey || !this.gptConfig.baseUrl || !this.gptConfig.model) {
                console.log(`跳过字段 ${field} 的GPT查询: 配置不完整`);
                return null;
            }

            const prompt = this.buildPromptForField(field, wordText);
            if (!prompt) {
                console.log(`跳过字段 ${field} 的GPT查询: 无对应模板`);
                return null;
            }

            const base = this.normalizeBaseUrl(this.gptConfig.baseUrl);
            const apiUrl = base + '/chat/completions';
            console.log(`查询字段 ${field} for word "${wordText}"`);
            // 输出字段提示词
            console.log(`字段 ${field} 提示词:`, prompt);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.gptConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.gptConfig.model || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 400
                })
            });
            if (!response.ok) {
                console.error(`字段 ${field} GPT查询失败:`, response.status, response.statusText);
                return null;
            }
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            if (!content) return null;
            console.log(`字段 ${field} 原始返回文本:`, content);
            const obj = this.extractJsonFromContent(content);
            if (obj && typeof obj === 'object' && obj[field] !== undefined) {
                console.log(`字段 ${field} 解析结果对象:`, obj);
                return obj;
            }

            // 回退解析：当未能解析JSON时，针对特定字段做文本解析
            const text = String(content || '').trim();
            if (!text) return null;
            // 固定搭配：按行切分，兼容分隔符“：”、“:”、“+”
            if (field === 'collocations') {
                const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                const items = lines.map(s => {
                    const parts = s.includes('：') ? s.split('：')
                        : (s.includes(':') ? s.split(':')
                        : s.split('+'));
                    const en = (parts[0] || '').trim();
                    const zh = (parts[1] || '').trim();
                    // 统一返回字符串，后续赋值逻辑会处理为 bullets 或对象
                    return zh ? `${en}：${zh}` : s;
                });
                const fallback = { collocations: items };
                console.log(`字段 ${field} 未解析JSON，使用回退解析`, fallback);
                return fallback;
            }
            // 例句：按行切分，兼容“——”、“—”、“ - ”、“：”、“:” 用于英中拆分
            if (field === 'example') {
                const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                const items = lines.map(s => s);
                const fallback = { example: items };
                console.log(`字段 ${field} 未解析JSON，使用回退解析`, fallback);
                return fallback;
            }
            // 其他简单字段：直接返回去噪后的文本
            const simpleFallback = { [field]: text };
            console.log(`字段 ${field} 未解析JSON，按文本回退`, simpleFallback);
            return simpleFallback;
        } catch (e) {
            console.warn('queryGPTField error:', e);
            return null;
        }
    }

    /**
     * 规范化基础地址：
     * - 去掉包裹的引号/反引号与多余空格
     * - 去掉末尾斜杠
     * - 若不包含 /v1 则补齐
     */
    normalizeBaseUrl(raw) {
        let s = String(raw || '').trim();
        // 去掉可能的反引号或引号包裹
        if ((s.startsWith('`') && s.endsWith('`')) || (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length - 1);
        }
        s = s.trim().replace(/\/$/, '');
        // 强制使用 HTTPS（本地开发保留 HTTP）
        if (/^http:\/\//i.test(s)) {
            const isLocal = /^http:\/\/(localhost(?::\d+)?|127\.\d+\.\d+\.\d+(?::\d+)?|10\.\d+\.\d+\.\d+(?::\d+)?|192\.168\.\d+\.\d+(?::\d+)?)/i.test(s);
            if (!isLocal) {
                s = s.replace(/^http:\/\//i, 'https://');
                console.warn('WordEnhancementService: 检测到非本地 HTTP 基础地址，已自动升级为 HTTPS');
            }
        }
        if (!/\/v1\/?$/.test(s)) {
            s = s + '/v1';
        }
        return s;
    }

    /**
     * 从 GPT 返回的文本中提取有效 JSON（中文注释）
     * 参数: content (string) GPT返回的原始文本，可能包含 ```json 代码块或前后噪声
     * 返回: Object|null 提取出的 JSON 对象；无法解析时返回 null
     */
    extractJsonFromContent(content) {
        try {
            let s = String(content || '').trim();
            // 去除 Markdown 代码块包裹，例如 ```json ... ```
            if (s.startsWith('```')) {
                s = s.replace(/^```(?:json|JSON)?\s*/, '');
                s = s.replace(/\s*```$/, '');
            }
            // 防御性：截取第一个 '{' 到最后一个 '}' 之间的内容
            const first = s.indexOf('{');
            const last = s.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                s = s.substring(first, last + 1);
            }
            return JSON.parse(s);
        } catch (_) {
            return null;
        }
    }

    /**
     * 将单字段结果赋值到 word（同时映射到 UI 使用的顶层键）
     * @param {Object} word - 目标对象
     * @param {string} field - 字段名
     * @param {any} value - 值
     */
    assignFieldToWord(word, field, value) {
        if (!word.aiEnhanced) word.aiEnhanced = {};
        switch(field) {
            case 'phonetic':
                if (!word.phonetic && value) {
                    console.log(`合并字段: phonetic -> 顶层 (${word.word})`, String(value));
                    word.phonetic = String(value);
                } else {
                    console.log(`跳过字段: phonetic 已存在，保持原值 (${word.word})`);
                }
                break;
            case 'partOfSpeech':
                if (!word.partOfSpeech && value) {
                    console.log(`合并字段: partOfSpeech -> 顶层 (${word.word})`, String(value));
                    word.partOfSpeech = String(value);
                } else {
                    console.log(`跳过字段: partOfSpeech 已存在，保持原值 (${word.word})`);
                }
                break;
            case 'definition':
                if (!word.aiEnhanced.definition && value) {
                    console.log(`合并字段: definition -> aiEnhanced (${word.word})`, String(value));
                    word.aiEnhanced.definition = String(value);
                } else if (value) {
                    console.log(`跳过字段: aiEnhanced.definition 已存在，保持原值 (${word.word})`);
                }
                if (!word.definition && value) {
                    console.log(`顶层映射: definition <- aiEnhanced.definition (${word.word})`);
                    word.definition = String(value);
                }
                break;
            case 'chineseMeaning':
                if (!word.aiEnhanced.chineseMeaning && value) {
                    console.log(`合并字段: chineseMeaning -> aiEnhanced (${word.word})`, String(value));
                    word.aiEnhanced.chineseMeaning = String(value);
                } else if (value) {
                    console.log(`跳过字段: aiEnhanced.chineseMeaning 已存在，保持原值 (${word.word})`);
                }
                if (!word.chinese && value) {
                    console.log(`顶层映射: chinese <- aiEnhanced.chineseMeaning (${word.word})`);
                    word.chinese = String(value);
                }
                break;
            case 'collocations':
                if (!word.aiEnhanced.collocations && Array.isArray(value)) {
                    console.log(`合并字段: collocations -> aiEnhanced (${word.word})，数量=${value.length}`);
                    word.aiEnhanced.collocations = value;
                } else if (Array.isArray(value)) {
                    console.log(`跳过字段: aiEnhanced.collocations 已存在，保持原值 (${word.word})`);
                }
                if (!word.collocation && Array.isArray(value)) {
                    console.log(`顶层映射: collocation <- aiEnhanced.collocations（bullet 列表，含中文拆分）(${word.word})`);
                    const bullets = value.map(item => {
                        if (typeof item === 'string') {
                            const s = item.trim();
                            // 支持 “英文：中文” 或 “英文:中文” 或 “英文 + 中文”
                            const parts = s.includes('：') ? s.split('：')
                                : (s.includes(':') ? s.split(':')
                                : s.split('+'));
                            const en = (parts[0] || '').trim();
                            const zh = (parts[1] || '').trim();
                            return zh ? `• ${en}：${zh}` : `• ${s}`;
                        }
                        if (item && typeof item === 'object') {
                            const en = String(item.phrase || item.en || '').trim();
                            const zh = String(item.meaning || item.zh || '').trim();
                            return en ? `• ${en}${zh ? `：${zh}` : ''}` : '';
                        }
                        return '';
                    }).filter(Boolean).join('\n');
                    word.collocation = bullets;
                }
                break;
            case 'example':
                if (!word.aiEnhanced.example && value) {
                    console.log(`合并字段: example -> aiEnhanced (${word.word})`, String(value));
                    word.aiEnhanced.example = Array.isArray(value) ? value : String(value);
                } else if (value) {
                    console.log(`跳过字段: aiEnhanced.example 已存在，保持原值 (${word.word})`);
                }
                // 将示例文本解析为3条中英文句子
                if (!Array.isArray(word.examples) || word.examples.length === 0) {
                    const examplesArr = [];
                    const toParse = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
                    for (let i = 0; i < toParse.length && examplesArr.length < 3; i++) {
                        const raw = typeof toParse[i] === 'string' ? toParse[i] : '';
                        const s = raw.trim();
                        if (!s) continue;
                        const parts = s.includes('——') ? s.split('——')
                            : (s.includes('—') ? s.split('—')
                            : (s.includes(' - ') ? s.split(' - ')
                            : (s.includes(':') ? s.split(':')
                            : s.split('：'))));
                        const en = (parts[0] || '').trim();
                        const zh = (parts[1] || '').trim();
                        examplesArr.push({ en, zh });
                    }
                    if (examplesArr.length) {
                        console.log(`顶层映射: examples <- 解析自 example（${word.word}），数量=${examplesArr.length}`);
                        word.examples = examplesArr;
                    } else {
                        console.log(`示例解析失败或为空，保留默认结构 (${word.word})`);
                        word.examples = [{ en: String(value || ''), zh: '' }];
                    }
                }
                break;
            case 'memoryTip':
                if (!word.aiEnhanced.memoryTip && value) {
                    console.log(`合并字段: memoryTip -> aiEnhanced (${word.word})`, String(value));
                    word.aiEnhanced.memoryTip = String(value);
                } else if (value) {
                    console.log(`跳过字段: aiEnhanced.memoryTip 已存在，保持原值 (${word.word})`);
                }
                if (!word.mnemonic && value) {
                    console.log(`顶层映射: mnemonic <- aiEnhanced.memoryTip (${word.word})`);
                    word.mnemonic = String(value);
                }
                break;
            case 'association':
                if (!word.aiEnhanced.association && value) {
                    console.log(`合并字段: association -> aiEnhanced (${word.word})`, String(value));
                    word.aiEnhanced.association = String(value);
                } else if (value) {
                    console.log(`跳过字段: aiEnhanced.association 已存在，保持原值 (${word.word})`);
                }
                if (!word.association && value) {
                    console.log(`顶层映射: association <- aiEnhanced.association (${word.word})`);
                    word.association = String(value);
                }
                break;
            default:
                break;
        }
    }

    /**
     * 合并本地数据到单词对象
     * @param {Object} word - 单词对象
     * @param {Object} localData - 本地数据
     */
    mergeLocalData(word, localData) {
        // 基础信息
        if (localData.phonetic) {
            console.log(`本地合并: 设置 phonetic (${word.word})`, String(localData.phonetic));
            word.phonetic = localData.phonetic;
        }
        if (localData.partOfSpeech) {
            console.log(`本地合并: 设置 partOfSpeech (${word.word})`, String(localData.partOfSpeech));
            word.partOfSpeech = localData.partOfSpeech;
        }
        if (localData.definition) {
            console.log(`本地合并: 设置 aiEnhanced.definition (${word.word})`, String(localData.definition));
            word.aiEnhanced.definition = localData.definition;
            if (!word.definition) {
                console.log(`顶层映射: definition <- aiEnhanced.definition (${word.word})`);
                word.definition = localData.definition;
            }
        }
        if (localData.chineseMeaning) {
            console.log(`本地合并: 设置 aiEnhanced.chineseMeaning (${word.word})`, String(localData.chineseMeaning));
            word.aiEnhanced.chineseMeaning = localData.chineseMeaning;
            if (!word.chinese) {
                console.log(`顶层映射: chinese <- aiEnhanced.chineseMeaning (${word.word})`);
                word.chinese = localData.chineseMeaning;
            }
        }

        // 搭配信息
        if (localData.collocations) {
            const count = Array.isArray(localData.collocations) ? localData.collocations.length : 0;
            console.log(`本地合并: 设置 aiEnhanced.collocations (${word.word})，数量=${count}`);
            word.aiEnhanced.collocations = localData.collocations;
            if (!word.collocation && Array.isArray(localData.collocations)) {
                console.log(`顶层映射: collocation <- aiEnhanced.collocations（bullet 列表）(${word.word})`);
                word.collocation = localData.collocations.map(v => `• ${v}`).join('\n');
            }
        }

        // 词源信息
        if (localData.etymology) {
            const tip = localData.etymology.memoryTip || '';
            if (tip) {
                console.log(`本地合并: 设置 aiEnhanced.memoryTip (${word.word})`, String(tip));
                word.aiEnhanced.memoryTip = tip;
                if (!word.mnemonic) {
                    console.log(`顶层映射: mnemonic <- aiEnhanced.memoryTip (${word.word})`);
                    word.mnemonic = tip;
                }
            }
        }

        // 更新生成步骤状态
        word.aiStatus.generationSteps.phonetic = !!word.phonetic;
        word.aiStatus.generationSteps.definition = !!word.aiEnhanced.definition;
        word.aiStatus.generationSteps.collocations = !!word.aiEnhanced.collocations;
    }

    /**
     * 合并GPT数据到单词对象
     * @param {Object} word - 单词对象
     * @param {Object} gptData - GPT数据
     */
    mergeGPTData(word, gptData) {
        // 基础信息
        if (gptData.phonetic && !word.phonetic) {
            console.log(`GPT合并: 设置 phonetic (${word.word})`, String(gptData.phonetic));
            word.phonetic = gptData.phonetic;
        }
        if (gptData.partOfSpeech && !word.partOfSpeech) {
            console.log(`GPT合并: 设置 partOfSpeech (${word.word})`, String(gptData.partOfSpeech));
            word.partOfSpeech = gptData.partOfSpeech;
        }

        // AI增强信息
        if (gptData.definition && !word.aiEnhanced.definition) {
            console.log(`GPT合并: 设置 aiEnhanced.definition (${word.word})`, String(gptData.definition));
            word.aiEnhanced.definition = gptData.definition;
            if (!word.definition) {
                console.log(`顶层映射: definition <- aiEnhanced.definition (${word.word})`);
                word.definition = gptData.definition;
            }
        } else if (gptData.definition) {
            console.log(`跳过 GPT 字段: aiEnhanced.definition 已存在，保持原值 (${word.word})`);
        }
        if (gptData.chineseMeaning && !word.aiEnhanced.chineseMeaning) {
            console.log(`GPT合并: 设置 aiEnhanced.chineseMeaning (${word.word})`, String(gptData.chineseMeaning));
            word.aiEnhanced.chineseMeaning = gptData.chineseMeaning;
            if (!word.chinese) {
                console.log(`顶层映射: chinese <- aiEnhanced.chineseMeaning (${word.word})`);
                word.chinese = gptData.chineseMeaning;
            }
        } else if (gptData.chineseMeaning) {
            console.log(`跳过 GPT 字段: aiEnhanced.chineseMeaning 已存在，保持原值 (${word.word})`);
        }
        if (gptData.collocations && !word.aiEnhanced.collocations) {
            const count = Array.isArray(gptData.collocations) ? gptData.collocations.length : 0;
            console.log(`GPT合并: 设置 aiEnhanced.collocations (${word.word})，数量=${count}`);
            word.aiEnhanced.collocations = gptData.collocations;
            if (!word.collocation && Array.isArray(gptData.collocations)) {
                console.log(`顶层映射: collocation <- aiEnhanced.collocations（bullet 列表，含中文拆分）(${word.word})`);
                const bullets = gptData.collocations.map(item => {
                    if (typeof item === 'string') {
                        const s = item.trim();
                        const parts = s.includes('：') ? s.split('：')
                            : (s.includes(':') ? s.split(':')
                            : s.split('+'));
                        const en = (parts[0] || '').trim();
                        const zh = (parts[1] || '').trim();
                        return zh ? `• ${en}：${zh}` : `• ${s}`;
                    }
                    if (item && typeof item === 'object') {
                        const en = String(item.phrase || item.en || '').trim();
                        const zh = String(item.meaning || item.zh || '').trim();
                        return en ? `• ${en}${zh ? `：${zh}` : ''}` : '';
                    }
                    return '';
                }).filter(Boolean).join('\n');
                word.collocation = bullets;
            }
        } else if (gptData.collocations) {
            console.log(`跳过 GPT 字段: aiEnhanced.collocations 已存在，保持原值 (${word.word})`);
        }
        if (gptData.example && !word.aiEnhanced.example) {
            console.log(`GPT合并: 设置 aiEnhanced.example (${word.word})`, String(gptData.example));
            word.aiEnhanced.example = gptData.example;
            if (!Array.isArray(word.examples) || word.examples.length === 0) {
                const examplesArr = [];
                const toParse = Array.isArray(gptData.example) ? gptData.example : String(gptData.example || '').split(/\r?\n/);
                for (let i = 0; i < toParse.length && examplesArr.length < 3; i++) {
                    const raw = typeof toParse[i] === 'string' ? toParse[i] : '';
                    const s = raw.trim();
                    if (!s) continue;
                    const parts = s.includes('——') ? s.split('——')
                        : (s.includes('—') ? s.split('—')
                        : (s.includes(' - ') ? s.split(' - ')
                        : (s.includes(':') ? s.split(':')
                        : s.split('：'))));
                    const en = (parts[0] || '').trim();
                    const zh = (parts[1] || '').trim();
                    examplesArr.push({ en, zh });
                }
                if (examplesArr.length) {
                    console.log(`顶层映射: examples <- 解析自 gptData.example（${word.word}），数量=${examplesArr.length}`);
                    word.examples = examplesArr;
                } else {
                    console.log(`示例解析失败或为空，保留默认结构 (${word.word})`);
                    word.examples = [{ en: String(gptData.example || ''), zh: '' }];
                }
            }
        } else if (gptData.example) {
            console.log(`跳过 GPT 字段: aiEnhanced.example 已存在，保持原值 (${word.word})`);
        }
        if (gptData.memoryTip && !word.aiEnhanced.memoryTip) {
            console.log(`GPT合并: 设置 aiEnhanced.memoryTip (${word.word})`, String(gptData.memoryTip));
            word.aiEnhanced.memoryTip = gptData.memoryTip;
            if (!word.mnemonic) {
                console.log(`顶层映射: mnemonic <- aiEnhanced.memoryTip (${word.word})`);
                word.mnemonic = gptData.memoryTip;
            }
        } else if (gptData.memoryTip) {
            console.log(`跳过 GPT 字段: aiEnhanced.memoryTip 已存在，保持原值 (${word.word})`);
        }
        if (gptData.association && !word.aiEnhanced.association) {
            console.log(`GPT合并: 设置 aiEnhanced.association (${word.word})`, String(gptData.association));
            word.aiEnhanced.association = gptData.association;
            if (!word.association) {
                console.log(`顶层映射: association <- aiEnhanced.association (${word.word})`);
                word.association = gptData.association;
            }
        } else if (gptData.association) {
            console.log(`跳过 GPT 字段: aiEnhanced.association 已存在，保持原值 (${word.word})`);
        }

        // 更新生成步骤状态
        Object.keys(word.aiStatus.generationSteps).forEach(step => {
            if (gptData[step]) {
                word.aiStatus.generationSteps[step] = true;
            }
        });
    }

    /**
     * 检查数据是否完整
     * @param {Object} word - 单词对象
     * @returns {boolean} 数据是否完整
     */
    isDataComplete(word) {
        // 检查基础信息
        if (!word.phonetic || !word.partOfSpeech) return false;
        
        // 检查AI增强信息
        if (!word.aiEnhanced) return false;
        if (!word.aiEnhanced.definition || !word.aiEnhanced.chineseMeaning) return false;
        // UI 顶层映射补充（防御性检查）
        if (!word.definition) word.definition = word.aiEnhanced.definition;
        if (!word.chinese) word.chinese = word.aiEnhanced.chineseMeaning;
        if (!word.collocation && Array.isArray(word.aiEnhanced.collocations)) {
            word.collocation = word.aiEnhanced.collocations.map(v => `• ${v}`).join('\n');
        }
        
        return true;
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 设置进度回调函数
     * @param {Function} callback - 回调函数 (current, total) => void
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * 获取处理状态
     * @returns {boolean} 是否正在处理
     */
    isProcessingWords() {
        return this.isProcessing;
    }

    /**
     * 获取服务状态信息
     * @returns {Object} 服务状态
     */
    getServiceStatus() {
        // 为避免缓存带来的不一致，这里总是从DB获取最新配置
        const gptConfig = (typeof DB !== 'undefined' && DB.getGPTConfig) ? DB.getGPTConfig() : (this.gptConfig || null);
        return {
            isProcessing: this.isProcessing,
            hasLocalDictionary: !!this.localDictionary,
            localDictionarySize: this.localDictionary ? Object.keys(this.localDictionary).length : 0,
            gptConfigured: !!(gptConfig && gptConfig.apiKey && gptConfig.baseUrl && gptConfig.model),
            gptConfig: gptConfig ? {
                hasApiKey: !!gptConfig.apiKey,
                hasBaseUrl: !!gptConfig.baseUrl,
                hasModel: !!gptConfig.model,
                baseUrl: gptConfig.baseUrl,
                model: gptConfig.model
            } : null
        };
    }

    /**
     * 将英文句子翻译为简体中文（用于补齐示例的中文部分）
     * 参数:
     *   text (string): 英文句子
     * 返回:
     *   Promise<string>: 中文翻译文本（失败时返回空字符串）
     */
    async translateTextToChinese(text) {
        try {
            const t = String(text || '').trim();
            if (!t) return '';
            // 获取最新GPT配置
            this.gptConfig = await this.getGPTConfig();
            if (!this.gptConfig || !this.gptConfig.apiKey || !this.gptConfig.baseUrl || !this.gptConfig.model) {
                console.warn('缺少GPT配置，无法进行翻译');
                return '';
            }
            const base = this.normalizeBaseUrl(this.gptConfig.baseUrl);
            const apiUrl = base + '/chat/completions';
            // 简洁提示词：仅返回中文译文
            const prompt = `请把下列英文句子准确翻译为简体中文，仅返回中文译文，不要附加任何解释或引号：\n${t}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.gptConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.gptConfig.model || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.2,
                    max_tokens: 200
                })
            });
            if (!response.ok) {
                console.error('翻译请求失败:', response.status, response.statusText);
                return '';
            }
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            return String(content || '').trim();
        } catch (e) {
            console.warn('翻译失败:', e);
            return '';
        }
    }

    /**
     * 打印服务状态到控制台
     */
    logServiceStatus() {
        const status = this.getServiceStatus();
        console.log('=== 增强服务状态 ===');
        console.log('处理中:', status.isProcessing);
        console.log('本地词典:', status.hasLocalDictionary ? `已加载 (${status.localDictionarySize} 词条)` : '未加载');
        console.log('GPT配置:', status.gptConfigured ? '已配置' : '未配置');
        if (status.gptConfig) {
            console.log('  - API密钥:', status.gptConfig.hasApiKey ? '已设置' : '未设置');
            console.log('  - 基础URL:', status.gptConfig.hasBaseUrl ? status.gptConfig.baseUrl : '未设置');
            console.log('  - 模型:', status.gptConfig.hasModel ? status.gptConfig.model : '未设置');
        }
        console.log('==================');
        return status;
    }
}

// 创建全局实例
const wordEnhancementService = new WordEnhancementService();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordEnhancementService;
} else if (typeof window !== 'undefined') {
    window.WordEnhancementService = WordEnhancementService;
    window.wordEnhancementService = wordEnhancementService;
}
