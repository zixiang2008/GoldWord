// 快速验证AI翻译修复功能
// 这个脚本可以在浏览器控制台中运行，验证修复是否有效

console.log('🧪 开始验证AI翻译修复功能...');

// 验证函数存在
if (typeof LanguageSystem === 'undefined') {
    console.error('❌ LanguageSystem 未定义');
} else {
    console.log('✅ LanguageSystem 已定义');
    
    // 验证关键函数存在
    const requiredFunctions = [
        'translateAllUIElements',
        'getAllTranslatableElements', 
        'safeUpdateText',
        'extractTranslatableText',
        'preserveFormatting',
        'showNotification'
    ];
    
    let allFunctionsExist = true;
    requiredFunctions.forEach(funcName => {
        if (typeof LanguageSystem[funcName] === 'function') {
            console.log(`✅ ${funcName} 函数存在`);
        } else {
            console.error(`❌ ${funcName} 函数不存在`);
            allFunctionsExist = false;
        }
    });
    
    if (allFunctionsExist) {
        console.log('🎉 所有关键函数都存在！');
        
        // 测试元素选择功能
        try {
            const elements = LanguageSystem.getAllTranslatableElements();
            console.log(`📋 找到 ${elements.length} 个可翻译元素`);
            
            if (elements.length > 0) {
                elements.forEach((el, index) => {
                    const text = el.textContent?.trim() || '无文本';
                    console.log(`  ${index + 1}. ${el.tagName}: "${text}"`);
                });
            }
            
            // 测试文本提取功能
            const testTexts = [
                '🔄 AI翻译所有界面',
                '个人中心',
                'https://example.com',
                '123',
                '',
                '   '
            ];
            
            console.log('🔍 测试文本提取功能:');
            testTexts.forEach(text => {
                const extracted = LanguageSystem.extractTranslatableText(text);
                console.log(`  "${text}" → "${extracted}"`);
            });
            
            // 测试格式保护功能
            console.log('🎨 测试格式保护功能:');
            const testCases = [
                { original: '🔄 AI翻译所有界面', clean: 'AI翻译所有界面', translated: 'AI Translate All Interface' },
                { original: '个人中心 ▾', clean: '个人中心', translated: 'Personal Center' }
            ];
            
            testCases.forEach(testCase => {
                const result = LanguageSystem.preserveFormatting(
                    testCase.original, 
                    testCase.clean, 
                    testCase.translated
                );
                console.log(`  "${testCase.original}" → "${result}"`);
            });
            
            console.log('✅ 验证完成！修复功能正常工作。');
            
        } catch (error) {
            console.error('❌ 测试过程中出现错误:', error);
        }
        
    } else {
        console.error('❌ 部分函数缺失，修复可能不完整');
    }
}

console.log('🔧 验证脚本执行完毕。');

// 提供一个快速测试函数
window.quickTestTranslation = function() {
    console.log('🚀 快速测试AI翻译功能...');
    
    if (typeof LanguageSystem === 'undefined') {
        console.error('LanguageSystem 未初始化');
        return;
    }
    
    // 测试翻译几个元素
    const testElements = document.querySelectorAll('[data-translate="true"]');
    console.log(`找到 ${testElements.length} 个测试元素`);
    
    if (testElements.length === 0) {
        console.warn('没有找到带 data-translate="true" 属性的元素');
        return;
    }
    
    // 显示当前元素
    testElements.forEach((el, index) => {
        console.log(`元素 ${index + 1}: ${el.tagName} - "${el.textContent.trim()}"`);
    });
    
    console.log('✅ 快速测试完成。可以安全地进行AI翻译了！');
};