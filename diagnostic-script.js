// 诊断脚本 - 用于排查测试页面问题
// 在浏览器控制台中运行此脚本

console.log('🔍 开始诊断测试页面问题...');

// 检查基本环境
console.log('📋 环境检查:');
console.log('- document:', typeof document);
console.log('- document.body:', typeof document?.body);
console.log('- window:', typeof window);

// 检查关键元素
console.log('\n🔍 元素检查:');
const elementsToCheck = [
    'system-status',
    'test-results', 
    'translation-log',
    'progress-fill',
    'progress-text',
    'debug-info'
];

elementsToCheck.forEach(id => {
    const element = document.getElementById(id);
    console.log(`- ${id}: ${element ? '✅ 存在' : '❌ 不存在'}`);
    if (element) {
        console.log(`  - 类型: ${element.tagName}`);
        console.log(`  - 内容: ${element.textContent?.substring(0, 50)}...`);
    }
});

// 检查LanguageSystem
console.log('\n🔧 LanguageSystem检查:');
if (typeof LanguageSystem === 'undefined') {
    console.log('❌ LanguageSystem 未定义');
} else {
    console.log('✅ LanguageSystem 已定义');
    
    // 检查关键函数
    const functions = [
        'getAllTranslatableElements',
        'translateAllUIElements',
        'extractTranslatableText',
        'preserveFormatting',
        'safeUpdateText',
        'showNotification'
    ];
    
    functions.forEach(funcName => {
        const exists = typeof LanguageSystem[funcName] === 'function';
        console.log(`- ${funcName}: ${exists ? '✅' : '❌'}`);
    });
}

// 检查data-translate元素
console.log('\n🏷️ data-translate元素检查:');
const translatableElements = document.querySelectorAll('[data-translate="true"]');
console.log(`找到 ${translatableElements.length} 个data-translate元素:`);

translatableElements.forEach((el, index) => {
    console.log(`  ${index + 1}. ${el.tagName}: "${el.textContent?.trim()}"`);
});

// 测试元素选择功能
console.log('\n🧪 测试getAllTranslatableElements:');
try {
    if (typeof LanguageSystem !== 'undefined' && LanguageSystem.getAllTranslatableElements) {
        const elements = LanguageSystem.getAllTranslatableElements();
        console.log(`系统找到 ${elements.length} 个可翻译元素`);
        
        if (elements.length > 0) {
            elements.forEach((el, index) => {
                console.log(`  ${index + 1}. ${el.tagName}: "${el.textContent?.trim()}"`);
            });
        }
    }
} catch (error) {
    console.error('测试失败:', error);
}

// 检查事件监听器
console.log('\n👂 事件监听器检查:');
const buttons = document.querySelectorAll('button[onclick]');
console.log(`找到 ${buttons.length} 个带onclick的按钮:`);

buttons.forEach((btn, index) => {
    const onclick = btn.getAttribute('onclick');
    console.log(`  ${index + 1}. ${btn.textContent?.trim()}: ${onclick}`);
});

// 提供快速修复建议
console.log('\n💡 修复建议:');
console.log('1. 确保所有HTML元素都已正确加载');
console.log('2. 检查是否有JavaScript错误阻止页面初始化');
console.log('3. 验证LanguageSystem脚本是否正确加载');
console.log('4. 确保DOM完全加载后再执行测试');

// 提供一个延迟测试函数
window.delayedTest = function() {
    setTimeout(() => {
        console.log('⏰ 延迟3秒后重新测试...');
        
        const resultsContainer = document.getElementById('test-results');
        if (resultsContainer) {
            console.log('✅ test-results 元素现在可用了！');
            
            // 尝试添加一个测试项
            try {
                const testDiv = document.createElement('div');
                testDiv.className = 'test-result success';
                testDiv.innerHTML = '<strong>延迟测试:</strong> 元素现在可用了！';
                resultsContainer.appendChild(testDiv);
                console.log('✅ 成功添加测试项');
            } catch (error) {
                console.error('添加测试项失败:', error);
            }
        } else {
            console.log('❌ test-results 元素仍然不可用');
        }
    }, 3000);
};

console.log('\n🎯 诊断完成！');
console.log('💡 运行 delayedTest() 进行延迟测试');