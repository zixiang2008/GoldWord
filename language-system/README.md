# GoldWord 多语言国际化系统使用文档

## 🌍 系统概述

GoldWord 多语言国际化系统是一个完整的解决方案，支持12种语言的自动翻译和界面本地化。系统集成了AI翻译功能，可以批量翻译界面元素，并提供完整的数据导入导出功能。

## ✨ 主要功能

### 1. 多语言支持
- **支持语言**: 中文简体、中文繁体、英语(美式/英式)、泰语、日语、西班牙语、法语、德语、韩语、阿拉伯语、俄语
- **自动检测**: 自动检测浏览器语言偏好
- **RTL支持**: 支持阿拉伯语等从右到左的语言

### 2. AI翻译集成
- **OpenAI GPT**: 集成GPT模型进行高质量翻译
- **Google Translate**: 支持Google翻译API作为备选方案
- **批量翻译**: 一键翻译所有界面元素
- **进度跟踪**: 实时显示翻译进度

### 3. 数据管理
- **导入功能**: 支持JSON格式的翻译数据导入
- **导出功能**: 导出当前翻译数据和缓存
- **缓存系统**: 自动缓存翻译结果，提高性能
- **历史记录**: 记录所有翻译操作历史

### 4. 界面集成
- **语言选择器**: 下拉式语言选择界面
- **实时切换**: 无需刷新页面即可切换语言
- **元素映射**: 自动识别和翻译200+界面元素

## 🚀 快速开始

### 1. 初始化系统

```javascript
// 在HTML中引入语言系统
<script src="language-system/language-system-complete-updated.js"></script>

// 初始化多语言系统
document.addEventListener('DOMContentLoaded', async function() {
    await LanguageSystem.init({
        defaultLanguage: 'zh-CN',      // 默认语言
        enableAutoDetect: true,         // 启用自动检测
        enableCache: true,              // 启用缓存
        enableAI: true                  // 启用AI翻译
    });
});
```

### 2. 使用翻译函数

```javascript
// 基本翻译
const text = LanguageSystem.t('hello', 'Hello');

// 带参数的翻译
const welcome = LanguageSystem.t('welcome_user', 'Welcome {user}', {user: 'John'});

// 全局翻译函数
const text = t('button_text', 'Click Me');
```

### 3. 创建语言选择器

```javascript
// 创建语言选择器组件
const languageSelector = LanguageSystem.createLanguageSelector();

// 添加到页面
document.getElementById('language-container').appendChild(languageSelector);
```

### 4. 批量翻译界面

```javascript
// 翻译所有界面元素
await LanguageSystem.translateAllUIElements('en-US', (progress) => {
    console.log(`翻译进度: ${progress.percentage}%`);
});
```

## 📋 界面元素映射

系统会自动识别和翻译以下类型的界面元素：

### 按钮文本
- 主要操作按钮（翻转、记得、朗读等）
- 复习按钮（不记得、要记住）
- 功能按钮（测试语音、保存设置等）

### 选择器选项
- 学习模式选择（英文一次、英文/中文一次等）
- 倒计时选择（1-9秒）
- 发音选择（美式/英式发音）
- 中文口音选择（大陆/台湾普通话）
- 倍速选择（0.4x - 2.0x）

### 标签和提示
- 统计信息标签（当前用户、总词数、复习进度等）
- 设置面板标题和说明
- 语音测试状态
- GPT服务设置说明

### 表单元素
- 输入框占位符
- 文件上传提示
- 错误消息和状态信息

## 🔄 数据导入导出

### 导出翻译数据

```javascript
// 导出当前翻译数据
LanguageSystem.exportTranslationData();

// 导出包含系统信息的完整数据
LanguageSystem.exportSystemData();
```

导出文件格式：
```json
{
    "version": "2.0.0",
    "timestamp": "2025-11-22T00:00:00.000Z",
    "language": "zh-CN",
    "translations": {
        "zh-CN": {
            "hello": "你好",
            "welcome": "欢迎"
        },
        "en-US": {
            "hello": "Hello",
            "welcome": "Welcome"
        }
    },
    "translationCache": {},
    "translationHistory": [],
    "stats": {
        "totalKeys": 122,
        "cacheSize": 0,
        "historySize": 0
    }
}
```

### 导入翻译数据

```javascript
// 从文件导入
document.getElementById('importBtn').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    LanguageSystem.importTranslationData(data);
                    alert('翻译数据导入成功！');
                } catch (error) {
                    alert('导入失败: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
});
```

## 🎨 自定义扩展

### 添加新语言

```javascript
// 扩展现有语言支持
LanguageSystem.config.supportedLanguages.push('it-IT');

// 添加语言信息
LanguageSystem.languages['it-IT'] = {
    name: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr'
};
```

### 自定义翻译

```javascript
// 添加自定义翻译
LanguageSystem.addTranslation('zh-CN', 'custom_key', '自定义文本');
LanguageSystem.addTranslation('en-US', 'custom_key', 'Custom Text');
```

### 扩展AI翻译器

```javascript
// 添加自定义AI翻译器
LanguageSystem.aiTranslators.customTranslator = {
    name: 'Custom AI',
    translate: async function(text, targetLang, sourceLang = 'auto') {
        // 实现自定义翻译逻辑
        return translatedText;
    }
};

// 设置为默认翻译器
LanguageSystem.currentAITranslator = 'customTranslator';
```

## ⚙️ 配置选项

### 初始化配置

```javascript
const options = {
    defaultLanguage: 'zh-CN',        // 默认语言代码
    enableAutoDetect: true,          // 自动检测浏览器语言
    enableCache: true,               // 启用翻译缓存
    enableAI: true,                  // 启用AI翻译
    cacheKeys: {                     // 本地存储键名
        language: 'goldword_user_language',
        translations: 'goldword_language_data',
        translationCache: 'goldword_translation_cache',
        translationHistory: 'goldword_translation_history'
    }
};

await LanguageSystem.init(options);
```

### 系统状态监控

```javascript
// 获取系统状态
const status = LanguageSystem.getSystemStatus();
console.log(status);
// 输出:
// {
//     initialized: true,
//     currentLanguage: 'zh-CN',
//     supportedLanguages: 12,
//     translationKeys: 122,
//     cacheSize: 0,
//     historySize: 0,
//     version: '2.0.0',
//     aiTranslationInProgress: false
// }
```

## 🔧 故障排除

### 常见问题

**1. 语言系统未初始化**
```javascript
if (typeof LanguageSystem === 'undefined') {
    console.error('语言系统未加载，请检查脚本引入');
}
```

**2. 翻译失败**
```javascript
try {
    await LanguageSystem.translateWithAI(text, targetLang);
} catch (error) {
    console.error('翻译失败:', error.message);
    // 使用备用翻译方案
}
```

**3. 语言切换无效**
```javascript
// 检查语言代码是否正确
const supportedLangs = LanguageSystem.config.supportedLanguages;
if (!supportedLangs.includes(targetLang)) {
    console.error('不支持的语言代码:', targetLang);
}
```

### 调试信息

```javascript
// 显示系统详细信息
LanguageSystem.showSystemInfo();

// 检查特定翻译键
const translation = LanguageSystem.getTranslation('zh-CN', 'key_name');
console.log('翻译结果:', translation);

// 查看翻译缓存
console.log('缓存内容:', LanguageSystem.status.translationCache);
```

## 📚 完整示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoldWord 多语言示例</title>
</head>
<body>
    <!-- 语言选择器容器 -->
    <div id="language-selector"></div>
    
    <!-- 测试按钮 -->
    <button id="translateBtn">🔄 AI翻译所有界面</button>
    <button id="exportBtn">📤 导出翻译数据</button>
    <button id="importBtn">📥 导入翻译数据</button>
    
    <!-- 状态显示 -->
    <div id="status"></div>
    
    <!-- 引入语言系统 -->
    <script src="language-system/language-system-complete-updated.js"></script>
    
    <script>
        // 初始化多语言系统
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                // 初始化系统
                await LanguageSystem.init({
                    defaultLanguage: 'zh-CN',
                    enableAutoDetect: true,
                    enableCache: true,
                    enableAI: true
                });
                
                // 创建语言选择器
                const languageSelector = LanguageSystem.createLanguageSelector();
                document.getElementById('language-selector').appendChild(languageSelector);
                
                // 绑定按钮事件
                document.getElementById('translateBtn').addEventListener('click', async function() {
                    const status = document.getElementById('status');
                    try {
                        status.textContent = '正在翻译...';
                        await LanguageSystem.translateAllUIElements(
                            LanguageSystem.getCurrentLanguage(),
                            (progress) => {
                                status.textContent = `翻译进度: ${progress.percentage}%`;
                            }
                        );
                        status.textContent = '✅ 翻译完成！';
                    } catch (error) {
                        status.textContent = '❌ 翻译失败: ' + error.message;
                    }
                });
                
                document.getElementById('exportBtn').addEventListener('click', function() {
                    LanguageSystem.exportTranslationData();
                    document.getElementById('status').textContent = '📤 数据已导出！';
                });
                
                document.getElementById('importBtn').addEventListener('click', function() {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = function(e) {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                try {
                                    const data = JSON.parse(event.target.result);
                                    LanguageSystem.importTranslationData(data);
                                    document.getElementById('status').textContent = '📥 数据导入成功！';
                                } catch (error) {
                                    document.getElementById('status').textContent = '❌ 导入失败: ' + error.message;
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                });
                
                console.log('🎉 多语言系统初始化完成！');
                
            } catch (error) {
                console.error('❌ 初始化失败:', error);
            }
        });
    </script>
</body>
</html>
```

## 📞 技术支持

如果您在使用过程中遇到问题，请检查以下资源：

1. **控制台日志**: 查看浏览器控制台中的详细错误信息
2. **系统状态**: 使用 `LanguageSystem.getSystemStatus()` 检查系统状态
3. **测试页面**: 访问 `test-language-system.html` 进行功能测试
4. **调试信息**: 使用 `LanguageSystem.showSystemInfo()` 获取系统信息

---

**版本**: 2.0.0  
**最后更新**: 2025年11月22日  
**兼容性**: 现代浏览器、移动端、Electron、PWA