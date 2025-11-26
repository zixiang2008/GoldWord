/**
 * 八维记忆卡片UI组件
 * 实现正面挑战 + 背面八维记忆的设计
 */

const EightDimensionalMemory = {
    
    // 创建八维记忆背面内容
    createMemoryCard: function(data) {
        const { word, phonetics, pos, definition, chinese, collocations, examples, memoryTip, association } = data;
        
        // 八维记忆信息块
        const memoryBlocks = [
            {
                id: 'definition',
                title: '主要用法/定义',
                content: definition || '暂无定义',
                icon: '📖'
            },
            {
                id: 'collocations', 
                title: '固定搭配',
                content: collocations || '暂无搭配',
                icon: '🔗'
            },
            {
                id: 'examples',
                title: '例句',
                content: this.formatExamples(examples),
                icon: '💬'
            },
            {
                id: 'chinese',
                title: '中文解释',
                content: chinese || '暂无中文释义',
                icon: '🇨🇳'
            },
            {
                id: 'memory-tip',
                title: '记忆要点',
                content: memoryTip || '暂无记忆提示',
                icon: '💡'
            },
            {
                id: 'association',
                title: '联想记忆',
                content: association || '暂无联想',
                icon: '🧠'
            },
            {
                id: 'synonyms',
                title: '同义词',
                content: '点击查看同义词',
                icon: '↔️',
                action: 'loadSynonyms'
            },
            {
                id: 'antonyms',
                title: '反义词', 
                content: '点击查看反义词',
                icon: '↕️',
                action: 'loadAntonyms'
            }
        ];

        // 生成HTML
        let html = `
            <div class="eight-dimensional-memory">
                <div class="memory-header">
                    <h3>${this.escapeHtml(word)}</h3>
                    <div class="basic-info">
                        <span class="phonetics">${this.escapeHtml(phonetics || '')}</span>
                        <span class="pos">${this.escapeHtml(pos || '')}</span>
                    </div>
                </div>
                <div class="memory-blocks">
        `;

        memoryBlocks.forEach((block, index) => {
            const isRevealed = index < 2; // 默认显示前两个
            html += `
                <div class="memory-block ${isRevealed ? 'revealed' : 'hidden'}" data-block-id="${block.id}">
                    <div class="block-header" onclick="EightDimensionalMemory.toggleBlock('${block.id}')">
                        <span class="icon">${block.icon}</span>
                        <span class="title">${block.title}</span>
                        <span class="toggle-icon">${isRevealed ? '▼' : '▶'}</span>
                    </div>
                    <div class="block-content" ${isRevealed ? '' : 'style="display: none;"'}>
                        ${block.action ? 
                            `<button class="load-btn" onclick="EightDimensionalMemory.${block.action}('${word}')">${block.content}</button>` :
                            `<div class="content-text">${this.escapeHtml(block.content)}</div>`
                        }
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="memory-actions">
                    <button class="memory-level-btn easy" onclick="EightDimensionalMemory.markMemoryLevel('${word}', 'easy')">
                        😊 记得清楚
                    </button>
                    <button class="memory-level-btn medium" onclick="EightDimensionalMemory.markMemoryLevel('${word}', 'medium')">
                        🤔 有点模糊
                    </button>
                    <button class="memory-level-btn hard" onclick="EightDimensionalMemory.markMemoryLevel('${word}', 'hard')">
                        😞 完全忘记
                    </button>
                </div>
            </div>
        `;

        return html;
    },

    // 格式化例句
    formatExamples: function(examples) {
        if (!examples || !examples.length) return '暂无例句';
        
        return examples.slice(0, 2).map(ex => 
            `<div class="example-item">
                <div class="en">${this.escapeHtml(ex.en || ex)}</div>
                ${ex.zh ? `<div class="zh">${this.escapeHtml(ex.zh)}</div>` : ''}
            </div>`
        ).join('');
    },

    // 切换记忆块显示/隐藏
    toggleBlock: function(blockId) {
        const block = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!block) return;

        const content = block.querySelector('.block-content');
        const toggleIcon = block.querySelector('.toggle-icon');
        const isHidden = block.classList.contains('hidden');

        if (isHidden) {
            block.classList.remove('hidden');
            block.classList.add('revealed');
            content.style.display = 'block';
            toggleIcon.textContent = '▼';
            
            // 添加展开动画
            content.style.opacity = '0';
            content.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                content.style.transition = 'all 0.3s ease';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 10);
        } else {
            block.classList.remove('revealed');
            block.classList.add('hidden');
            content.style.display = 'none';
            toggleIcon.textContent = '▶';
        }
    },

    // 标记记忆程度
    markMemoryLevel: function(word, level) {
        // 根据记忆程度设置不同的复习间隔
        const intervals = {
            easy: 24 * 60 * 60 * 1000,    // 1天后
            medium: 4 * 60 * 60 * 1000,   // 4小时后  
            hard: 0                        // 立即重新学习
        };

        const nextReviewTime = Date.now() + intervals[level];
        
        // 更新数据库中的学习状态
        const allWords = DB.getAllWords();
        const wordIndex = allWords.findIndex(w => w.word === word);
        
        if (wordIndex !== -1) {
            allWords[wordIndex].learningState = {
                ...allWords[wordIndex].learningState,
                memoryLevel: level,
                nextReviewTime: nextReviewTime,
                lastReviewTime: Date.now(),
                reviewCount: (allWords[wordIndex].learningState?.reviewCount || 0) + 1
            };
            
            DB.saveWordData(allWords[wordIndex]);
        }

        // 显示反馈
        this.showMemoryFeedback(level);
        
        // 延迟后自动切换到下一个单词
        setTimeout(() => {
            if (window.App && App.nextWord) {
                App.nextWord();
            }
        }, 1500);
    },

    // 显示记忆反馈
    showMemoryFeedback: function(level) {
        const messages = {
            easy: '太棒了！1天后再复习 🎉',
            medium: '不错！4小时后再看看 👍', 
            hard: '没关系，多练几次就记住了 💪'
        };

        const colors = {
            easy: '#4CAF50',
            medium: '#FF9800',
            hard: '#F44336'
        };

        const feedback = document.createElement('div');
        feedback.className = 'memory-feedback';
        feedback.textContent = messages[level];
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors[level]};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 1.5s ease-in-out;
        `;

        // 添加CSS动画
        if (!document.querySelector('#memory-feedback-styles')) {
            const style = document.createElement('style');
            style.id = 'memory-feedback-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1500);
    },

    // 加载同义词
    loadSynonyms: function(word) {
        const block = document.querySelector('[data-block-id="synonyms"] .block-content');
        if (!block) return;

        block.innerHTML = '<div class="loading">正在加载同义词...</div>';
        
        // 调用GPT API获取同义词
        if (window.WordEnhancementService) {
            WordEnhancementService.generateSynonyms(word).then(synonyms => {
                if (synonyms && synonyms.length) {
                    block.innerHTML = `
                        <div class="synonyms-list">
                            ${synonyms.map(syn => `<span class="synonym-item">${syn}</span>`).join('')}
                        </div>
                    `;
                } else {
                    block.innerHTML = '<div class="no-data">暂无同义词数据</div>';
                }
            }).catch(() => {
                block.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
            });
        } else {
            // 使用模拟数据
            setTimeout(() => {
                block.innerHTML = `
                    <div class="synonyms-list">
                        <span class="synonym-item">distant</span>
                        <span class="synonym-item">faraway</span>
                        <span class="synonym-item">isolated</span>
                    </div>
                `;
            }, 1000);
        }
    },

    // 加载反义词
    loadAntonyms: function(word) {
        const block = document.querySelector('[data-block-id="antonyms"] .block-content');
        if (!block) return;

        block.innerHTML = '<div class="loading">正在加载反义词...</div>';
        
        // 调用GPT API获取反义词
        if (window.WordEnhancementService) {
            WordEnhancementService.generateAntonyms(word).then(antonyms => {
                if (antonyms && antonyms.length) {
                    block.innerHTML = `
                        <div class="antonyms-list">
                            ${antonyms.map(ant => `<span class="antonym-item">${ant}</span>`).join('')}
                        </div>
                    `;
                } else {
                    block.innerHTML = '<div class="no-data">暂无反义词数据</div>';
                }
            }).catch(() => {
                block.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
            });
        } else {
            // 使用模拟数据
            setTimeout(() => {
                block.innerHTML = `
                    <div class="antonyms-list">
                        <span class="antonym-item">close</span>
                        <span class="antonym-item">near</span>
                        <span class="antonym-item">nearby</span>
                    </div>
                `;
            }, 1000);
        }
    },

    // HTML转义
    escapeHtml: function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// 导出到全局
window.EightDimensionalMemory = EightDimensionalMemory;