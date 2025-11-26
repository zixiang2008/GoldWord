/**
 * GoldWord - AI 驱动单词记忆卡数据结构定义
 * 
 * 核心理念：正面主动回忆 + 背面 AI 八维记忆 + 间隔重复
 * 数据库存储原则：用户输入单词 → 自动后台补全 → 存储完整信息
 */

/**
 * 完整单词数据结构
 * @typedef {Object} WordData
 */
const WordSchema = {
    // === 基础信息 ===
    word: "",                    // 单词本体（用户输入）
    id: "",                      // 唯一标识符
    createdAt: 0,               // 创建时间戳
    updatedAt: 0,               // 更新时间戳
    
    // === 正面显示信息（挑战模式）===
    phonetic: "",               // 国际音标 (IPA) - AI 生成
    partOfSpeech: "",           // 词性缩写 (n./v./adj.) - AI 生成
    
    // === 背面 AI 八维记忆信息 ===
    aiEnhanced: {
        // 1. 主要用法/定义
        definition: "",          // 一句话核心含义，简洁适合初学者
        
        // 2. 固定搭配
        collocations: [          // 2-3个高频短语
            {
                phrase: "",      // 英文短语
                meaning: ""      // 中文含义
            }
        ],
        
        // 3. 例句
        example: {
            sentence: "",        // ≤12词的例句，用TOEFL核心词范围
            translation: ""      // 中文翻译
        },
        
        // 4. 中文解释
        chineseMeaning: "",      // ≤4字极简解释
        
        // 5. 记忆要点
        memoryTip: "",           // 词根/词源法，≤20字
        
        // 6. 联想记忆
        association: "",         // 形象记忆 + emoji，≤10字
        
        // 7. 同义词对比（可选）
        synonyms: [
            {
                word: "",
                difference: ""   // 用法区别
            }
        ],
        
        // 8. 反义词（可选）
        antonyms: [""]
    },
    
    // === 学习状态信息 ===
    learningState: {
        // 艾宾浩斯间隔重复
        stage: 0,               // 学习阶段 (0-6)
        nextReviewDate: 0,      // 下次复习时间戳
        reviewCount: 0,         // 复习次数
        
        // 用户自评记忆程度
        lastMemoryLevel: 0,     // 0:忘记, 1:模糊, 2:记得
        memoryHistory: [],      // 记忆程度历史记录
        
        // 学习统计
        correctCount: 0,        // 正确次数
        totalAttempts: 0,       // 总尝试次数
        averageResponseTime: 0, // 平均反应时间(ms)
        
        // 状态标记
        isNew: true,           // 是否新单词
        needsReview: false,    // 是否需要复习
        isStudiedToday: false, // 今日是否已学习
        isMastered: false      // 是否已掌握
    },
    
    // === AI 生成状态 ===
    aiStatus: {
        isComplete: false,      // AI信息是否完整
        lastEnhanced: 0,       // 最后AI增强时间
        enhancementSource: "", // 增强来源 (local/gpt-4/claude等)
        enhancementVersion: 1, // 增强版本号
        
        // 生成状态追踪
        generationSteps: {
            phonetic: false,
            definition: false,
            collocations: false,
            example: false,
            memoryTip: false,
            association: false
        }
    },
    
    // === 用户自定义信息 ===
    userCustom: {
        personalNote: "",       // 个人笔记
        difficulty: 0,          // 个人难度评级 (1-5)
        tags: [],              // 自定义标签
        category: "",          // 分类 (如: TOEFL, GRE, 日常等)
        priority: 0            // 学习优先级
    }
};

/**
 * 艾宾浩斯间隔重复时间表 (毫秒)
 */
const SpacedRepetitionIntervals = {
    // 基于用户自评记忆程度的间隔调整
    FORGOT: [
        1000 * 60 * 5,        // 5分钟后
        1000 * 60 * 30,       // 30分钟后
        1000 * 60 * 60 * 2,   // 2小时后
        1000 * 60 * 60 * 8,   // 8小时后
        1000 * 60 * 60 * 24,  // 1天后
        1000 * 60 * 60 * 24 * 3, // 3天后
        1000 * 60 * 60 * 24 * 7  // 7天后
    ],
    
    VAGUE: [
        1000 * 60 * 60 * 4,   // 4小时后
        1000 * 60 * 60 * 12,  // 12小时后
        1000 * 60 * 60 * 24 * 2, // 2天后
        1000 * 60 * 60 * 24 * 5, // 5天后
        1000 * 60 * 60 * 24 * 14 // 14天后
    ],
    
    REMEMBERED: [
        1000 * 60 * 60 * 24,     // 1天后
        1000 * 60 * 60 * 24 * 3, // 3天后
        1000 * 60 * 60 * 24 * 7, // 7天后
        1000 * 60 * 60 * 24 * 15, // 15天后
        1000 * 60 * 60 * 24 * 30  // 30天后 (已掌握)
    ]
};

/**
 * GPT 查询 Prompt 模板
 */
const GPTPromptTemplates = {
    // 生成完整单词信息
    COMPLETE_WORD_INFO: `你是一个语言学习AI助手。用户当前词汇量为 TOEFL 核心词 水平。
请为单词 {word} 生成以下记忆卡内容（严格按JSON格式返回）：

要求：
1. 国际音标使用标准IPA格式
2. 词性使用标准缩写（n./v./adj./adv./prep./conj./interj.等）
3. 定义要简洁易懂，适合记忆
4. 固定搭配选择最常用的2-3个
5. 例句控制在12个词以内，使用简单词汇
6. 中文解释限制在4个字以内
7. 记忆要点可以包含词根、词源、联想等，20字内
8. 联想要生动形象，可以包含emoji，10字内

请严格按以下JSON格式返回：
{
  "phonetic": "国际音标（IPA）",
  "partOfSpeech": "词性缩写",
  "definition": "主要用法/定义",
  "collocations": ["搭配1", "搭配2", "搭配3"],
  "example": "例句（≤12词）",
  "chineseMeaning": "中文释义（≤4字）",
  "memoryTip": "记忆要点（≤20字）",
  "association": "联想记忆（≤10字）"
}`,

    // 逐项生成：一句话定义（≤15字，中文）
    DEFINITION_BRIEF_CN15: `用一句话简洁解释 {word} 的核心含义，适合记忆，控制在 15 字内。\n只输出中文，≤15字，不加引号或额外说明。\n\n请严格按以下JSON格式返回：\n{\n  "definition": "一句话定义（≤15字，中文）"\n}`,

    // 逐项生成：固定搭配（Top2，英文短语，项目符号）
  COLLOCATIONS_TOP2_BULLETS: `列出 {word} 的 3 个高频固定搭配。\n输出要求：每项以“英文：中文解释”的形式输出，每项单独占一行，不返回额外说明。\n\n示例格式（仅示意，按行输出）：\n英文短语1：中文解释1\n英文短语2：中文解释2\n英文短语3：中文解释3`,

    // 逐项生成：例句（≤12词，TOEFL 核心词内）
  EXAMPLE_TOEFL_12: `使用最基础的 2500 单词与 {word} 造句，并翻译成中文。\n输出 3 个不同句式的表达版本，每个版本占一行；每行包含英文句子与中文翻译。\n\n示例格式（仅示意，按行输出）：\n英文句子版本1 —— 中文翻译1\n英文句子版本2 —— 中文翻译2\n英文句子版本3 —— 中文翻译3`,

    // 逐项生成：中文解释（≤4字）
    CHINESE_4: `用 ≤4 字中文简洁解释 {word}。\n仅输出 1 个常用词，不加引号或标点。\n\n请严格按以下JSON格式返回：\n{\n  "chineseMeaning": "中文释义（≤4字）"\n}`,

    // 逐项生成：国际音标（IPA）
    IPA: `给出 {word} 的国际音标（IPA）。\n仅输出 IPA，使用斜杠包裹，如 /.../。\n\n请严格按以下JSON格式返回：\n{\n  "phonetic": "/.../"\n}`,

    // 逐项生成：词性缩写（如 n.、adj.）
    POS_ABBR: `给出 {word} 的主要词性缩写。\n仅输出缩写，如 n.、adj.、v. 等。\n\n请严格按以下JSON格式返回：\n{\n  "partOfSpeech": "n."\n}`,

    // 逐项生成：记忆要点（词根/词源法，≤20字）
    MEMORY_TIP_20: `为 {word} 设计 1 个词根/词源记忆法，≤20 字。\n仅输出中文短句，不加引号。\n\n请严格按以下JSON格式返回：\n{\n  "memoryTip": "记忆要点（≤20字）"\n}`,

    // 逐项生成：联想（形象 + emoji，≤10字）
    ASSOCIATION_10: `为 {word} 设计 1 个形象联想，可加 emoji，≤10 字。\n仅输出短语，不加引号。\n\n请严格按以下JSON格式返回：\n{\n  "association": "联想短语（≤10字）"\n}`,

    // 生成同义词
    SYNONYMS: `列出单词 {word} 的2个最常用近义词，并用简单例句区分它们的用法差异。

请严格按以下JSON格式返回：
{
  "synonyms": [
    {
      "word": "同义词1",
      "example": "例句1（突出与原词的细微差别）",
      "difference": "与原词的区别（≤15字）"
    },
    {
      "word": "同义词2", 
      "example": "例句2（突出与原词的细微差别）",
      "difference": "与原词的区别（≤15字）"
    }
  ]
}`,

    // 生成反义词
    ANTONYMS: `给出单词 {word} 的主要反义词并造句说明。

请严格按以下JSON格式返回：
{
  "antonyms": [
    {
      "word": "反义词1",
      "example": "对比例句（同时包含原词和反义词）"
    }
  ]
}`,

    // 生成对话练习
    DIALOGUE_PRACTICE: `用单词 {word} 创建一个日常对话练习，用户需要填空。

请严格按以下JSON格式返回：
{
  "dialogue": [
    {
      "speaker": "A",
      "text": "对话内容（包含{word}或其变形）"
    },
    {
      "speaker": "B", 
      "text": "对话内容（用___代替{word}让用户填空）"
    }
  ],
  "answer": "正确答案",
  "context": "对话场景说明"
}`,

    // 生成图片描述
    IMAGE_DESCRIPTION: `描述一个能代表单词 {word} 的具体场景，适合做记忆卡片背景。

要求：
1. 描述要具体生动，便于想象
2. 场景要能直观体现单词含义
3. 适合作为学习卡片的视觉辅助

请严格按以下JSON格式返回：
{
  "scene": "场景描述（≤50字）",
  "visualElements": ["视觉元素1", "视觉元素2", "视觉元素3"],
  "mood": "整体氛围（≤10字）"
}`
};

/**
 * 本地词典数据结构（用于离线查询）
 */
const LocalDictionarySchema = {
    // 基础词典数据
    basicWords: {
        // word: { phonetic, partOfSpeech, definition, chineseMeaning }
    },
    
    // 高频搭配数据
    collocations: {
        // word: [{ phrase, meaning }]
    },
    
    // 词根词缀数据
    etymology: {
        // word: { root, prefix, suffix, memoryTip }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WordSchema,
        SpacedRepetitionIntervals,
        GPTPromptTemplates,
        LocalDictionarySchema
    };
} else if (typeof window !== 'undefined') {
    window.WordSchema = WordSchema;
    window.SpacedRepetitionIntervals = SpacedRepetitionIntervals;
    window.GPTPromptTemplates = GPTPromptTemplates;
    window.LocalDictionarySchema = LocalDictionarySchema;
}
