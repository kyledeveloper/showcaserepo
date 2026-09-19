// Project data for the showcase gallery.
// Today this is a static list. Tomorrow it can be produced by src/api/client.js
// (listWorks) — see README.md "Going dynamic" for the migration path.
import lifeShot from '../assets/liferpg.jpg';
import bloomShot from '../assets/bloom-latte.jpg';
import scannerShot from '../assets/options-scanner.jpg';
import agentShot from '../assets/agent-skills.jpg';

export const works = [
  {
    id: 'life',
    date: { zh: '2026 · 09', en: 'SEP · 2026' },
    name: { zh: 'LifeRPG', en: 'LifeRPG' },
    description: {
      zh: '把现实行动变成角色成长。以每日时间为精力，完成任务，升级六维属性，逐步解锁更完整的自我管理能力。',
      en: 'Turns real-world actions into character growth. Daily time becomes energy: complete quests, level up six attributes, and unlock a more capable personal system.'
    },
    facts: [
      { zh: 'Expo · React Native', en: 'Expo · React Native' },
      { zh: '离线存档', en: 'Offline saves' }
    ],
    // Public source + live deployment.
    link: {
      href: 'https://github.com/kyledeveloper/LifeRPG',
      label: { zh: '查看源码', en: 'View source' }
    },
    website: {
      href: 'https://life-rpg-mauve-mu.vercel.app',
      label: { zh: '点击进入', en: 'Open website' }
    },
    shot: { src: lifeShot, kind: 'portrait' },
    alt: {
      zh: 'LifeRPG 应用首页截图，显示角色等级、精力、六维成长雷达图和任务',
      en: 'LifeRPG home screen showing character level, energy, a six-attribute radar chart, and quests'
    },
    previewLabel: { zh: 'LifeRPG 手机界面截图', en: 'LifeRPG mobile interface screenshot' },
    caption: { zh: '现实生活 → RPG 成长', en: 'Real life → RPG progression' }
  },
  {
    id: 'bloom',
    date: { zh: '2026 · 09', en: 'SEP · 2026' },
    name: { zh: '杯中花', en: 'Bloom Latte' },
    description: {
      zh: '一册有温度的咖啡拉花手记。拍下每一杯，记录图案、研磨度、牛奶与当时的笔记，让练习留下可以回看的轨迹。',
      en: 'A warm journal for latte-art practice. Photograph each cup and record the pattern, grind, milk, and notes so every session leaves a trail worth revisiting.'
    },
    facts: [
      { zh: '影像手记', en: 'Photo journal' },
      { zh: '练习复盘', en: 'Practice review' }
    ],
    link: {
      href: 'https://github.com/kyledeveloper/bloom-latte',
      label: { zh: '查看源码', en: 'View source' }
    },
    website: {
      href: 'https://bloom-latte.vercel.app',
      label: { zh: '点击进入', en: 'Open website' }
    },
    shot: { src: bloomShot, kind: 'portrait' },
    alt: {
      zh: '杯中花应用首页截图，展示咖啡拉花作品分类与评分',
      en: 'Bloom Latte home screen showing categorized and rated latte-art entries'
    },
    previewLabel: { zh: '杯中花咖啡手记截图', en: 'Bloom Latte coffee journal screenshot' },
    caption: { zh: '一杯 · 一朵花 · 一段记忆', en: 'A cup · A bloom · A memory' }
  },
  {
    id: 'leaps',
    date: { zh: '2026 · 09', en: 'SEP · 2026' },
    name: { zh: 'Options quant strategy scanner', en: 'Options quant strategy scanner' },
    description: {
      zh: '面向美股期权研究的量化扫描器。覆盖 LEAPS Call 与现金担保卖出看跌期权两类策略，用规则、风险模型与排序缩小研究范围。',
      en: 'A quantitative scanner for U.S. options research. It covers LEAPS calls and cash-secured puts, using rules, risk models, and ranking to narrow the research universe.'
    },
    facts: [
      { zh: '中英双语', en: 'Chinese + English' },
      { zh: '规则引擎', en: 'Rules engine' },
      { zh: '风险模型', en: 'Risk models' }
    ],
    link: {
      href: 'https://github.com/kyledeveloper/Leaps-call-production',
      label: { zh: '查看源码', en: 'View source' }
    },
    shot: { src: scannerShot, kind: 'scanner' },
    alt: {
      zh: 'Options Quant Strategy Scanner 深色界面截图，展示期权策略筛选和结果表格',
      en: 'Options Quant Strategy Scanner dark interface showing strategy filters and a results table'
    },
    previewLabel: { zh: 'Options quant strategy scanner 界面截图', en: 'Options quant strategy scanner interface screenshot' },
    caption: { zh: '研究信号，而非自动交易', en: 'Research signals, not auto-trading' }
  },
  {
    id: 'agent',
    date: { zh: '2026 · 09', en: 'SEP · 2026' },
    name: { zh: 'AI Agent 技能包', en: 'My First AI Agent' },
    description: {
      zh: '一套工业级 AI 编程智能体技能包：为 Cursor、Claude Code 等宿主智能体装配架构记忆、影响面雷达、极简约束与零信任安全门，让 AI 结对编程有纪律、可复盘。',
      en: 'An industrial-grade skill pack for AI coding agents: equips host agents like Cursor and Claude Code with architectural memory, blast-radius radar, minimalist discipline, and zero-trust security gates — so AI pair-programming stays disciplined and reviewable.'
    },
    facts: [
      { zh: 'Agent Skills', en: 'Agent Skills' },
      { zh: '静态分析', en: 'Static analysis' },
      { zh: '安全门禁', en: 'Security gates' }
    ],
    link: {
      href: 'https://github.com/kyledeveloper/my-first-ai-agent',
      label: { zh: '查看源码', en: 'View source' }
    },
    shot: { src: agentShot, kind: 'portrait' },
    alt: {
      zh: 'AI Agent 技能包概念封面：深色背景上的蓝色闪电与代码符号',
      en: 'AI agent skill pack cover art: a blue lightning bolt with code glyphs on a dark background'
    },
    previewLabel: { zh: 'AI Agent 技能包封面', en: 'AI agent skill pack cover' },
    caption: { zh: '给 AI 结对编程装上纪律', en: 'Discipline for AI pair-programming' }
  }
];
