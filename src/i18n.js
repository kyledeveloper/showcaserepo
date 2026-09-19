// UI chrome copy (hero, guide, nav labels, buttons) in both languages.
// Project-specific copy lives in src/data/works.js.

const copy = {
  zh: {
    settings: '页面设置',
    timeline: '作品时间线',
    start: '起点',
    goStart: '前往起点',
    goLife: '前往 LifeRPG',
    goBloom: '前往杯中花',
    goScanner: '前往 Options quant strategy scanner',
    kicker: '精选作品 · 2026',
    heroTitle: '把想法，做成能运行的世界。',
    heroNote: '三件作品，三种尺度：从日常成长、咖啡记录，到期权研究。向下滚动，沿着时间线逐个进入。',
    stackHeading: '作品画廊',
    addProject: '添加项目',
    stackHint: '滚轮翻页 · 悬停展开',
    stackHintTouch: '滑动翻页 · 点击展开',
    startBrowse: '开始浏览作品',
    scroll: '滚动',
    projectFeatures: '项目技术与特性',
    newProjectTitle: '添加新项目',
    newProjectIntro: '粘贴 GitHub 仓库地址，一键拉取项目资料；或切换到手动填写。整个过程留在当前画廊中。',
    closeProjectForm: '关闭添加项目页面',
    sourceMethod: '项目录入方式',
    githubImport: '从 GitHub 导入',
    manualEntry: '手动填写',
    githubUrlLabel: 'GitHub 仓库地址',
    githubUrlPlaceholder: 'https://github.com/owner/repository',
    githubUrlNote: '点击「获取信息」，自动从 GitHub 公开接口拉取名称、简介、主页与技术标签。',
    fetchRepoInfo: '获取信息',
    githubWaiting: '等待输入 GitHub 仓库地址。',
    githubFetching: '正在从 GitHub 拉取项目信息…',
    githubReady: '已从 GitHub 拉取 {repo} 的项目信息，并预填到下方表单。',
    githubInvalid: '请输入有效的 GitHub 仓库地址，例如 https://github.com/owner/repo。',
    githubNotFound: '在 GitHub 上找不到这个仓库，请检查地址是否正确。',
    githubFetchError: '拉取失败，请检查网络后重试。',
    manualReady: '手动模式：直接填写下面的项目信息。',
    projectNameLabel: '项目名称',
    projectNamePlaceholder: '例如 LifeRPG',
    projectDateLabel: '项目时间',
    projectDescriptionLabel: '项目简介',
    projectDescriptionPlaceholder: '用一两句话介绍它解决的问题和特色',
    sourceUrlLabel: '源码链接',
    sourceUrlPlaceholder: 'https://github.com/…',
    websiteUrlLabel: '项目网站（可选）',
    websiteUrlPlaceholder: 'https://…',
    projectTagsLabel: '技术与标签',
    projectTagsPlaceholder: 'React, TypeScript, Three.js',
    projectTagsNote: '用逗号分隔，之后会显示在项目卡片上。',
    draftOnlyNote: '现在先生成本页预览；发布与保存会在账号和后台接入后完成。',
    previewDraft: '预览草稿',
    draftPreviewLabel: '项目卡片预览',
    sourceLinkPreview: '源码',
    websiteLinkPreview: '网站',
    untitledProject: '未命名项目',
    emptyDescription: '填写简介后，会在这里看到项目卡片的内容。',
    languageSwitch: '切换到英文',
    themeToDark: '切换到深色模式',
    themeToLight: '切换到浅色模式'
  },
  en: {
    settings: 'Page settings',
    timeline: 'Project timeline',
    start: 'Start',
    goStart: 'Go to start',
    goLife: 'Go to LifeRPG',
    goBloom: 'Go to Bloom Latte',
    goScanner: 'Go to Options quant strategy scanner',
    kicker: 'Selected works · 2026',
    heroTitle: 'Turning ideas into worlds that work.',
    heroNote: 'Three projects at three scales: personal growth, coffee journaling, and options research. Scroll down to enter each one along the timeline.',
    stackHeading: 'Project Gallery',
    addProject: 'Add project',
    stackHint: 'Wheel to flip · Hover to expand',
    stackHintTouch: 'Swipe to flip · Tap to expand',
    startBrowse: 'Start browsing projects',
    scroll: 'Scroll',
    projectFeatures: 'Project technologies and features',
    newProjectTitle: 'Add a new project',
    newProjectIntro: 'Paste a GitHub repository URL to fetch its details in one click — or switch to manual entry. Everything stays inside this gallery.',
    closeProjectForm: 'Close add-project page',
    sourceMethod: 'Project entry method',
    githubImport: 'Import from GitHub',
    manualEntry: 'Enter manually',
    githubUrlLabel: 'GitHub repository URL',
    githubUrlPlaceholder: 'https://github.com/owner/repository',
    githubUrlNote: 'Click "Fetch info" to pull the name, description, homepage, and topics from the public GitHub API.',
    fetchRepoInfo: 'Fetch info',
    githubWaiting: 'Waiting for a GitHub repository URL.',
    githubFetching: 'Fetching project info from GitHub…',
    githubReady: 'Fetched {repo} from GitHub and prefilled the form below.',
    githubInvalid: 'Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo.',
    githubNotFound: 'Repository not found on GitHub — please check the URL.',
    githubFetchError: 'Fetch failed. Check your connection and try again.',
    manualReady: 'Manual mode: enter the project details below.',
    projectNameLabel: 'Project name',
    projectNamePlaceholder: 'For example, LifeRPG',
    projectDateLabel: 'Project date',
    projectDescriptionLabel: 'Project description',
    projectDescriptionPlaceholder: 'Describe the problem it solves and what makes it distinct',
    sourceUrlLabel: 'Source link',
    sourceUrlPlaceholder: 'https://github.com/…',
    websiteUrlLabel: 'Project website (optional)',
    websiteUrlPlaceholder: 'https://…',
    projectTagsLabel: 'Technologies and tags',
    projectTagsPlaceholder: 'React, TypeScript, Three.js',
    projectTagsNote: 'Separate tags with commas. They will appear on the project card.',
    draftOnlyNote: 'For now, this creates an in-page preview. Publishing and saving will arrive with accounts and the backend.',
    previewDraft: 'Preview draft',
    draftPreviewLabel: 'Project card preview',
    sourceLinkPreview: 'Source',
    websiteLinkPreview: 'Website',
    untitledProject: 'Untitled project',
    emptyDescription: 'Add a description to preview the project card here.',
    languageSwitch: '切换到中文',
    themeToDark: 'Switch to dark mode',
    themeToLight: 'Switch to light mode'
  }
};

let language = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
const listeners = new Set();
// Touch devices expand cards by tap rather than hover — swap the hint copy.
const touchLike = matchMedia('(hover: none)');

export function getLanguage() {
  return language;
}

export function t(key) {
  return copy[language][key] ?? copy.en[key] ?? key;
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyStaticCopy() {
  const strings = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = language === 'zh' ? '个人作品展示厅' : 'Selected Works';
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key =
      element.dataset.i18n === 'stackHint' && touchLike.matches ? 'stackHintTouch' : element.dataset.i18n;
    element.textContent = strings[key];
  });
  document.querySelectorAll('[data-i18n-label]').forEach((element) => {
    element.dataset.label = strings[element.dataset.i18nLabel];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', strings[element.dataset.i18nAriaLabel]);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = strings[element.dataset.i18nPlaceholder];
  });
}

export function setLanguage(nextLanguage) {
  if (nextLanguage === language || !copy[nextLanguage]) return;
  language = nextLanguage;
  applyStaticCopy();
  window.dispatchEvent(new CustomEvent('portfolio-language', { detail: language }));
  listeners.forEach((listener) => listener(language));
}

export function initI18n() {
  applyStaticCopy();
  return language;
}
