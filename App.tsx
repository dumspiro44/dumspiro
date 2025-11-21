
import React, { useState, useEffect, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  Languages, 
  FileText, 
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  Check,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Crown,
  Moon,
  Sun,
  HelpCircle,
  Info,
  DownloadCloud,
  AlertTriangle,
  Key,
  Database,
  Wifi,
  WifiOff,
  Server,
  ServerOff
} from 'lucide-react';
import { WPSettings, WPPost, TranslationJob, TranslationStatus } from './types';

// --- MOCK DATA & BACKEND SIMULATION ---

const DEMO_DELAY = 800; // ms to simulate network latency

const INITIAL_MOCK_POSTS: WPPost[] = [
  {
    id: 101,
    title: { rendered: 'Welcome to Perspectives' },
    content: { rendered: '<p>Welcome to our company. We strive for excellence in architecture and design.</p>' },
    excerpt: { rendered: 'Welcome to our company...' },
    slug: 'welcome',
    type: 'page',
    link: '#',
    lang: 'en',
    translations: { 'sk': 102 } // Pre-translated to Slovak
  },
  {
    id: 105,
    title: { rendered: 'Modern Urban Planning' },
    content: { rendered: '<p>Urban planning is essential for sustainable cities. <strong>Green spaces</strong> are vital.</p>' },
    excerpt: { rendered: 'Urban planning is essential...' },
    slug: 'urban-planning',
    type: 'post',
    link: '#',
    lang: 'en',
    translations: {}
  },
  {
    id: 108,
    title: { rendered: 'Investment Opportunities 2025' },
    content: { rendered: '<ul><li>Real Estate</li><li>Tech Startups</li><li>Green Energy</li></ul>' },
    excerpt: { rendered: 'List of opportunities...' },
    slug: 'invest-2025',
    type: 'post',
    link: '#',
    lang: 'en',
    translations: {}
  },
  {
    id: 112,
    title: { rendered: 'Contact Us' },
    content: { rendered: '<p>Email us at info@example.com or call +421 900 000 000</p>' },
    excerpt: { rendered: 'Contact details...' },
    slug: 'contact',
    type: 'page',
    link: '#',
    lang: 'en',
    translations: { 'cs': 113, 'mo': 114 }
  }
];

const INITIAL_SETTINGS: WPSettings = {
  wpUrl: 'https://demo.wordpress.site',
  wpUser: '',
  wpAppPassword: '',
  sourceLang: 'en',
  targetLangs: ['sk', 'cs', 'kk', 'mo'],
  postTypes: ['post', 'page'],
  geminiApiKey: '',
  systemInstruction: ''
};

const LANGUAGES_CONFIG = [
    { code: 'en', name: 'English', country: 'us' },
    { code: 'sk', name: 'Slovak', country: 'sk' },
    { code: 'kk', name: 'Kazakh', country: 'kz' },
    { code: 'cs', name: 'Czech', country: 'cz' },
    { code: 'mo', name: 'Moldovan', country: 'md' },
    { code: 'es', name: 'Spanish', country: 'es' },
    { code: 'fr', name: 'French', country: 'fr' },
    { code: 'de', name: 'German', country: 'de' },
    { code: 'ru', name: 'Russian', country: 'ru' },
    { code: 'pl', name: 'Polish', country: 'pl' },
    { code: 'hu', name: 'Hungarian', country: 'hu' },
];

// Simulates a backend service using LocalStorage
class MockBackend {
  static getSettingsSync(): WPSettings {
    const stored = localStorage.getItem('wp_settings');
    return stored ? JSON.parse(stored) : INITIAL_SETTINGS;
  }

  static getSettings(): Promise<WPSettings> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.getSettingsSync());
      }, DEMO_DELAY);
    });
  }

  static saveSettings(settings: WPSettings): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.setItem('wp_settings', JSON.stringify(settings));
        resolve(true);
      }, DEMO_DELAY);
    });
  }

  static getPosts(): Promise<WPPost[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        // In a real app, we'd fetch from WP. Here we return static mock posts
        // merged with any "translated" status stored in local session for the demo
        const posts = [...INITIAL_MOCK_POSTS]; 
        resolve(posts);
      }, DEMO_DELAY);
    });
  }

  static validateConnection(): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1500);
    });
  }

  static checkPolylang(): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        const installed = localStorage.getItem('polylang_installed') === 'true';
        resolve(installed);
      }, 1000);
    });
  }

  static installPolylang(): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.setItem('polylang_installed', 'true');
        resolve(true);
      }, 2500);
    });
  }

  static getJobs(): Promise<TranslationJob[]> {
    return new Promise(resolve => {
      const stored = localStorage.getItem('wp_jobs');
      resolve(stored ? JSON.parse(stored) : []);
    });
  }

  static createJobs(postIds: number[], targetLangs: string[]): Promise<void> {
    return new Promise(resolve => {
      const stored = localStorage.getItem('wp_jobs');
      let jobs: TranslationJob[] = stored ? JSON.parse(stored) : [];

      postIds.forEach(pid => {
        targetLangs.forEach(lang => {
          // Basic check: don't translate if target same as source (simplified for demo)
          if (lang === 'en') return; 

          jobs.unshift({
            id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            postId: pid,
            sourceLang: 'en',
            targetLang: lang,
            status: TranslationStatus.PENDING,
            progress: 0,
            createdAt: new Date().toISOString(),
            title: `Post #${pid} -> ${lang.toUpperCase()}`
          });
        });
      });

      localStorage.setItem('wp_jobs', JSON.stringify(jobs));
      resolve();
    });
  }

  // Helper to simulate job progress (called by the UI interval)
  static processJobQueue() {
    const stored = localStorage.getItem('wp_jobs');
    if (!stored) return;

    let jobs: TranslationJob[] = JSON.parse(stored);
    let changed = false;

    jobs = jobs.map(job => {
      if (job.status === TranslationStatus.COMPLETED || job.status === TranslationStatus.FAILED) return job;

      changed = true;
      // Move Pending to Processing
      if (job.status === TranslationStatus.PENDING) {
        return { ...job, status: TranslationStatus.PROCESSING, progress: 10 };
      }

      // Advance Processing
      if (job.status === TranslationStatus.PROCESSING) {
        const newProgress = (job.progress || 0) + Math.floor(Math.random() * 20) + 5;
        if (newProgress >= 100) {
          return { ...job, progress: 100, status: TranslationStatus.COMPLETED, completedAt: new Date().toISOString() };
        }
        return { ...job, progress: newProgress };
      }
      return job;
    });

    if (changed) {
      localStorage.setItem('wp_jobs', JSON.stringify(jobs));
    }
  }
}

// --- TRANSLATIONS ---

const TRANSLATIONS = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      posts: 'Posts Management',
      jobs: 'Translation Jobs',
      settings: 'Configuration',
    },
    common: {
      status: 'Status',
      active: 'Active',
      model: 'API Model',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      language: 'Language',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      actions: 'Actions',
      id: 'ID',
      title: 'Title',
      type: 'Type',
      viewEdit: 'Translations (View/Edit)',
      error: 'Error',
      demoMode: 'DEMO MODE',
      noLangs: 'No languages selected',
    },
    dashboard: {
      title: 'Overview',
      runScan: 'Run Auto-Scan',
      totalPosts: 'Total Posts',
      translated: 'Translated',
      pending: 'Pending Jobs',
      tokens: 'Tokens Used',
      recentActivity: 'Recent Activity',
      langCoverage: 'Language Coverage',
      success: 'Success',
      translatedMsg: 'Translated post to',
      ago: 'ago',
      wpConnected: 'WP Connected',
      wpDisconnected: 'Connect WP',
      apiConnected: 'API Ready',
      apiDisconnected: 'Setup API',
    },
    settings: {
      title: 'Configuration',
      wpConnection: 'WordPress Connection',
      wpUrl: 'WordPress URL',
      username: 'Admin name',
      appPassword: 'Admin password',
      testConnection: 'Test Connection',
      targetLangs: 'Target Languages',
      aiEngine: 'Translation Engine (Gemini)',
      apiKey: 'Gemini API Key',
      apiKeyPlaceholder: 'Enter your API Key...',
      apiKeyHelp: 'Required to access the model.',
      getKeyLink: 'Get your free API Key here',
      model: 'Model',
      sysInstruction: 'System Instruction',
      defaultSysInstruction: 'You are a professional translator. Preserve all HTML tags, classes, and IDs. Do not translate URLs.',
      geminiFlash: 'Gemini 2.5 Flash (Recommended)',
      geminiPro: 'Gemini 2.5 Pro (High Reasoning)',
      saveConfig: 'Save Configuration',
      saving: 'Saving...',
      saved: 'Configuration Saved!',
      polylang: {
        checking: 'Checking Polylang...',
        active: 'Polylang Active',
        missing: 'Polylang Missing',
        installBtn: 'Install Polylang Auto',
        installing: 'Installing Polylang...',
        success: 'Polylang Installed!',
        fail: 'Installation Failed'
      }
    },
    posts: {
      title: 'Posts Management',
      translateSelected: 'Translate Selected',
      allTypes: 'All Post Types',
      showAll: 'Show All',
      untranslated: 'Untranslated',
      translateSingle: 'Translate',
    },
    jobs: {
      title: 'Job Queue',
      progress: 'Progress',
      translatePost: 'Translate Post',
    },
    editModal: {
      editTrans: 'Edit Translation',
      original: 'Original',
      postTitle: 'Post Title',
      origContent: 'Original Content (Read-only)',
      transContent: 'Translated Content',
      excerpt: 'Excerpt',
      saveTrans: 'Save Translation',
    },
    help: {
      title: 'Help & Guide',
      intro: 'Welcome to WP PolyLingo Auto-Translator. This tool automates the translation of your WordPress content using Gemini AI.',
      step1: '1. Configuration: Connect your WordPress site and select target languages in the Settings page.',
      step2: '2. Select Posts: Go to Posts Management, select the posts you want to translate.',
      step3: '3. Translate: Click "Translate Selected" to start the batch job.',
      step4: '4. Review: Monitor progress in Translation Jobs and edit results manually if needed.',
      copyright: 'Perspektiva Impereal © 2025'
    },
    languages: {
      en: 'English',
      sk: 'Slovak',
      kk: 'Kazakh',
      cs: 'Czech',
      mo: 'Moldovan',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ru: 'Russian',
      pl: 'Polish',
      hu: 'Hungarian',
    }
  },
  ru: {
    nav: {
      dashboard: 'Дашборд',
      posts: 'Управление записями',
      jobs: 'Задачи перевода',
      settings: 'Настройки',
    },
    common: {
      status: 'Статус',
      active: 'Активен',
      model: 'Модель API',
      darkMode: 'Темная тема',
      lightMode: 'Светлая тема',
      language: 'Язык',
      save: 'Сохранить',
      cancel: 'Отмена',
      loading: 'Загрузка...',
      actions: 'Действия',
      id: 'ID',
      title: 'Заголовок',
      type: 'Тип',
      viewEdit: 'Переводы (Просмотр/Ред.)',
      error: 'Ошибка',
      demoMode: 'ДЕМО РЕЖИМ',
      noLangs: 'Языки не выбраны',
    },
    dashboard: {
      title: 'Обзор',
      runScan: 'Запустить сканирование',
      totalPosts: 'Всего записей',
      translated: 'Переведено',
      pending: 'В очереди',
      tokens: 'Токенов исп.',
      recentActivity: 'Недавняя активность',
      langCoverage: 'Покрытие языков',
      success: 'Успешно',
      translatedMsg: 'Переведен пост на',
      ago: 'назад',
      wpConnected: 'WP Подключен',
      wpDisconnected: 'Подключить WP',
      apiConnected: 'API Готов',
      apiDisconnected: 'Настроить API',
    },
    settings: {
      title: 'Настройки',
      wpConnection: 'Подключение к WordPress',
      wpUrl: 'URL сайта WordPress',
      username: 'Имя администратора',
      appPassword: 'Пароль администратора',
      testConnection: 'Проверить',
      targetLangs: 'Целевые языки',
      aiEngine: 'Движок перевода (Gemini)',
      apiKey: 'API Ключ Gemini',
      apiKeyPlaceholder: 'Введите ваш API ключ...',
      apiKeyHelp: 'Необходим для доступа к модели.',
      getKeyLink: 'Получить API ключ здесь',
      model: 'Модель',
      sysInstruction: 'Системная инструкция',
      defaultSysInstruction: 'Вы профессиональный переводчик. Сохраняйте все HTML теги, классы и ID. Не переводите URL-адреса.',
      geminiFlash: 'Gemini 2.5 Flash (Рекомендуется)',
      geminiPro: 'Gemini 2.5 Pro (Высокое мышление)',
      saveConfig: 'Сохранить настройки',
      saving: 'Сохранение...',
      saved: 'Настройки сохранены!',
      polylang: {
        checking: 'Проверка Polylang...',
        active: 'Polylang Активен',
        missing: 'Polylang Не найден',
        installBtn: 'Установить Polylang',
        installing: 'Установка Polylang...',
        success: 'Polylang Установлен!',
        fail: 'Ошибка установки'
      }
    },
    posts: {
      title: 'Управление записями',
      translateSelected: 'Перевести выбранное',
      allTypes: 'Все типы',
      showAll: 'Показать все',
      untranslated: 'Непереведенные',
      translateSingle: 'Перевести',
    },
    jobs: {
      title: 'Очередь задач',
      progress: 'Прогресс',
      translatePost: 'Перевод записи',
    },
    editModal: {
      editTrans: 'Редактировать перевод',
      original: 'Оригинал',
      postTitle: 'Заголовок записи',
      origContent: 'Оригинальный контент (Только чтение)',
      transContent: 'Переведенный контент',
      excerpt: 'Отрывок (Excerpt)',
      saveTrans: 'Сохранить перевод',
    },
    help: {
      title: 'Помощь и руководство',
      intro: 'Добро пожаловать в WP PolyLingo Auto-Translator. Этот инструмент автоматизирует перевод контента WordPress с помощью Gemini AI.',
      step1: '1. Настройка: Подключите ваш сайт WordPress и выберите языки перевода на странице Настроек.',
      step2: '2. Выбор записей: Перейдите в Управление записями и отметьте посты для перевода.',
      step3: '3. Перевод: Нажмите "Перевести выбранное" для запуска пакетной задачи.',
      step4: '4. Проверка: Следите за прогрессом в Задачах перевода и редактируйте результаты вручную при необходимости.',
      copyright: 'Perspektiva Impereal © 2025'
    },
    languages: {
      en: 'Английский',
      sk: 'Словацкий',
      kk: 'Казахский',
      cs: 'Чешский',
      mo: 'Молдавский',
      es: 'Испанский',
      fr: 'Французский',
      de: 'Немецкий',
      ru: 'Русский',
      pl: 'Польский',
      hu: 'Венгерский',
    }
  }
};

// --- Contexts ---

const ThemeContext = React.createContext({
  isDarkMode: true,
  toggleTheme: () => {}
});

const LanguageContext = React.createContext({
  lang: 'en',
  setLang: (lang: 'en' | 'ru') => {},
  t: TRANSLATIONS.en
});

// --- Components ---

const Sidebar = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { lang, setLang, t } = useContext(LanguageContext);

  const navItems = [
    { path: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { path: '/posts', label: t.nav.posts, icon: FileText },
    { path: '/jobs', label: t.nav.jobs, icon: Activity },
    { path: '/settings', label: t.nav.settings, icon: SettingsIcon },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen fixed left-0 top-0 z-20 transition-colors duration-200">
      {/* Logo Section */}
      <div className="p-8 flex flex-col items-center text-center border-b border-gray-200 dark:border-gray-700">
        <Crown className="w-12 h-12 text-gold-500 mb-3 drop-shadow-sm" />
        <h1 className="font-serif font-bold text-xl tracking-wider text-gray-900 dark:text-white leading-tight">
          PERSPEKTIVA
          <span className="block text-gold-600 dark:text-gold-500">IMPEREAL</span>
        </h1>
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">PolyLingo Translator</span>
        
        <div className="mt-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded font-mono font-bold flex items-center gap-1">
          <Database className="w-3 h-3" /> {t.common.demoMode}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-900/40' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
        {/* Language Toggle */}
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2 text-sm font-medium">
             <Globe className="w-4 h-4" />
             {lang === 'en' ? 'English' : 'Русский'}
          </div>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-md p-1">
             <button 
               onClick={() => setLang('en')}
               className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >EN</button>
             <button 
               onClick={() => setLang('ru')}
               className={`px-2 py-1 text-xs font-bold rounded ${lang === 'ru' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}
             >RU</button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
             {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-500" />}
             {isDarkMode ? t.common.darkMode : t.common.lightMode}
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'left-4.5 translate-x-4' : 'left-0.5'}`}></div>
          </div>
        </button>

        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between mb-2">
            <span>{t.common.status}</span>
            <span className="text-green-600 dark:text-green-400 font-medium">{t.common.active}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.common.model}</span>
            <span className="text-blue-600 dark:text-blue-300 font-medium">Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden transition-colors duration-200">
    <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
      <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
    </div>
  </div>
);

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useContext(LanguageContext);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.help.title}</h3>
        </div>

        <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          <p>{t.help.intro}</p>
          <ul className="space-y-2 text-left bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <li>{t.help.step1}</li>
            <li>{t.help.step2}</li>
            <li>{t.help.step3}</li>
            <li>{t.help.step4}</li>
          </ul>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors w-full">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
        <span>&copy; {new Date().getFullYear()}</span>
        <a 
          href="https://czholding.com.ua/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gold-600 dark:text-gold-500 hover:underline inline-flex items-center gap-1 font-medium"
        >
          Perspektiva Impereal
        </a>
        <span>. All rights reserved.</span>
      </div>
    </footer>
  );
};

const Dashboard = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [checks, setChecks] = useState({ wp: false, api: false });

  useEffect(() => {
    // Use synchronous check to avoid flickering state
    const s = MockBackend.getSettingsSync();
    setChecks({
        wp: !!s.wpUrl && s.wpUrl.includes('http'),
        api: !!s.geminiApiKey
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h2>
        
        <div className="flex items-center gap-3">
            {/* WP Connection Signal */}
            <button 
                onClick={() => navigate('/settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    checks.wp 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/30'
                }`}
            >
                {checks.wp ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {checks.wp ? t.dashboard.wpConnected : t.dashboard.wpDisconnected}
            </button>

            {/* API Connection Signal */}
            <button 
                onClick={() => navigate('/settings', { state: { scrollTo: 'api-key-section' } })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    checks.api 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default'
                    : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/30'
                }`}
            >
                {checks.api ? <Server className="w-4 h-4" /> : <ServerOff className="w-4 h-4" />}
                {checks.api ? t.dashboard.apiConnected : t.dashboard.apiDisconnected}
            </button>

            <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md ml-2">
                <Zap className="w-4 h-4" />
                <span>{t.dashboard.runScan}</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label={t.dashboard.totalPosts} value="120" icon={FileText} color="text-blue-500" />
        <StatCard label={t.dashboard.translated} value="85" icon={Languages} color="text-green-500" />
        <StatCard label={t.dashboard.pending} value="4" icon={Loader2} color="text-yellow-500" />
        <StatCard label={t.dashboard.tokens} value="2.4M" icon={Activity} color="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            {t.dashboard.recentActivity}
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{t.dashboard.translatedMsg} Slovak</p>
                    <p className="text-xs text-gray-500">2 mins {t.dashboard.ago}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">{t.dashboard.success}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            {t.dashboard.langCoverage}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>Slovak (SK)</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">98%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>Kazakh (KK)</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">45%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>Czech (CS)</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">12%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const [settings, setSettings] = useState<WPSettings>({
    wpUrl: '',
    wpUser: '',
    wpAppPassword: '',
    sourceLang: 'en',
    targetLangs: [],
    postTypes: [],
    geminiApiKey: '',
    systemInstruction: ''
  });
  
  const [polylangStatus, setPolylangStatus] = useState<'idle' | 'checking' | 'active' | 'missing' | 'installing'>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    MockBackend.getSettings().then(data => {
      // Safely merge with default array to avoid null/undefined issues
      setSettings(prev => ({
        ...data,
        targetLangs: Array.isArray(data.targetLangs) ? data.targetLangs : []
      }));
    });
    MockBackend.checkPolylang().then(active => {
        if (active) setPolylangStatus('active');
        else setPolylangStatus('missing');
    });
  }, []);

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      const element = document.getElementById(state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-gray-800');
          setTimeout(() => {
             element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-gray-800');
          }, 1500);
        }, 300);
      }
    }
  }, [location]);

  const handleChange = (field: keyof WPSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaveState('idle');
  };

  const toggleLanguage = (code: string) => {
    setSettings(prev => {
      const current = Array.isArray(prev.targetLangs) ? prev.targetLangs : [];
      if (current.includes(code)) {
        return { ...prev, targetLangs: current.filter(c => c !== code) };
      } else {
        return { ...prev, targetLangs: [...current, code] };
      }
    });
  };

  const handleSaveSettings = async () => {
    setSaveState('saving');
    await MockBackend.saveSettings(settings);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handleTestConnection = async () => {
    setPolylangStatus('checking');
    const valid = await MockBackend.validateConnection();
    if (valid) {
        const installed = await MockBackend.checkPolylang();
        setPolylangStatus(installed ? 'active' : 'missing');
    } else {
        alert("Connection failed!");
        setPolylangStatus('idle');
    }
  };

  const handleInstallPolylang = async () => {
    setPolylangStatus('installing');
    await MockBackend.installPolylang();
    setPolylangStatus('active');
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t.settings.title}</h2>
      
      <div className="grid gap-8">
        {/* WordPress Connection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">WP</div>
            {t.settings.wpConnection}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.wpUrl}</label>
              <input 
                type="text" 
                value={settings.wpUrl}
                onChange={(e) => handleChange('wpUrl', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="https://your-site.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.username}</label>
              <input 
                type="text" 
                value={settings.wpUser}
                onChange={(e) => handleChange('wpUser', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="e.g. admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.appPassword}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={settings.wpAppPassword}
                  onChange={(e) => handleChange('wpAppPassword', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors pr-10"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row justify-end items-center gap-4">
             {/* Polylang Status Indicator */}
             {polylangStatus !== 'idle' && (
               <div className="flex items-center gap-3 animate-in fade-in duration-300">
                  {polylangStatus === 'checking' && (
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.settings.polylang.checking}
                    </span>
                  )}
                  
                  {polylangStatus === 'active' && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-4 h-4" />
                      {t.settings.polylang.active}
                    </span>
                  )}

                  {polylangStatus === 'missing' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="w-4 h-4" />
                        {t.settings.polylang.missing}
                      </span>
                      <button 
                        onClick={handleInstallPolylang}
                        className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        {t.settings.polylang.installBtn}
                      </button>
                    </div>
                  )}

                  {polylangStatus === 'installing' && (
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.settings.polylang.installing}
                    </span>
                  )}
               </div>
             )}

             <button 
              onClick={handleTestConnection}
              disabled={polylangStatus === 'checking' || polylangStatus === 'installing'}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium"
             >
               {t.settings.testConnection}
             </button>
          </div>
        </div>

        {/* Target Languages */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
              <Languages className="w-5 h-5" />
            </div>
            {t.settings.targetLangs}
          </h3>
          {/* Changed grid-cols-4 to grid-cols-3 to allow more space for Russian text */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LANGUAGES_CONFIG.map(lang => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all relative overflow-hidden ${
                  settings.targetLangs && settings.targetLangs.includes(lang.code)
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                  settings.targetLangs && settings.targetLangs.includes(lang.code) ? 'border-white bg-white/20' : 'border-gray-400 dark:border-gray-600'
                }`}>
                  {settings.targetLangs && settings.targetLangs.includes(lang.code) && <Check className="w-3 h-3 text-white" />}
                </div>
                <img
                  src={`https://flagcdn.com/24x18/${lang.country}.png`}
                  srcSet={`https://flagcdn.com/48x36/${lang.country}.png 2x`}
                  width="24"
                  height="18"
                  alt={lang.name}
                  className="mr-1 rounded-sm shadow-sm flex-shrink-0"
                />
                {/* Added truncate and text-sm to handle long language names */}
                <span className="font-medium text-sm truncate">{(t.languages as any)[lang.code] || lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">AI</div>
            {t.settings.aiEngine}
          </h3>

          <div className="space-y-6">
            {/* API Key Input */}
             <div id="api-key-section" className="transition-all duration-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.apiKey}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                  className="w-full pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  placeholder={t.settings.apiKeyPlaceholder}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">{t.settings.apiKeyHelp}</span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                >
                  {t.settings.getKeyLink} <Globe className="w-3 h-3" />
                </a>
              </div>
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.model}</label>
              <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors">
                <option value="gemini-2.5-flash">{t.settings.geminiFlash}</option>
                <option value="gemini-2.5-pro">{t.settings.geminiPro}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.sysInstruction}</label>
              <textarea 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                value={settings.systemInstruction || ''}
                onChange={(e) => handleChange('systemInstruction', e.target.value)}
                placeholder={t.settings.defaultSysInstruction}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            {saveState === 'saving' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
            {saveState === 'saved' ? t.settings.saved : (saveState === 'saving' ? t.settings.saving : t.settings.saveConfig)}
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: WPPost | null;
  lang: string;
  onSave: (id: number, lang: string, data: any) => void;
}

const EditTranslationModal = ({ isOpen, onClose, post, lang, onSave }: EditModalProps) => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setIsLoading(true);
      setTimeout(() => {
        const hasTranslation = post.translations && post.translations[lang];
        setFormData({
          title: hasTranslation ? `[${lang.toUpperCase()}] ${post.title.rendered}` : post.title.rendered,
          content: hasTranslation ? `<p>[Translated to ${lang}]</p> ${post.content.rendered}` : post.content.rendered,
          excerpt: hasTranslation ? `[Translated] ${post.excerpt.rendered}` : post.excerpt.rendered,
        });
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, post, lang]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              {t.editModal.editTrans}
              <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded uppercase ml-2">{lang}</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.editModal.original}: {post.title.rendered}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p>{t.common.loading}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.postTitle}</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                 <div className="flex flex-col">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.origContent}</label>
                   <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 overflow-y-auto text-gray-500 dark:text-gray-400 text-sm font-mono">
                      {post.content.rendered}
                   </div>
                 </div>
                 <div className="flex flex-col">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.transContent}</label>
                   <textarea 
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-colors"
                   />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.excerpt}</label>
                <textarea 
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            {t.common.cancel}
          </button>
          <button 
            onClick={() => onSave(post.id, lang, formData)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t.editModal.saveTrans}
          </button>
        </div>
      </div>
    </div>
  );
};

const Posts = () => {
  const { t } = useContext(LanguageContext);
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  
  // State for Editor Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditPost, setCurrentEditPost] = useState<WPPost | null>(null);
  const [currentEditLang, setCurrentEditLang] = useState('');
  
  // Initialize immediately from localStorage if available to prevent flickering or mismatch
  const [targetLangs, setTargetLangs] = useState<string[]>(() => {
    const s = MockBackend.getSettingsSync();
    return s.targetLangs || [];
  });

  useEffect(() => {
    // Fetch posts
    MockBackend.getPosts().then(p => {
      setPosts(p);
      setIsLoading(false);
    });
    
    // Also fetch settings asynchronously just in case, but the initial state handles the immediate render
    MockBackend.getSettings().then(s => {
        if (Array.isArray(s.targetLangs)) {
            setTargetLangs(s.targetLangs);
        }
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p.id)));
    }
  };

  const handleSelectPost = (id: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkTranslate = async () => {
    if (selectedPosts.size === 0) return;
    const postIds = Array.from(selectedPosts);
    
    // Demo: Create jobs in MockBackend
    await MockBackend.createJobs(postIds, targetLangs);
    
    alert(`Demo Job started for ${postIds.length} posts! Check Jobs tab.`);
    setSelectedPosts(new Set());
  };

  const handleOpenEditor = (post: WPPost, lang: string) => {
    setCurrentEditPost(post);
    setCurrentEditLang(lang);
    setEditModalOpen(true);
  };

  const handleSaveTranslation = (postId: number, lang: string, data: any) => {
    console.log("Saving", { postId, lang, data });
    setEditModalOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.posts.title}</h2>
        <div className="flex gap-2 items-center">
           {selectedPosts.size > 0 && (
             <button 
              onClick={handleBulkTranslate}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 animate-in fade-in slide-in-from-right-4 duration-300"
             >
               <Zap className="w-4 h-4" />
               {t.posts.translateSelected} ({selectedPosts.size})
             </button>
           )}

           <select className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors">
             <option>{t.posts.allTypes}</option>
             <option>Post</option>
             <option>Page</option>
           </select>
           <select className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors">
             <option>{t.posts.showAll}</option>
             <option>{t.posts.untranslated}</option>
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 w-10 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={posts.length > 0 && selectedPosts.size === posts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-4 w-16">{t.common.id}</th>
              <th className="px-6 py-4">{t.common.title}</th>
              <th className="px-6 py-4 w-24">{t.common.type}</th>
              <th className="px-6 py-4">{t.common.viewEdit}</th>
              <th className="px-6 py-4 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  {t.common.loading}
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                   No posts found. Check configuration.
                </td>
              </tr>
            ) : posts.map(post => {
              const isSelected = selectedPosts.has(post.id);
              return (
                <tr 
                  key={post.id} 
                  className={`transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isSelected}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-500">#{post.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {post.title.rendered}
                    <div className="text-xs text-gray-500 mt-1">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs uppercase">
                      {post.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                       {targetLangs.length === 0 && (
                           <span className="text-xs text-gray-400 italic flex items-center h-8">{t.common.noLangs}</span>
                       )}

                       {targetLangs.map(lang => {
                         const hasTranslation = post.translations && post.translations[lang];
                         const isSource = post.lang === lang;
                         const isActive = hasTranslation || isSource;

                         return (
                           <button
                             key={lang}
                             onClick={() => handleOpenEditor(post, lang)}
                             className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold uppercase transition-all group relative ${
                               isActive
                                 ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600 dark:hover:text-white border border-transparent'
                                 : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-gray-600 border-dashed hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400'
                             }`}
                             title={isSource ? 'Source Language' : (hasTranslation ? 'Translation Exists' : 'Missing Translation')}
                           >
                             {lang}
                           </button>
                         )
                       })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedPosts(new Set([post.id]));
                        setTimeout(handleBulkTranslate, 100);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium hover:underline flex items-center justify-end gap-1 w-full"
                    >
                      <Zap className="w-3 h-3" />
                      {t.posts.translateSingle}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditTranslationModal 
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        post={currentEditPost}
        lang={currentEditLang}
        onSave={handleSaveTranslation}
      />
    </div>
  );
};

const Jobs = () => {
  const { t } = useContext(LanguageContext);
  const [jobs, setJobs] = useState<TranslationJob[]>([]);

  useEffect(() => {
    const fetchJobs = () => {
      // Simulate processing cycle
      MockBackend.processJobQueue();
      MockBackend.getJobs().then(setJobs);
    };
    
    fetchJobs();
    const interval = setInterval(fetchJobs, 1000); // Faster polling for demo
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.COMPLETED: return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case TranslationStatus.PROCESSING: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case TranslationStatus.FAILED: return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/20';
    }
  };

  const getIcon = (status: TranslationStatus) => {
    switch (status) {
      case TranslationStatus.COMPLETED: return CheckCircle;
      case TranslationStatus.PROCESSING: return Loader2;
      case TranslationStatus.FAILED: return XCircle;
      default: return Loader2;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.jobs.title}</h2>
      
      <div className="grid gap-4">
        {jobs.length === 0 && (
          <p className="text-gray-500">No active jobs.</p>
        )}
        {jobs.map(job => {
          const Icon = getIcon(job.status);
          return (
            <div key={job.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex items-center justify-between shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${getStatusColor(job.status)}`}>
                  <Icon className={`w-5 h-5 ${job.status === TranslationStatus.PROCESSING ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-medium">{t.jobs.translatePost} #{job.postId}</h4>
                  <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="uppercase">{job.sourceLang}</span>
                    <span>→</span>
                    <span className="uppercase">{job.targetLang}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {job.error && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{job.error}</p>
                  )}
                </div>
              </div>
              
              <div className="w-32">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{t.jobs.progress}</span>
                  <span>{job.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      job.status === TranslationStatus.FAILED ? 'bg-red-500' : 'bg-blue-500'
                    }`} 
                    style={{ width: `${job.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App Shell ---

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <HashRouter>
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
            <Sidebar />
            <main className="ml-72 flex-1 p-8 overflow-y-auto h-screen flex flex-col">
              
              {/* Top Bar / Help Trigger */}
              <div className="flex justify-end mb-4">
                <div className="flex gap-3 items-center">
                   <button 
                    onClick={() => setHelpOpen(true)}
                    className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
                    title="Help / Помощь"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="max-w-6xl mx-auto w-full flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/posts" element={<Posts />} />
                  <Route path="/jobs" element={<Jobs />} />
                </Routes>
              </div>
              
              <Footer />
            </main>
          </div>
          
          <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
        </HashRouter>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
