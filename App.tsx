
import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
  ServerOff,
  AlertOctagon,
  Menu,
  LogOut,
  Lock
} from 'lucide-react';
import { WPSettings, WPPost, TranslationJob, TranslationStatus } from './types';
import { API } from './server/api'; // IMPORT REAL API CLIENT

// --- CONSTANTS ---
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

const TRANSLATIONS = {
  en: {
    nav: { dashboard: 'Dashboard', posts: 'Posts Management', jobs: 'Translation Jobs', settings: 'Configuration' },
    common: { status: 'Status', active: 'Active', model: 'API Model', darkMode: 'Dark Mode', lightMode: 'Light Mode', language: 'Language', save: 'Save', cancel: 'Cancel', loading: 'Loading...', actions: 'Actions', id: 'ID', title: 'Title', type: 'Type', viewEdit: 'Translations (View/Edit)', error: 'Error', demoMode: 'PRODUCTION', noLangs: 'No languages selected' },
    modal: { unsavedChanges: 'Unsaved Changes', unsavedMsg: 'You have unsaved configuration changes. What would you like to do?', saveAndLeave: 'Save & Leave', discard: 'Discard & Leave', keepEditing: 'Keep Editing' },
    dashboard: { title: 'Overview', runScan: 'Run Auto-Scan', totalPosts: 'Total Posts', translated: 'Translated', pending: 'Pending Jobs', tokens: 'Tokens Used', recentActivity: 'Recent Activity', langCoverage: 'Language Coverage', success: 'Success', translatedMsg: 'Translated post to', ago: 'ago', wpConnected: 'WP Connected', wpDisconnected: 'Connect WP', apiConnected: 'API Ready', apiDisconnected: 'Setup API' },
    settings: { title: 'Configuration', wpConnection: 'WordPress Connection', wpUrl: 'WordPress URL', username: 'Admin name', appPassword: 'Admin password', testConnection: 'Test Connection', targetLangs: 'Target Languages', aiEngine: 'Translation Engine (Gemini)', apiKey: 'Gemini API Key', apiKeyPlaceholder: 'Enter your API Key...', apiKeyHelp: 'Required to access the model.', getKeyLink: 'Get your free API Key here', model: 'Model', sysInstruction: 'System Instruction', defaultSysInstruction: 'You are a professional translator. Preserve all HTML tags, classes, and IDs. Do not translate URLs.', geminiFlash: 'Gemini 2.5 Flash (Recommended)', geminiPro: 'Gemini 2.5 Pro (High Reasoning)', saveConfig: 'Save Configuration', saving: 'Saving...', saved: 'Configuration Saved!', polylang: { checking: 'Checking Polylang...', active: 'Polylang Active', missing: 'Polylang Missing', installBtn: 'Install Polylang Auto', installing: 'Installing Polylang...', success: 'Polylang Installed!', fail: 'Installation Failed' } },
    posts: { title: 'Posts Management', translateSelected: 'Translate Selected', allTypes: 'All Post Types', showAll: 'Show All', untranslated: 'Untranslated', translateSingle: 'Translate' },
    jobs: { title: 'Job Queue', progress: 'Progress', translatePost: 'Translate Post' },
    editModal: { editTrans: 'Edit Translation', original: 'Original', postTitle: 'Post Title', origContent: 'Original Content (Read-only)', transContent: 'Translated Content', excerpt: 'Excerpt', saveTrans: 'Save Translation' },
    help: { title: 'Help & Guide', intro: 'Welcome to WP PolyLingo Auto-Translator.', step1: '1. Configuration...', step2: '2. Select Posts...', step3: '3. Translate...', step4: '4. Review...', copyright: 'Perspektiva Impereal © 2025' },
    languages: { en: 'English', sk: 'Slovak', kk: 'Kazakh', cs: 'Czech', mo: 'Moldovan', es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian', pl: 'Polish', hu: 'Hungarian' },
    login: { title: 'Admin Login', subtitle: 'Sign in to manage translations', username: 'Username', password: 'Password', signIn: 'Sign In', error: 'Invalid credentials', logout: 'Logout' }
  },
  ru: {
    nav: { dashboard: 'Дашборд', posts: 'Управление записями', jobs: 'Задачи перевода', settings: 'Настройки' },
    common: { status: 'Статус', active: 'Активен', model: 'Модель API', darkMode: 'Темная тема', lightMode: 'Светлая тема', language: 'Язык', save: 'Сохранить', cancel: 'Отмена', loading: 'Загрузка...', actions: 'Действия', id: 'ID', title: 'Заголовок', type: 'Тип', viewEdit: 'Переводы (Просмотр/Ред.)', error: 'Ошибка', demoMode: 'ПРОДАКШН', noLangs: 'Языки не выбраны' },
    modal: { unsavedChanges: 'Несохраненные изменения', unsavedMsg: 'У вас есть несохраненные изменения в конфигурации. Что вы хотите сделать?', saveAndLeave: 'Сохранить и перейти', discard: 'Не сохранять', keepEditing: 'Продолжить редактирование' },
    dashboard: { title: 'Обзор', runScan: 'Запустить сканирование', totalPosts: 'Всего записей', translated: 'Переведено', pending: 'В очереди', tokens: 'Токенов исп.', recentActivity: 'Недавняя активность', langCoverage: 'Покрытие языков', success: 'Успешно', translatedMsg: 'Переведен пост на', ago: 'назад', wpConnected: 'WP Подключен', wpDisconnected: 'Подключить WP', apiConnected: 'API Готов', apiDisconnected: 'Настроить API' },
    settings: { title: 'Настройки', wpConnection: 'Подключение к WordPress', wpUrl: 'URL сайта WordPress', username: 'Имя администратора', appPassword: 'Пароль администратора', testConnection: 'Проверить', targetLangs: 'Целевые языки', aiEngine: 'Движок перевода (Gemini)', apiKey: 'API Ключ Gemini', apiKeyPlaceholder: 'Введите ваш API ключ...', apiKeyHelp: 'Необходим для доступа к модели.', getKeyLink: 'Получить API ключ здесь', model: 'Модель', sysInstruction: 'Системная инструкция', defaultSysInstruction: 'Вы профессиональный переводчик. Сохраняйте все HTML теги, классы и ID. Не переводите URL-адреса.', geminiFlash: 'Gemini 2.5 Flash (Рекомендуется)', geminiPro: 'Gemini 2.5 Pro (Высокое мышление)', saveConfig: 'Сохранить настройки', saving: 'Сохранение...', saved: 'Настройки сохранены!', polylang: { checking: 'Проверка Polylang...', active: 'Polylang Активен', missing: 'Polylang Не найден', installBtn: 'Установить Polylang', installing: 'Установка Polylang...', success: 'Polylang Установлен!', fail: 'Ошибка установки' } },
    posts: { title: 'Управление записями', translateSelected: 'Перевести выбранное', allTypes: 'Все типы', showAll: 'Показать все', untranslated: 'Непереведенные', translateSingle: 'Перевести' },
    jobs: { title: 'Очередь задач', progress: 'Прогресс', translatePost: 'Перевод записи' },
    editModal: { editTrans: 'Редактировать перевод', original: 'Оригинал', postTitle: 'Заголовок записи', origContent: 'Оригинальный контент (Только чтение)', transContent: 'Переведенный контент', excerpt: 'Отрывок (Excerpt)', saveTrans: 'Сохранить перевод' },
    help: { title: 'Помощь и руководство', intro: 'Добро пожаловать в WP PolyLingo Auto-Translator.', step1: '1. Настройка...', step2: '2. Выбор записей...', step3: '3. Перевод...', step4: '4. Проверка...', copyright: 'Perspektiva Impereal © 2025' },
    languages: { en: 'Английский', sk: 'Словацкий', kk: 'Казахский', cs: 'Чешский', mo: 'Молдавский', es: 'Испанский', fr: 'Французский', de: 'Немецкий', ru: 'Русский', pl: 'Польский', hu: 'Венгерский' },
    login: { title: 'Вход администратора', subtitle: 'Войдите для управления переводами', username: 'Имя пользователя', password: 'Пароль', signIn: 'Войти', error: 'Неверные данные', logout: 'Выйти' }
  }
};

// --- Contexts ---

const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {}
});

const LanguageContext = createContext({
  lang: 'en',
  setLang: (lang: 'en' | 'ru') => {},
  t: TRANSLATIONS.en
});

const NavigationBlockerContext = createContext({
  isDirty: false,
  setIsDirty: (dirty: boolean) => {},
  attemptNavigation: (path: string) => {},
  registerSaveHandler: (handler: () => Promise<void>) => {},
});

const AuthContext = createContext({
  isAuthenticated: false,
  login: (u: string, p: string) => Promise.resolve(false),
  logout: () => {},
});

// --- Components ---

const Login = () => {
  const { t } = useContext(LanguageContext);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError(t.login.error);
      }
    } catch (e) {
      setError(t.login.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <Crown className="w-16 h-16 text-gold-500 mb-4 drop-shadow-md" />
          <h1 className="font-serif font-bold text-2xl text-gray-900 dark:text-white tracking-wide text-center">
            PERSPEKTIVA <span className="block text-gold-600 dark:text-gold-500 text-xl">IMPEREAL</span>
          </h1>
          <p className="text-sm text-gray-500 mt-4 text-center">{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.login.username}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-5 h-5 text-gray-400 flex items-center justify-center font-bold">@</div>
              </div>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.login.password}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {t.login.signIn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ... (UnsavedChangesModal, StatCard, HelpModal, Footer remain unchanged, re-declaring for scope)
const UnsavedChangesModal = ({ isOpen, onClose, onDiscard }: { isOpen: boolean; onClose: () => void; onDiscard: () => void; }) => { const { t } = useContext(LanguageContext); if (!isOpen) return null; return ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"> <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 relative"> <div className="flex items-center gap-3 mb-4 text-orange-600 dark:text-orange-400"> <AlertOctagon className="w-8 h-8" /> <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.modal.unsavedChanges}</h3> </div> <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"> {t.modal.unsavedMsg} </p> <div className="flex flex-col gap-3"> <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"> <Edit3 className="w-4 h-4" /> {t.modal.keepEditing} </button> <button onClick={onDiscard} className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors"> {t.modal.discard} </button> </div> </div> </div> ); };
const StatCard = ({ label, value, icon: Icon, color }: any) => (<div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden transition-colors duration-200"><div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}><Icon className="w-24 h-24" /></div><div className="relative z-10"><p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p><h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3></div></div>);
const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => { const { t } = useContext(LanguageContext); if (!isOpen) return null; return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"><div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 relative"><button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button><div className="flex flex-col items-center text-center mb-6"><div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3"><Info className="w-6 h-6" /></div><h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.help.title}</h3></div><div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed"><p>{t.help.intro}</p><ul className="space-y-2 text-left bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700"><li>{t.help.step1}</li><li>{t.help.step2}</li><li>{t.help.step3}</li><li>{t.help.step4}</li></ul></div><div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center"><button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors w-full">OK</button></div></div></div>); };
const Footer = () => (<footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700 text-center"><div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"><span>&copy; {new Date().getFullYear()}</span><a href="https://czholding.com.ua/" target="_blank" rel="noopener noreferrer" className="text-gold-600 dark:text-gold-500 hover:underline inline-flex items-center gap-1 font-medium">Perspektiva Impereal</a><span>. All rights reserved.</span></div></footer>);

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { lang, setLang, t } = useContext(LanguageContext);
  const { attemptNavigation } = useContext(NavigationBlockerContext);
  const { logout } = useContext(AuthContext);

  const navItems = [
    { path: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { path: '/posts', label: t.nav.posts, icon: FileText },
    { path: '/jobs', label: t.nav.jobs, icon: Activity },
    { path: '/settings', label: t.nav.settings, icon: SettingsIcon },
  ];

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onClose(); 
    if (location.pathname !== path) {
      attemptNavigation(path);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`fixed top-0 left-0 h-screen w-72 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col items-center text-center border-b border-gray-200 dark:border-gray-700 relative">
          <button onClick={onClose} className="absolute top-4 right-4 lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-6 h-6" /></button>
          <Crown className="w-12 h-12 text-gold-500 mb-3 drop-shadow-sm" />
          <h1 className="font-serif font-bold text-xl tracking-wider text-gray-900 dark:text-white leading-tight">PERSPEKTIVA<span className="block text-gold-600 dark:text-gold-500">IMPEREAL</span></h1>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">PolyLingo Translator</span>
          <div className="mt-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded font-mono font-bold flex items-center gap-1"><Server className="w-3 h-3" /> {t.common.demoMode}</div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (<a key={item.path} href={item.path} onClick={(e) => handleNavClick(e, item.path)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}`}><Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></a>);
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium mb-2"><LogOut className="w-4 h-4" />{t.login.logout}</button>
          <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 text-sm font-medium"><Globe className="w-4 h-4" />{lang === 'en' ? 'English' : 'Русский'}</div>
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-md p-1"><button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>EN</button><button onClick={() => setLang('ru')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'ru' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500'}`}>RU</button></div>
          </div>
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">{isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-500" />}{isDarkMode ? t.common.darkMode : t.common.lightMode}</div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'left-4.5 translate-x-4' : 'left-0.5'}`}></div></div>
          </button>
        </div>
      </aside>
    </>
  );
};

const Dashboard = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [checks, setChecks] = useState({ wp: false, api: false });

  useEffect(() => {
    API.getSettings().then(s => {
        setChecks({
            wp: !!s.wpUrl && s.wpUrl.includes('http'),
            api: !!s.geminiApiKey
        });
    }).catch(() => setChecks({ wp: false, api: false }));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h2><div className="flex items-center gap-3"><button onClick={() => navigate('/settings')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${checks.wp ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/30'}`}>{checks.wp ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}{checks.wp ? t.dashboard.wpConnected : t.dashboard.wpDisconnected}</button><button onClick={() => navigate('/settings', { state: { scrollTo: 'api-key-section' } })} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${checks.api ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-default' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/30'}`}>{checks.api ? <Server className="w-4 h-4" /> : <ServerOff className="w-4 h-4" />}{checks.api ? t.dashboard.apiConnected : t.dashboard.apiDisconnected}</button><button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md ml-2"><Zap className="w-4 h-4" /><span>{t.dashboard.runScan}</span></button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><StatCard label={t.dashboard.totalPosts} value="-" icon={FileText} color="text-blue-500" /><StatCard label={t.dashboard.translated} value="-" icon={Languages} color="text-green-500" /><StatCard label={t.dashboard.pending} value="-" icon={Loader2} color="text-yellow-500" /><StatCard label={t.dashboard.tokens} value="-" icon={Activity} color="text-purple-500" /></div>
    </div>
  );
};

const Settings = () => {
  const { t } = useContext(LanguageContext);
  const { setIsDirty, registerSaveHandler } = useContext(NavigationBlockerContext);
  const location = useLocation();

  const [originalSettings, setOriginalSettings] = useState<WPSettings | null>(null);
  const [settings, setSettings] = useState<WPSettings>({ wpUrl: '', wpUser: '', wpAppPassword: '', sourceLang: 'en', targetLangs: [], postTypes: [], geminiApiKey: '', systemInstruction: '' });
  const [polylangStatus, setPolylangStatus] = useState<'idle' | 'checking' | 'active' | 'missing' | 'installing'>('idle');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    API.getSettings().then(data => {
      const safeData = { ...data, targetLangs: Array.isArray(data.targetLangs) ? data.targetLangs : [] };
      setSettings(safeData);
      setOriginalSettings(safeData);
    }).catch(err => console.error("Failed to load settings", err));
    API.checkPolylang().then(active => { if (active) setPolylangStatus('active'); else setPolylangStatus('missing'); }).catch(() => setPolylangStatus('missing'));
  }, []);

  useEffect(() => { if (originalSettings) { const isChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings); setIsDirty(isChanged); } }, [settings, originalSettings, setIsDirty]);
  useEffect(() => { registerSaveHandler(async () => { await handleSaveSettings(); }); }, [settings]);
  useEffect(() => { const state = location.state as { scrollTo?: string } | null; if (state?.scrollTo) { const element = document.getElementById(state.scrollTo); if (element) setTimeout(() => { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-gray-800'); setTimeout(() => element.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2', 'dark:ring-offset-gray-800'), 1500); }, 300); } }, [location]);
  const handleChange = (field: keyof WPSettings, value: any) => { setSettings(prev => ({ ...prev, [field]: value })); setSaveState('idle'); };
  const toggleLanguage = (code: string) => { setSettings(prev => { const current = Array.isArray(prev.targetLangs) ? prev.targetLangs : []; return current.includes(code) ? { ...prev, targetLangs: current.filter(c => c !== code) } : { ...prev, targetLangs: [...current, code] }; }); };
  const handleSaveSettings = async () => { setSaveState('saving'); await API.saveSettings(settings); setOriginalSettings(settings); setIsDirty(false); setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000); };
  const handleTestConnection = async () => { setPolylangStatus('checking'); try { const valid = await API.validateConnection(settings); if (valid) { const installed = await API.checkPolylang(); setPolylangStatus(installed ? 'active' : 'missing'); } else { alert("Connection failed!"); setPolylangStatus('idle'); } } catch (e) { alert("Connection error"); setPolylangStatus('idle'); } };
  const handleInstallPolylang = async () => { setPolylangStatus('installing'); await API.installPolylang(); setPolylangStatus('active'); };

  return (<div className="max-w-4xl"><div className="flex items-center justify-between mb-8"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h2>{JSON.stringify(settings) !== JSON.stringify(originalSettings) && (<span className="text-sm text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/20 px-3 py-1 rounded-full animate-pulse flex items-center gap-1"><AlertOctagon className="w-3 h-3" />Unsaved Changes</span>)}</div><div className="grid gap-8"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200"><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">WP</div>{t.settings.wpConnection}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.wpUrl}</label><input type="text" value={settings.wpUrl} onChange={(e) => handleChange('wpUrl', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" placeholder="https://your-site.com" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.username}</label><input type="text" value={settings.wpUser} onChange={(e) => handleChange('wpUser', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" placeholder="e.g. admin" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.appPassword}</label><div className="relative"><input type={showPassword ? "text" : "password"} value={settings.wpAppPassword} onChange={(e) => handleChange('wpAppPassword', e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors pr-10" placeholder="xxxx-xxxx-xxxx-xxxx" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div></div><div className="mt-6 flex flex-col md:flex-row justify-end items-center gap-4">{polylangStatus !== 'idle' && (<div className="flex items-center gap-3 animate-in fade-in duration-300">{polylangStatus === 'checking' && (<span className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t.settings.polylang.checking}</span>)}{polylangStatus === 'active' && (<span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800"><CheckCircle className="w-4 h-4" />{t.settings.polylang.active}</span>)}{polylangStatus === 'missing' && (<div className="flex items-center gap-3"><span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full border border-yellow-200 dark:border-yellow-800"><AlertTriangle className="w-4 h-4" />{t.settings.polylang.missing}</span><button onClick={handleInstallPolylang} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"><DownloadCloud className="w-4 h-4" />{t.settings.polylang.installBtn}</button></div>)}{polylangStatus === 'installing' && (<span className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 rounded-full"><Loader2 className="w-4 h-4 animate-spin" />{t.settings.polylang.installing}</span>)}</div>)}<button onClick={handleTestConnection} disabled={polylangStatus === 'checking' || polylangStatus === 'installing'} className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium">{t.settings.testConnection}</button></div></div><div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200"><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400"><Languages className="w-5 h-5" /></div>{t.settings.targetLangs}</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{LANGUAGES_CONFIG.map(lang => (<button key={lang.code} onClick={() => toggleLanguage(lang.code)} className={`flex items-center gap-3 p-3 rounded-lg border transition-all relative overflow-hidden ${settings.targetLangs && settings.targetLangs.includes(lang.code) ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${settings.targetLangs && settings.targetLangs.includes(lang.code) ? 'border-white bg-white/20' : 'border-gray-400 dark:border-gray-600'}`}>{settings.targetLangs && settings.targetLangs.includes(lang.code) && <Check className="w-3 h-3 text-white" />}</div><img src={`https://flagcdn.com/24x18/${lang.country}.png`} srcSet={`https://flagcdn.com/48x36/${lang.country}.png 2x`} width="24" height="18" alt={lang.name} className="mr-1 rounded-sm shadow-sm flex-shrink-0" /><span className="font-medium text-sm truncate">{(t.languages as any)[lang.code] || lang.name}</span></button>))}</div></div><div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200"><h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">AI</div>{t.settings.aiEngine}</h3><div className="space-y-6"><div id="api-key-section" className="transition-all duration-300 rounded-lg"><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.apiKey}</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Key className="h-5 w-5 text-gray-400" /></div><input type="password" value={settings.geminiApiKey || ''} onChange={(e) => handleChange('geminiApiKey', e.target.value)} className="w-full pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors" placeholder={t.settings.apiKeyPlaceholder} /></div><div className="mt-2 flex items-center gap-2 text-xs"><span className="text-gray-500 dark:text-gray-400">{t.settings.apiKeyHelp}</span><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium">{t.settings.getKeyLink} <Globe className="w-3 h-3" /></a></div></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.model}</label><select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"><option value="gemini-2.5-flash">{t.settings.geminiFlash}</option><option value="gemini-2.5-pro">{t.settings.geminiPro}</option></select></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.settings.sysInstruction}</label><textarea className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors" value={settings.systemInstruction || ''} onChange={(e) => handleChange('systemInstruction', e.target.value)} placeholder={t.settings.defaultSysInstruction}></textarea></div></div></div><div className="flex justify-end pt-4"><button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all flex items-center gap-2">{saveState === 'saving' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}{saveState === 'saved' ? t.settings.saved : (saveState === 'saving' ? t.settings.saving : t.settings.saveConfig)}</button></div></div></div>); };

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: WPPost | null;
  lang: string;
  onSave: (postId: number, lang: string, data: any) => void;
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
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.origContent}</label>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 overflow-y-auto text-gray-500 dark:text-gray-400 text-sm font-mono">{post.content.rendered}</div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.editModal.transContent}</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="flex-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">{t.editModal.excerpt}</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} rows={3} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" />
              </div>
            </>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">{t.common.cancel}</button>
          <button onClick={() => onSave(post.id, lang, formData)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all flex items-center gap-2">
            <Save className="w-4 h-4" />
            {t.editModal.saveTrans}
          </button>
        </div>
      </div>
    </div>
  );
};

const Posts = () => { const { t } = useContext(LanguageContext); const [posts, setPosts] = useState<WPPost[]>([]); const [isLoading, setIsLoading] = useState(true); const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set<number>()); const [editModalOpen, setEditModalOpen] = useState(false); const [currentEditPost, setCurrentEditPost] = useState<WPPost | null>(null); const [currentEditLang, setCurrentEditLang] = useState(''); const [targetLangs, setTargetLangs] = useState<string[]>(() => { return []; }); useEffect(() => { API.getPosts().then(p => { setPosts(p); setIsLoading(false); }).catch(() => setIsLoading(false)); API.getSettings().then(s => { if (Array.isArray(s.targetLangs)) setTargetLangs(s.targetLangs); }).catch(() => {}); }, []); const handleSelectAll = () => { setSelectedPosts(selectedPosts.size === posts.length ? new Set() : new Set(posts.map(p => p.id))); }; const handleSelectPost = (id: number) => { const newSelected = new Set(selectedPosts); if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id); setSelectedPosts(newSelected); }; const handleBulkTranslate = async () => { if (selectedPosts.size === 0) return; const postIds = Array.from(selectedPosts); await API.createJobs(postIds, targetLangs); alert(`Job started for ${postIds.length} posts! Check Jobs tab.`); setSelectedPosts(new Set()); }; const handleOpenEditor = (post: WPPost, lang: string) => { setCurrentEditPost(post); setCurrentEditLang(lang); setEditModalOpen(true); }; const handleSaveTranslation = (postId: number, lang: string, data: any) => { console.log("Saving", { postId, lang, data }); setEditModalOpen(false); }; return (<div className="space-y-6 relative"><div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.posts.title}</h2><div className="flex gap-2 items-center">{selectedPosts.size > 0 && (<button onClick={handleBulkTranslate} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 animate-in fade-in slide-in-from-right-4 duration-300"><Zap className="w-4 h-4" />{t.posts.translateSelected} ({selectedPosts.size})</button>)}<select className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"><option>{t.posts.allTypes}</option><option>Post</option><option>Page</option></select><select className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"><option>{t.posts.showAll}</option><option>{t.posts.untranslated}</option></select></div></div><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-200 overflow-x-auto"><table className="w-full text-left border-collapse"><thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold"><tr><th className="px-6 py-4 w-10 text-center"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={posts.length > 0 && selectedPosts.size === posts.length} onChange={handleSelectAll} /></th><th className="px-6 py-4 w-16">{t.common.id}</th><th className="px-6 py-4">{t.common.title}</th><th className="px-6 py-4 w-24">{t.common.type}</th><th className="px-6 py-4">{t.common.viewEdit}</th><th className="px-6 py-4 text-right">{t.common.actions}</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{isLoading ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />{t.common.loading}</td></tr>) : posts.length === 0 ? (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No posts found. Check configuration.</td></tr>) : posts.map(post => { const isSelected = selectedPosts.has(post.id); return (<tr key={post.id} className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}><td className="px-6 py-4 text-center"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={isSelected} onChange={() => handleSelectPost(post.id)} /></td><td className="px-6 py-4 text-gray-500 dark:text-gray-500">#{post.id}</td><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{post.title.rendered}<div className="text-xs text-gray-500 mt-1">{post.slug}</div></td><td className="px-6 py-4"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs uppercase">{post.type}</span></td><td className="px-6 py-4"><div className="flex gap-2 flex-wrap">{targetLangs.length === 0 && (<span className="text-xs text-gray-400 italic flex items-center h-8">{t.common.noLangs}</span>)}{targetLangs.map(lang => { const hasTranslation = post.translations && post.translations[lang]; const isSource = post.lang === lang; const isActive = hasTranslation || isSource; return (<button key={lang} onClick={() => handleOpenEditor(post, lang)} className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold uppercase transition-all group relative ${isActive ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600 dark:hover:text-white border border-transparent' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-gray-600 border-dashed hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400'}`} title={isSource ? 'Source Language' : (hasTranslation ? 'Translation Exists' : 'Missing Translation')}>{lang}</button>) })}</div></td><td className="px-6 py-4 text-right"><button onClick={() => { setSelectedPosts(new Set([post.id])); setTimeout(handleBulkTranslate, 100); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium hover:underline flex items-center justify-end gap-1 w-full"><Zap className="w-3 h-3" />{t.posts.translateSingle}</button></td></tr>); })}</tbody></table></div><EditTranslationModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} post={currentEditPost} lang={currentEditLang} onSave={handleSaveTranslation} /></div>); };
const Jobs = () => { const { t } = useContext(LanguageContext); const [jobs, setJobs] = useState<TranslationJob[]>([]); useEffect(() => { const interval = setInterval(() => { API.getJobs().then(setJobs).catch(() => {}); }, 2000); return () => clearInterval(interval); }, []); return (<div><h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t.jobs.title}</h2><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-200 overflow-x-auto"><table className="w-full text-left border-collapse"><thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold"><tr><th className="px-6 py-4">Job ID</th><th className="px-6 py-4">Task</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 w-1/3">Progress</th><th className="px-6 py-4 text-right">Time</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{jobs.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No active jobs.</td></tr>) : jobs.map(job => (<tr key={job.id}><td className="px-6 py-4 font-mono text-xs text-gray-500">{job.id.substring(0,8)}...</td><td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{job.title || `Job ${job.id}`}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${job.status === TranslationStatus.COMPLETED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : job.status === TranslationStatus.PROCESSING ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{job.status}</span></td><td className="px-6 py-4"><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${job.progress}%` }}></div></div></td><td className="px-6 py-4 text-right text-sm text-gray-500">{new Date(job.createdAt).toLocaleTimeString()}</td></tr>))}</tbody></table></div></div>); };

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppLayout = () => {
  const { t } = useContext(LanguageContext);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDirty, setIsDirty, attemptNavigation } = useContext(NavigationBlockerContext);
  const navigate = useNavigate();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleAttemptNavigation = (path: string) => {
    if (isDirty) {
      setPendingPath(path);
      setShowUnsavedModal(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="flex-1 lg:ml-72 p-4 md:p-8 overflow-y-auto h-screen flex flex-col w-full transition-all duration-300">
        <div className="flex justify-between lg:justify-end mb-4">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <button onClick={() => setHelpOpen(true)} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md" title="Help">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="max-w-6xl mx-auto w-full flex-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </main>
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
};

const NavigationBlockerWrapper = () => {
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const navigate = useNavigate();

  const attemptNavigation = (path: string) => {
    if (isDirty) {
        setPendingPath(path);
        setShowUnsavedModal(true);
    } else {
        navigate(path);
    }
  };

  const handleDiscard = () => {
    setIsDirty(false);
    setShowUnsavedModal(false);
    if (pendingPath) navigate(pendingPath);
  };

  return (
    <NavigationBlockerContext.Provider value={{ isDirty, setIsDirty, attemptNavigation, registerSaveHandler: () => {} }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      <UnsavedChangesModal isOpen={showUnsavedModal} onClose={() => setShowUnsavedModal(false)} onDiscard={handleDiscard} />
    </NavigationBlockerContext.Provider>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState<'en' | 'ru'>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const login = async (u: string, p: string) => {
    try {
      const success = await API.login(u, p);
      if (success) setIsAuthenticated(true);
      return success;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
          <HashRouter>
             <NavigationBlockerWrapper />
          </HashRouter>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
