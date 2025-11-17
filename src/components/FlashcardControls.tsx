import * as React from 'react';
import type { FlashcardControlsProps } from './FlashcardControls.types';
// 为了通用性，不强依赖 Tailwind；material 风格用内联样式与类混合实现

const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const FlashcardControls: React.FC<FlashcardControlsProps> = ({
  variant = 1,
  stylePreset = 'material',
  coreButtons = ['auto-play','flip','next'],
  rows = 3,
  onAutoPlay, onFlip, onNext, isAutoPlaying,
  speed, onSpeedChange, language, onLanguageChange,
}) => {
  // 风格类与内联样式
  const containerCls = stylePreset === 'neumorphism' ? 'neu-container' : '';
  const rowCls = stylePreset === 'neumorphism' ? 'neu-row' : 'flex-row';
  const btnBase = stylePreset === 'neumorphism' ? 'neu-btn' : 'btn-base';
  const selectBase = stylePreset === 'neumorphism' ? 'neu-select' : 'select-base';

  const materialBtnStyles: React.CSSProperties = stylePreset === 'material' ? {
    borderRadius: 9999,
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    color: '#fff',
    fontWeight: 700,
    width: 64, height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 120ms ease, box-shadow 120ms ease',
  } : {};

  const capsule: React.CSSProperties = stylePreset === 'material' ? {
    borderRadius: 9999, padding: '8px 14px'
  } : {};

  const gradients = {
    auto: 'linear-gradient(135deg,#22c55e,#10b981)',
    flip: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    next: 'linear-gradient(135deg,#f59e0b,#f97316)',
    speak: 'linear-gradient(135deg,#ef4444,#f87171)'
  };

  const renderCoreButton = (key: 'auto-play' | 'flip' | 'next') => {
    const style: React.CSSProperties = { ...materialBtnStyles };
    if (stylePreset === 'material') style.backgroundImage = gradients[key === 'auto-play' ? 'auto' : key];
    const label = key === 'auto-play' ? (isAutoPlaying ? 'Pause' : 'Play')
      : key === 'flip' ? 'Flip' : 'Next';
    const handler = key === 'auto-play' ? onAutoPlay : key === 'flip' ? onFlip : onNext;
    return (
      <button
        key={key}
        onClick={handler}
        className={btnBase}
        style={style}
        aria-label={label}
      >
        {label}
      </button>
    );
  };

  const row1 = (
    <div className={classNames(rowCls)} style={{ display:'flex', justifyContent:'center', alignItems:'center', gap: 16 }}>
      {coreButtons.map(renderCoreButton)}
    </div>
  );

  const row2 = (
    <div className={classNames(rowCls)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 16 }}>
      <button
        onClick={onAutoPlay}
        className={btnBase}
        style={{ ...(stylePreset==='material'?{ backgroundImage: gradients.speak }:{}), ...capsule, color:'#fff' }}
      >Speak / 发音</button>
      <select
        value={speed}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>onSpeedChange(parseFloat(e.target.value))}
        className={selectBase}
        style={{ ...(stylePreset==='material'?{ background:'#fff7ed', color:'#c2410c' }:{}), borderRadius: 9999, padding:'8px 10px' }}
      >
        {speedOptions.map(s=> <option key={s} value={s}>{s}x Speed</option>)}
      </select>
    </div>
  );

  const row3 = (
    <div className={classNames(rowCls)} style={{ display:'flex', justifyContent:'center', alignItems:'center', gap: 12 }}>
      <button
        onClick={()=>onLanguageChange(language==='en-us' ? 'en-uk' : 'en-us')}
        className={btnBase}
        style={{ ...capsule, background: stylePreset==='minimal'?'transparent':'#e0f2fe', color:'#0369a1' }}
      >
        {language === 'en-us' ? 'American' : 'British'} English
      </button>
      {isAutoPlaying && (
        <button onClick={onAutoPlay} className={btnBase} style={{ ...capsule, background:'#e5e7eb', color:'#374151' }}>Stop Auto Play</button>
      )}
    </div>
  );

  const rowsEl = [row1, row2, row3].slice(0, rows);

  // 变体布局（形状与对齐差异）
  if (variant === 2) {
    // 翻转按钮胶囊居中，两侧圆形
    coreButtons = ['flip','auto-play','next'];
  } else if (variant === 3) {
    // 水平胶囊，弱化次要
    coreButtons = ['auto-play','next','flip'];
  }

  return (
    <div className={classNames(containerCls)} style={{ width:'100%', padding:'12px 16px' }}>
      {rowsEl.map((r,idx)=> <div key={idx} style={{ marginBottom: 10 }}>{r}</div>)}
    </div>
  );
};

export default FlashcardControls;