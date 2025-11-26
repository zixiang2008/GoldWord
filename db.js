/**
 * GoldWord - 数据存储与配置模块
 * 负责：
 * - 词库数据的持久化（按用户隔离，localStorage）
 * - 学习标记与统计计算
 * - 用户注册/登录/切换与数据清理
 * - GPT 配置保存与读取
 */
// SA (StorageAdapter 回退机制) 由 index.html 提供

// 数据库操作相关功能
const DB = {
    // 存储Excel文件数据
    fileData: null,
    // 当前用户ID与用户表
    currentUserId: null,
    users: {},
    
    // 初始化数据库
    init: function() {
        // 加载用户表与当前用户
        try {
            const usersObj = SA.getJSON('gk_users') || {};
            this.users = usersObj && typeof usersObj === 'object' ? usersObj : {};
        } catch (_) { this.users = {}; }
        // 若用户表为空，种子默认游客账号，降低首次使用门槛
        try {
            if (!this.users || Object.keys(this.users).length === 0) {
                this.users = { guest: { id: 'guest', name: '游客', password: '0000' } };
                SA.setJSON('gk_users', this.users);
            }
        } catch (_) {}
        this.currentUserId = SA.getItem('gk_current_user') || null;
        // 根据当前用户加载词库
        const key = this.currentUserId ? `gk_fileData__${this.currentUserId}` : 'gk_fileData';
        const savedData = SA.getItem(key);
        if (savedData) {
            try {
                this.fileData = JSON.parse(savedData);
            } catch (e) {
                console.warn('Invalid JSON in fileData:', e && e.message ? e.message : e);
                this.fileData = null;
            }
            return !!this.fileData;
        }
        return false;
    },
    
    // 保存Excel文件数据
    saveFileData: function(data) {
        // 规范化中英结构（examples/collocations）后再保存
        this.fileData = Array.isArray(data) ? data.map(item => this._normalizeBilingualFields(item)) : data;
        if (typeof this.initGenerationStepsFromContent === 'function') {
            try { this.initGenerationStepsFromContent(); } catch(_) {}
        }
        const key = this.currentUserId ? `gk_fileData__${this.currentUserId}` : 'gk_fileData';
        SA.setJSON(key, this.fileData);
    },
    
    // 保存单个单词数据（用于AI增强后的更新）
    saveWordData: function(wordData) {
        if (!this.fileData) {
            this.fileData = [];
        }
        // 应用规范化，确保 examples/collocations 支持中英文结构
        const nextWord = this._normalizeBilingualFields(wordData);
        
        // 查找现有单词的索引
        const existingIndex = this.fileData.findIndex(w => w.word === nextWord.word);
        
        if (existingIndex >= 0) {
            // 更新现有单词，保留学习状态
            const existingWord = this.fileData[existingIndex];
            this.fileData[existingIndex] = {
                ...nextWord,
                // 保留重要的学习状态
                studied: existingWord.studied,
                studiedDate: existingWord.studiedDate,
                studiedTimestamp: existingWord.studiedTimestamp,
                needsReview: existingWord.needsReview,
                isNewWord: existingWord.isNewWord,
                learningState: existingWord.learningState || nextWord.learningState
            };
        } else {
            // 添加新单词
            this.fileData.push(nextWord);
        }
        
        // 保存到存储
        this.saveFileData(this.fileData);
    },
    
    // 获取所有单词
    getAllWords: function() {
        return this.fileData || [];
    },
    
    // 获取需要学习的单词
    getWordsToStudy: function() {
        if (!this.fileData) return [];
        return this.fileData.filter(word => !word.studied || word.needsReview);
    },
    
    // 标记单词为已学习
    markWordAsStudied: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        const now = new Date();
        this.fileData[index].studied = true;
        this.fileData[index].studiedDate = now.toISOString().split('T')[0];
        this.fileData[index].studiedTimestamp = now.toISOString();
        this.saveFileData(this.fileData);
    },
    
    // 标记单词为需要复习
    markWordForReview: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        this.fileData[index].needsReview = true;
        this.saveFileData(this.fileData);
    },

    // 取消标记需要复习
    unmarkWordForReview: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        this.fileData[index].needsReview = false;
        this.saveFileData(this.fileData);
    },

    // 标记单词为生词
    markWordAsNew: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        this.fileData[index].isNewWord = true;
        this.saveFileData(this.fileData);
    },

    // 取消标记单词为生词
    unmarkWordAsNew: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        this.fileData[index].isNewWord = false;
        this.saveFileData(this.fileData);
    },

    // 记录答题结果（正确/错误）
    recordAnswer: function(index, isCorrect) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        const word = this.fileData[index];
        const now = new Date();
        
        // 更新复习历史
        if (!word.reviewHistory) word.reviewHistory = [];
        word.reviewHistory.push({
            timestamp: now.toISOString(),
            correct: isCorrect,
            stage: word.learningStage || 0
        });
        
        // 更新上次复习时间
        word.lastReviewed = now.toISOString();
        
        if (isCorrect) {
            // 正确答案：增加连续正确次数，重置错误次数
            word.correctStreak = (word.correctStreak || 0) + 1;
            word.errors = 0;
            
            // 推进学习阶段
            this.advanceLearningStage(index);
        } else {
            // 错误答案：增加错误次数，重置连续正确次数
            word.errors = (word.errors || 0) + 1;
            word.correctStreak = 0;
            
            // 回退学习阶段
            this.regressLearningStage(index);
            
            // 错误≥2次自动加入困难词库
            if (word.errors >= 2) {
                word.bucket = 'difficult';
            }
        }
        
        // 更新熟练度等级
        this.updateProficiencyLevel(index);
        
        this.saveFileData(this.fileData);
    },

    // 推进学习阶段
    advanceLearningStage: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        const word = this.fileData[index];
        const currentStage = word.learningStage || 0;
        
        // 学习阶段时间间隔（毫秒）
        const intervals = [
            30 * 1000,      // 0: 30秒
            3 * 60 * 1000,  // 1: 3分钟
            10 * 60 * 1000, // 2: 10分钟
            60 * 60 * 1000, // 3: 1小时
            24 * 60 * 60 * 1000,      // 4: 1天
            3 * 24 * 60 * 60 * 1000,  // 5: 3天
            7 * 24 * 60 * 60 * 1000,  // 6: 7天
            15 * 24 * 60 * 60 * 1000, // 7: 15天
            30 * 24 * 60 * 60 * 1000  // 8: 30天
        ];
        
        // 推进到下一阶段（最大为8）
        const nextStage = Math.min(currentStage + 1, intervals.length - 1);
        word.learningStage = nextStage;
        
        // 设置下次复习时间
        const now = new Date();
        word.nextReview = new Date(now.getTime() + intervals[nextStage]).toISOString();
        
        // 连续正确≥3次且阶段≥4，从new/difficult转为normal
        if (word.correctStreak >= 3 && nextStage >= 4) {
            if (word.bucket === 'new' || word.bucket === 'difficult') {
                word.bucket = 'normal';
            }
        }
    },

    // 回退学习阶段
    regressLearningStage: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        const word = this.fileData[index];
        const currentStage = word.learningStage || 0;
        
        // 回退到上一阶段（最小为0）
        const prevStage = Math.max(currentStage - 1, 0);
        word.learningStage = prevStage;
        
        // 重新设置下次复习时间
        const intervals = [
            30 * 1000,      // 0: 30秒
            3 * 60 * 1000,  // 1: 3分钟
            10 * 60 * 1000, // 2: 10分钟
            60 * 60 * 1000, // 3: 1小时
            24 * 60 * 60 * 1000,      // 4: 1天
            3 * 24 * 60 * 60 * 1000,  // 5: 3天
            7 * 24 * 60 * 60 * 1000,  // 6: 7天
            15 * 24 * 60 * 60 * 1000, // 7: 15天
            30 * 24 * 60 * 60 * 1000  // 8: 30天
        ];
        
        const now = new Date();
        word.nextReview = new Date(now.getTime() + intervals[prevStage]).toISOString();
    },

    // 更新熟练度等级
    updateProficiencyLevel: function(index) {
        if (!this.fileData || index >= this.fileData.length) return;
        
        const word = this.fileData[index];
        const correctStreak = word.correctStreak || 0;
        const errors = word.errors || 0;
        const stage = word.learningStage || 0;
        
        // 基于连续正确次数、错误次数和学习阶段计算熟练度
        let level = 1;
        
        if (correctStreak >= 10 && stage >= 6) level = 5; // 专家级
        else if (correctStreak >= 7 && stage >= 5) level = 4; // 熟练级
        else if (correctStreak >= 5 && stage >= 4) level = 3; // 中级
        else if (correctStreak >= 3 && stage >= 2) level = 2; // 初级
        
        // 错误过多降级
        if (errors >= 3) level = Math.max(level - 1, 1);
        
        word.proficiencyLevel = level;
    },

    // 获取需要复习的单词（基于时间调度）
    getWordsForReview: function() {
        if (!this.fileData) return [];
        
        const now = new Date();
        return this.fileData.filter(word => {
            // 有下次复习时间且已到时间
            if (word.nextReview) {
                return new Date(word.nextReview) <= now;
            }
            // 兼容旧的needsReview标记
            return word.needsReview;
        });
    },

    // 生成每日学习计划
    generateDailyPlan: function(targetCount = 50) {
        if (!this.fileData) return [];
        
        const now = new Date();
        const plan = [];
        
        // 分类单词
        const newWords = this.fileData.filter(w => w.bucket === 'new' && !w.studied);
        const reviewWords = this.getWordsForReview();
        const familiarWords = this.fileData.filter(w => 
            w.bucket === 'normal' && 
            w.learningStage >= 4 && 
            w.learningStage <= 6 &&
            (!w.nextReview || new Date(w.nextReview) <= now)
        );
        const difficultWords = this.fileData.filter(w => w.bucket === 'difficult');
        
        // 按比例分配
        const newCount = Math.min(Math.floor(targetCount * 0.2), newWords.length);
        const reviewCount = Math.min(Math.floor(targetCount * 0.4), reviewWords.length);
        const familiarCount = Math.min(Math.floor(targetCount * 0.2), familiarWords.length);
        const difficultCount = Math.min(Math.floor(targetCount * 0.2), difficultWords.length);
        
        // 添加到计划中
        plan.push(...newWords.slice(0, newCount));
        plan.push(...reviewWords.slice(0, reviewCount));
        plan.push(...familiarWords.slice(0, familiarCount));
        plan.push(...difficultWords.slice(0, difficultCount));
        
        // 如果还没达到目标数量，从剩余单词中补充
        const remaining = targetCount - plan.length;
        if (remaining > 0) {
            const allRemaining = this.fileData.filter(w => !plan.includes(w) && !w.studied);
            plan.push(...allRemaining.slice(0, remaining));
        }
        
        // 打乱顺序
        return this.shuffleArray(plan);
    },

    // 数组打乱工具方法
    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
/**
     * 计算并返回学习统计数据
     * @returns {{totalWords:number, studiedToday:number, progress:number, repeatedWords:number, newWords:number}}
     * - totalWords：词库总数
     * - studiedToday：今日标记为已学习的词数
     * - progress：总体学习进度百分比（已学习/总数）
     * - repeatedWords：需要复习的词数
     * - newWords：生词数量
     */
    // 获取学习统计数据
    getStats: function() {
        if (!this.fileData) {
            return {
                totalWords: 0,
                studiedToday: 0,
                progress: 0,
                repeatedWords: 0,
                newWords: 0,
                studied30Days: 0,
                studied24Hours: 0,
                strictCoveragePercent: 0,
                strictCoverageCount: 0
            };
        }
        
        // 当文件数据为空数组时，避免除零并返回零统计
        if (this.fileData.length === 0) {
            return {
                totalWords: 0,
                studiedToday: 0,
                progress: 0,
                repeatedWords: 0,
                newWords: 0,
                studied30Days: 0,
                studied24Hours: 0,
                strictCoveragePercent: 0,
                strictCoverageCount: 0
            };
        }
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        
        const studiedToday = this.fileData.filter(word => word.studiedDate === today).length;
        const totalStudied = this.fileData.filter(word => word.studied).length;
        const repeatedWords = this.fileData.filter(word => word.needsReview).length;
        const newWords = this.fileData.filter(word => word.isNewWord).length;
        
        // 计算过去30天学习的单词数
        const studied30Days = this.fileData.filter(word => {
            if (!word.studiedDate) return false;
            return word.studiedDate >= thirtyDaysAgo;
        }).length;
        
        // 计算过去24小时学习的单词数（需要更精确的时间戳）
        const studied24Hours = this.fileData.filter(word => {
            if (!word.studiedTimestamp && !word.studiedDate) return false;
            // 如果有精确时间戳，使用时间戳；否则使用日期
            const studiedTime = word.studiedTimestamp || (word.studiedDate + 'T00:00:00.000Z');
            return studiedTime >= twentyFourHoursAgo;
        }).length;

        // 严格模式覆盖率（基于 generationSteps 追踪的关键字段）
        const strictCoverageCount = this.fileData.filter(w => {
            const steps = (w && w.aiStatus && w.aiStatus.generationSteps) ? w.aiStatus.generationSteps : {};
            const hasPhonetic = !!(steps.phonetic) || !!w.phonetic;
            const hasPOS = !!(steps.partOfSpeech) || !!w.partOfSpeech;
            const hasDefinition = !!(steps.definition) || !!(w.definition || (w.aiEnhanced && w.aiEnhanced.definition));
            const hasCollocations = !!(steps.collocations) || !!(w.aiEnhanced && w.aiEnhanced.collocations);
            const hasBrief = !!(steps.brief) || !!(w.brief || w.definition);
            return hasPhonetic && hasPOS && hasDefinition && hasCollocations && hasBrief;
        }).length;
        const strictCoveragePercent = Math.round((strictCoverageCount / this.fileData.length) * 100);
        
        return {
            totalWords: this.fileData.length,
            studiedToday: studiedToday,
            progress: Math.round((totalStudied / this.fileData.length) * 100),
            repeatedWords: repeatedWords,
            newWords: newWords,
            studied30Days: studied30Days,
            studied24Hours: studied24Hours,
            strictCoveragePercent: strictCoveragePercent,
            strictCoverageCount: strictCoverageCount
        };
    },
    
    /**
     * 处理 Excel 文件并持久化为标准词条数组
     * @param {File} file - 浏览器文件输入的 Excel/CSV/表格文件
     * @param {(words:Array<Object>)=>void} [callback] - 处理完成后的回调（传入规范化后的词条数组）
     * 行为：
     * - 读取首个工作表并转换为对象数组
     * - 补齐学习标记字段：studied、studiedDate、needsReview、isNewWord
     * - 调用 saveFileData 持久化并触发回调
     */
    // 处理Excel文件
    processExcelFile: function(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 处理数据，确保每个单词都有必要的属性
            const processedData = jsonData.map(item => {
                return {
                    ...item,
                    studied: !!item.studied,
                    studiedDate: item.studied ? (item.studiedDate || null) : null,
                    needsReview: !!item.needsReview,
                    isNewWord: !!item.isNewWord,
                    // 记忆循环相关字段
                    errors: item.errors || 0,                    // 错误次数
                    correctStreak: item.correctStreak || 0,      // 连续正确次数
                    bucket: item.bucket || 'new',               // 分类：new/normal/difficult
                    nextReview: item.nextReview || null,        // 下次复习时间戳
                    lastReviewed: item.lastReviewed || null,    // 上次复习时间戳
                    reviewHistory: item.reviewHistory || [],    // 复习历史记录
                    learningStage: item.learningStage || 0,     // 学习阶段 0-8 (30s,3min,10min,1h,1d,3d,7d,15d,30d)
                    proficiencyLevel: item.proficiencyLevel || 1 // 熟练度等级 1-5
                };
            });
            
            this.saveFileData(processedData);
            
            if (callback && typeof callback === 'function') {
                callback(processedData);
            }
        };
        
        reader.readAsArrayBuffer(file);
    },
    /**
     * 设置当前用户并加载其词库数据
     * @param {string|null} userId - 用户唯一标识；传 null 切换为全局默认数据空间
     * 影响：
     * - 更新 localStorage 中的当前用户标记
     * - 切换词库存储键（gk_fileData__<userId> 或 gk_fileData）并加载数据
     */
    // 设置当前用户并加载其词库
    setCurrentUser: function(userId) {
        this.currentUserId = userId || null;
        if (userId) SA.setItem('gk_current_user', userId);
        else SA.removeItem('gk_current_user');
        const key = this.currentUserId ? `gk_fileData__${this.currentUserId}` : 'gk_fileData';
        const savedData = SA.getItem(key);
        if (savedData) {
            try {
                this.fileData = JSON.parse(savedData);
            } catch (e) {
                console.warn('Invalid JSON in fileData for user:', e && e.message ? e.message : e);
                this.fileData = null;
            }
        } else {
            this.fileData = null;
        }
        if (typeof this.initGenerationStepsFromContent === 'function') {
            try { this.initGenerationStepsFromContent(); } catch(_) {}
        }
    },
    initGenerationStepsFromContent: function() {
        if (!this.fileData || !Array.isArray(this.fileData)) return;
        for (let i = 0; i < this.fileData.length; i++) {
            const w = this.fileData[i] || {};
            if (!w.aiStatus || typeof w.aiStatus !== 'object') w.aiStatus = {};
            if (!w.aiStatus.generationSteps || typeof w.aiStatus.generationSteps !== 'object') w.aiStatus.generationSteps = {};
            const steps = w.aiStatus.generationSteps;
            const hasPhonetic = !!w.phonetic;
            const hasPOS = !!w.partOfSpeech;
            const hasDefinition = !!(w.definition || (w.aiEnhanced && w.aiEnhanced.definition));
            const hasCollocations = !!(w.aiEnhanced && w.aiEnhanced.collocations);
            const hasBrief = !!(w.brief || w.definition);
            if (steps.phonetic !== true) steps.phonetic = hasPhonetic;
            if (steps.partOfSpeech !== true) steps.partOfSpeech = hasPOS;
            if (steps.definition !== true) steps.definition = hasDefinition;
            if (steps.collocations !== true) steps.collocations = hasCollocations;
            if (steps.brief !== true) steps.brief = hasBrief;
        }
        const key = this.currentUserId ? `gk_fileData__${this.currentUserId}` : 'gk_fileData';
        SA.setJSON(key, this.fileData);
    },
    getCurrentUserId: function() { return this.currentUserId; },
    registerUser: function(id, name, password) {
        if (!id) throw new Error('用户ID不能为空');
        const users = this.users || {};
        if (users[id]) throw new Error('用户ID已存在');
        users[id] = { id, name: name || id, password: password || '' };
        this.users = users;
        SA.setJSON('gk_users', users);
        this.setCurrentUser(id);
    },
    verifyLogin: function(id, password) {
        // 黑名单用户禁止登录（管理员不可被拉黑）
        try {
            if (this.isBlacklisted && id && this.isBlacklisted(id)) {
                return false;
            }
        } catch(_){ }
        // 管理员特殊账号：不依赖用户表，直接校验固定密码
        if (id === 'caishen') {
            return (password || '') === 'ilovecaishen';
        }
        const user = (this.users || {})[id];
        return !!user && (user.password === (password || ''));
    },
    logoutUser: function() {
        this.setCurrentUser(null);
    },
    clearCurrentUserData: function() {
        const key = this.currentUserId ? `gk_fileData__${this.currentUserId}` : 'gk_fileData';
        SA.removeItem(key);
        this.fileData = null;
    },

    /**
     * 判断是否为管理员（最高权限）
     * @param {string=} uid 可选，默认使用当前用户
     * @returns {boolean}
     */
    isAdmin: function(uid) {
        const id = typeof uid === 'string' ? uid : (this.currentUserId || '');
        return id === 'caishen';
    },
    /**
     * 列出所有用户（包含 id、name，不含密码）
     * @returns {Array<{id:string,name:string}>}
     */
    listUsers: function() {
        const users = this.users || {};
        const arr = Object.keys(users).map(k => ({ id: k, name: users[k].name || k }));
        // 管理员账号不在用户表中也可登录，这里附加展示（不暴露密码）
        if (!arr.find(u => u.id === 'caishen')) arr.unshift({ id: 'caishen', name: '管理员' });
        return arr;
    },
    /**
     * 管理员新增用户或更新显示名
     * @param {string} id 用户ID
     * @param {string} name 显示名
     * @param {string} password 初始密码（普通用户为4位PIN）
     */
    upsertUserByAdmin: function(id, name, password) {
        if (!this.isAdmin()) throw new Error('需要管理员权限');
        if (!id) throw new Error('用户ID不能为空');
        const users = this.users || {};
        users[id] = { id, name: name || id, password: password || (users[id]?.password || '') };
        this.users = users;
        SA.setJSON('gk_users', users);
    },
    /**
     * 管理员修改用户密码
     * @param {string} id 用户ID
     * @param {string} newPassword 新密码
     */
    updateUserPasswordByAdmin: function(id, newPassword) {
        if (!this.isAdmin()) throw new Error('需要管理员权限');
        const users = this.users || {};
        if (!users[id]) throw new Error('用户不存在');
        users[id].password = newPassword || '';
        this.users = users;
        SA.setJSON('gk_users', users);
    },
    /**
     * 管理员删除用户（不可删除管理员）
     * @param {string} id 用户ID
     */
    deleteUserByAdmin: function(id) {
        if (!this.isAdmin()) throw new Error('需要管理员权限');
        if (id === 'caishen') throw new Error('不可删除管理员账号');
        const users = this.users || {};
        if (!users[id]) throw new Error('用户不存在');
        delete users[id];
        this.users = users;
        SA.setJSON('gk_users', users);
        // 同时清理该用户的词库与配置
        try { SA.removeItem(`gk_fileData__${id}`); } catch(_){}
        try { SA.removeItem(`gpt_config__${id}`); } catch(_){}
        // 如果当前登录用户被删除，则切换为未登录
        if (this.currentUserId === id) this.setCurrentUser(null);
    },

    // 黑名单管理（仅管理员，针对账号“caishen”）
    listBlacklist: function() {
        try {
            const arr = SA.getJSON('gk_blacklist');
            return Array.isArray(arr) ? arr : [];
        } catch(_) { return []; }
    },
    isBlacklisted: function(id) {
        if (!id) return false;
        const list = this.listBlacklist();
        return list.includes(id);
    },
    addToBlacklist: function(id) {
        if (!this.isAdmin()) throw new Error('需要管理员权限');
        if (!id || id === 'caishen') throw new Error('不可拉黑该账号');
        const list = this.listBlacklist();
        if (!list.includes(id)) list.push(id);
        SA.setJSON('gk_blacklist', list);
    },
    removeFromBlacklist: function(id) {
        if (!this.isAdmin()) throw new Error('需要管理员权限');
        const list = this.listBlacklist();
        const next = list.filter(u => u !== id);
        SA.setJSON('gk_blacklist', next);
    },
    
    // GPT 服务配置（按用户隔离）
    /**
     * 读取当前用户的 GPT 配置
     * @returns {{baseUrl:string, apiKey:string, model:string, systemPrompt?:string, temperature?:number}}
     * 键空间：`gpt_config__<userId>`（无用户时使用 `default`）
     */
    getGPTConfig: function() {
        const uid = this.currentUserId || 'default';
        const key = `gpt_config__${uid}`;
        let cfg = {};
        try {
            cfg = SA.getJSON(key) || {};
        } catch (_) {
            cfg = {};
        }
        const hasBase = !!(cfg.baseUrl && String(cfg.baseUrl).trim());
        const hasModel = !!(cfg.model && String(cfg.model).trim());
        if (!hasBase || !hasModel) {
            const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
            const isAndroid = /Android/i.test(ua);
            const defBase = isAndroid ? 'http://10.0.2.2:8001' : 'http://127.0.0.1:8001';
            cfg.baseUrl = hasBase ? String(cfg.baseUrl).trim() : defBase;
            cfg.model = hasModel ? String(cfg.model).trim() : 'mock-4o-mini';
            cfg.apiKey = cfg.apiKey != null ? String(cfg.apiKey) : '';
            SA.setJSON(key, cfg);
        }
        return {
            baseUrl: String(cfg.baseUrl || ''),
            apiKey: String(cfg.apiKey || ''),
            model: String(cfg.model || '')
        };
    },
    /**
     * 保存 GPT 设置到本地存储（按当前用户隔离）
     * @param {{endpoint?:string, baseUrl?:string, apiKey?:string, model?:string, systemPrompt?:string, temperature?:number, useCustomFieldPrompts?:boolean, gptOnlyMode?:boolean}} settings
     * 可选项将与已有设置合并（浅合并），未传入的字段保持不变。
     */
    // 保存GPT设置
    saveGPTConfig: function(settings) {
        const uid = this.currentUserId || 'default';
        const key = `gpt_config__${uid}`;
        
        // 读取已有配置
        let existing = {};
        try {
            existing = SA.getJSON(key) || {};
        } catch (_) {
            existing = {};
        }
        
        // 浅合并：仅更新传入的字段，未传入的保持不变
        const merged = { ...existing };
        
        if (settings && ('endpoint' in settings || 'baseUrl' in settings)) {
            const base = (settings.baseUrl ?? settings.endpoint ?? '').toString().trim();
            merged.baseUrl = base;
        }
        if (settings && ('apiKey' in settings)) {
            merged.apiKey = (settings.apiKey || '').toString().trim();
        }
        if (settings && ('model' in settings)) {
            merged.model = (settings.model || '').toString().trim();
        }
        if (settings && ('systemPrompt' in settings)) {
            merged.systemPrompt = settings.systemPrompt != null ? String(settings.systemPrompt) : '';
        }
        if (settings && ('temperature' in settings)) {
            const t = Number(settings.temperature);
            merged.temperature = isNaN(t) ? undefined : Math.min(2, Math.max(0, t));
        }
        if (settings && ('useCustomFieldPrompts' in settings)) {
            merged.useCustomFieldPrompts = !!settings.useCustomFieldPrompts;
        }
        if (settings && ('gptOnlyMode' in settings)) {
            merged.gptOnlyMode = !!settings.gptOnlyMode;
        }
        
        SA.setJSON(key, merged);
        return merged;
    },

    // 卡片显示项配置（按用户隔离）：{ field: { prompt: string, meaning: string } }
    getCardFieldConfig: function() {
        const uid = this.currentUserId || 'default';
        const key = `card_field_config__${uid}`;
        try {
            const cfg = SA.getJSON(key);
            return cfg ? cfg : {};
        } catch(_) { return {}; }
    },
    saveCardFieldConfig: function(map) {
        const uid = this.currentUserId || 'default';
        const key = `card_field_config__${uid}`;
        const safe = {};
        const fields = ['word','chinese','phonetic','pos','memory','association','definition','brief','collocation','example'];
        fields.forEach(f => {
            const item = map && map[f] ? map[f] : {};
            safe[f] = { prompt: (item.prompt||'').toString(), meaning: (item.meaning||'').toString() };
        });
        SA.setJSON(key, safe);
        return safe;
    },

    // 私有：规范化中英结构，确保 examples 与 collocations 为对象数组
    _normalizeBilingualFields: function(word) {
        if (!word || typeof word !== 'object') return word;
        const out = { ...word };

        // 处理 examples：支持字符串、字符串数组、对象数组
        // 目标结构：out.examples = [{ en, zh }]
        const parseExampleLine = (line) => {
            const s = String(line || '').trim();
            if (!s) return null;
            const parts = s.includes('——') ? s.split('——')
                : (s.includes('—') ? s.split('—')
                : (s.includes(' - ') ? s.split(' - ')
                : (s.includes(':') ? s.split(':')
                : s.split('：'))));
            const en = (parts[0] || '').trim();
            const zh = (parts[1] || '').trim();
            if (!en && !zh) return null;
            return { en, zh };
        };
        if (Array.isArray(out.examples)) {
            out.examples = out.examples.map(item => {
                if (typeof item === 'string') {
                    const parsed = parseExampleLine(item);
                    return parsed ? parsed : { en: item, zh: '' };
                }
                const en = String(item.en || item.english || '').trim();
                const zh = String(item.zh || item.chinese || item.cn || '').trim();
                return { en, zh };
            });
        } else if (typeof out.examples === 'string') {
            const lines = String(out.examples || '').split(/\r?\n|；|;|，/);
            out.examples = lines.map(parseExampleLine).filter(Boolean);
        } else if (typeof out.example === 'string' || Array.isArray(out.example)) {
            const raw = Array.isArray(out.example) ? out.example : String(out.example || '').split(/\r?\n|；|;|，/);
            out.examples = raw.map(parseExampleLine).filter(Boolean);
        }

        // 处理 collocations：支持字符串、字符串数组、对象数组
        // 目标结构：out.collocations = [{ en, zh }]，保留原始 out.collocation 以兼容旧逻辑
        const parseCollLine = (line) => {
            const s = String(line || '').trim();
            if (!s) return null;
            const parts = s.includes('：') ? s.split('：')
                : (s.includes(':') ? s.split(':')
                : s.split('+'));
            const en = (parts[0] || '').trim();
            const zh = (parts[1] || '').trim();
            if (!en && !zh) return null;
            return { en, zh };
        };
        if (Array.isArray(out.collocations)) {
            out.collocations = out.collocations.map(item => {
                if (typeof item === 'string') {
                    const parsed = parseCollLine(item);
                    return parsed ? parsed : { en: item, zh: '' };
                }
                const en = String(item.phrase || item.en || '').trim();
                const zh = String(item.meaning || item.zh || '').trim();
                return { en, zh };
            });
        } else if (Array.isArray(out.aiEnhanced && out.aiEnhanced.collocations)) {
            // 复制自 aiEnhanced 到标准字段，便于统一渲染与存储
            out.collocations = (out.aiEnhanced.collocations || []).map(item => {
                if (typeof item === 'string') {
                    const parsed = parseCollLine(item);
                    return parsed ? parsed : { en: item, zh: '' };
                }
                const en = String(item.phrase || item.en || '').trim();
                const zh = String(item.meaning || item.zh || '').trim();
                return { en, zh };
            });
        } else if (Array.isArray(out.collocation)) {
            out.collocations = out.collocation.map(parseCollLine).filter(Boolean);
        } else if (typeof out.collocation === 'string') {
            const lines = String(out.collocation || '').split(/\r?\n|；|;|，/);
            out.collocations = lines.map(parseCollLine).filter(Boolean);
        }

        return out;
    }
};

// 导出数据库对象
window.DB = DB;
