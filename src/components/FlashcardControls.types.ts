export type Variant = 1 | 2 | 3;
export type StylePreset = 'material' | 'neumorphism' | 'minimal';

export interface FlashcardControlsProps {
  variant?: Variant;
  stylePreset?: StylePreset;
  coreButtons?: Array<'auto-play' | 'flip' | 'next'>; // 顺序可调
  rows?: 1 | 2 | 3; // 最多 3 行
  // 行为与状态
  onAutoPlay: () => void;
  onFlip: () => void;
  onNext: () => void;
  isAutoPlaying: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  language: 'en-us' | 'en-uk';
  onLanguageChange: (lang: 'en-us' | 'en-uk') => void;
}