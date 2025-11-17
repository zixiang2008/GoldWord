import * as React from 'react';
import { FlashcardControls } from './FlashcardControls';

// 轻量示例：不依赖 Storybook 类型，直接导出演示组件
export default function MaterialVariant1Demo() {
    const [isAuto, setAuto] = React.useState(false);
    const [speed, setSpeed] = React.useState(1.0);
    const [lang, setLang] = React.useState<'en-us' | 'en-uk'>('en-us');
    return (
      <FlashcardControls
        variant={1}
        stylePreset="material"
        coreButtons={[ 'auto-play','flip','next' ]}
        rows={3}
        isAutoPlaying={isAuto}
        speed={speed}
        language={lang}
        onAutoPlay={()=>setAuto(v=>!v)}
        onFlip={()=>{}}
        onNext={()=>{}}
        onSpeedChange={setSpeed}
        onLanguageChange={setLang}
      />
    );
}