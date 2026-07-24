import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  X,
  Search,
  LogIn,
  Info,
  ChevronDown,
  ArrowRight,
  Clipboard,
  Check,
  User,
  Wallet,
  Users,
  Award,
  TrendingUp,
  CircleDollarSign,
  BookOpen,
  Home,
  LogOut,
  ChevronUp,
  History
} from 'lucide-react';

import { Logo } from './components/Logo';
import { Toast, ToastType } from './components/Toast';
import { WalletModal } from './components/WalletModal';
import { MatrixPlan } from './components/MatrixPlan';
import { NetworkTreeView } from './components/NetworkTreeView';
import { Sandbox } from './components/Sandbox';
import { User as UserType, Language, SystemStats, HistoryRecord } from './types';
import { translations } from './translations';
import { isWeb3Installed, connectWeb3Wallet, executeWeb3Purchase, setupWeb3Listeners, getChainName } from './lib/web3';

// Default initial state
const INITIAL_STATS: SystemStats = {
  totalAccounts: 1,
  totalUsdtInvested: 5
};

const PLAN_PRICES: Record<string, number> = {
  '1': 5,
  '2': 10,
  '3': 20,
  '4': 40,
  '5': 80,
  '6': 160,
  '7': 320,
  '8': 640,
  '9': 1280,
  '10': 2560,
  '11': 5120,
  '12': 10240
};

const INITIAL_USERS: Record<number, UserType> = {
  1: {
    id: 1,
    walletAddress: '0x7a8e27c15e8df1569ca493e8e19c3b0380c10001',
    referrerId: null,
    downlinesCount: 0,
    totalIncome: 0,
    planLevel: 1,
    plans: {
      '1': { active: true, matrix: [false, false, false, false] },
      ...Object.keys(PLAN_PRICES).slice(1).reduce((acc, key) => {
        acc[key] = { active: false, matrix: [false, false, false, false] };
        return acc;
      }, {} as any)
    }
  }
};

const historyTranslations: Record<Language, {
  historyTitle: string;
  rankCol: string;
  costCol: string;
  typeCol: string;
  hashCol: string;
  timeCol: string;
  noHistory: string;
  registerType: string;
  buyType: string;
  autoupType: string;
  toggleShow: string;
  toggleHide: string;
}> = {
  TH: {
    historyTitle: 'ประวัติการสมัครแต่ละแผน',
    rankCol: 'แผน (Rank)',
    costCol: 'ค่าใช้จ่าย',
    typeCol: 'ประเภท',
    hashCol: 'แฮชธุรกรรม (Tx Hash)',
    timeCol: 'วันที่/เวลา',
    noHistory: 'ไม่พบประวัติการสมัครในบัญชีนี้',
    registerType: 'เปิดใช้งานตอนสมัคร',
    buyType: 'ซื้อด้วยตนเอง',
    autoupType: 'อัปเกรดอัตโนมัติ (Auto Up)',
    toggleShow: 'แสดงประวัติการสมัคร',
    toggleHide: 'ซ่อนประวัติการสมัคร',
  },
  EN: {
    historyTitle: 'Plan Subscription History',
    rankCol: 'Plan (Rank)',
    costCol: 'Cost',
    typeCol: 'Type',
    hashCol: 'Tx Hash',
    timeCol: 'Date/Time',
    noHistory: 'No subscription history found for this account',
    registerType: 'Registration Activation',
    buyType: 'Manual Buy',
    autoupType: 'Auto Upgrade (Auto Up)',
    toggleShow: 'Show Subscription History',
    toggleHide: 'Hide Subscription History',
  },
  ZH: {
    historyTitle: '计划认购历史',
    rankCol: '计划级别',
    costCol: '费用',
    typeCol: '类型',
    hashCol: '交易哈希',
    timeCol: '日期/时间',
    noHistory: '未找到此账户的认购历史',
    registerType: '注册激活',
    buyType: '手动购买',
    autoupType: '自动升级',
    toggleShow: '显示认购历史',
    toggleHide: '隐藏认购历史',
  },
  HI: {
    historyTitle: 'योजना सदस्यता इतिहास',
    rankCol: 'योजना (Rank)',
    costCol: 'लागत',
    typeCol: 'प्रकार',
    hashCol: 'Tx Hash',
    timeCol: 'दिनांक/समय',
    noHistory: 'इस खाते के लिए कोई सदस्यता इतिहास नहीं मिला',
    registerType: 'पंजीकरण सक्रियण',
    buyType: 'मैनुअल खरीद',
    autoupType: 'ऑटो अपग्रेड (Auto Up)',
    toggleShow: 'सदस्यता इतिहास दिखाएं',
    toggleHide: 'सदस्यता इतिहास छुपाएं',
  },
  VI: {
    historyTitle: 'Lịch sử đăng ký gói',
    rankCol: 'Gói (Rank)',
    costCol: 'Chi phí',
    typeCol: 'Loại',
    hashCol: 'Mã giao dịch (Tx Hash)',
    timeCol: 'Ngày/Giờ',
    noHistory: 'Không tìm thấy lịch sử đăng ký cho tài khoản này',
    registerType: 'Kích hoạt khi đăng ký',
    buyType: 'Mua thủ công',
    autoupType: 'Tự động nâng cấp (Auto Up)',
    toggleShow: 'Hiển thị lịch sử đăng ký',
    toggleHide: 'Ẩn lịch sử đăng ký',
  },
  MY: {
    historyTitle: 'အစီအစဉ်ဝယ်ယူမှုမှတ်တမ်း',
    rankCol: 'အဆင့် (Rank)',
    costCol: 'ကုန်ကျစရိတ်',
    typeCol: 'အမျိုးအစား',
    hashCol: 'လွှဲပြောင်းမှုကုဒ်',
    timeCol: 'ရက်စွဲ/အချိန်',
    noHistory: 'ဤအကောင့်အတွက် ဝယ်ယူမှုမှတ်တမ်းမရှိပါ',
    registerType: 'မှတ်ပုံတင်စဉ်အသက်သွင်းခြင်း',
    buyType: 'ကိုယ်တိုင်ဝယ်ယူခြင်း',
    autoupType: 'အလိုအလျောက်အဆင့်မြှင့်ခြင်း',
    toggleShow: 'ဝယ်ယူမှုမှတ်တမ်းပြရန်',
    toggleHide: 'ဝယ်ယူမှုမှတ်တမ်းဝှက်ရန်',
  },
  MS: {
    historyTitle: 'Sejarah Langganan Pelan',
    rankCol: 'Pelan (Rank)',
    costCol: 'Kos',
    typeCol: 'Jenis',
    hashCol: 'Tx Hash',
    timeCol: 'Tarikh/Masa',
    noHistory: 'Tiada sejarah langganan ditemui untuk akaun ini',
    registerType: 'Pengaktifan Pendaftaran',
    buyType: 'Beli Manual',
    autoupType: 'Naik Taraf Auto (Auto Up)',
    toggleShow: 'Tunjukkan Sejarah Langganan',
    toggleHide: 'Sembunyikan Sejarah Langganan',
  },
  KM: {
    historyTitle: 'ប្រវត្តិនៃការជាវផែនការ',
    rankCol: 'ផែនការ (Rank)',
    costCol: 'តម្លៃ',
    typeCol: 'ប្រភេទ',
    hashCol: 'Tx Hash',
    timeCol: 'កាលបរិច្ឆេទ/ម៉ោង',
    noHistory: 'រកមិនឃើញប្រវត្តិនៃការជាវសម្រាប់គណនីនេះទេ',
    registerType: 'ការធ្វើឱ្យសកម្មការចុះឈ្មោះ',
    buyType: 'ទិញដោយដៃ',
    autoupType: 'ការធ្វើឱ្យប្រសើរឡើងស្វ័យប្រវត្ត',
    toggleShow: 'បង្ហាញប្រវត្តិនៃការជាវ',
    toggleHide: 'លាក់ប្រវត្តិនៃការជាវ',
  }
};

const rankDirectoryTranslations: Record<Language, {
  title: string;
  subtitle: string;
  toggleShow: string;
  toggleHide: string;
  totalSubscribers: string;
  noMembers: string;
  activeStatus: string;
  clickToSearch: string;
  filterAll?: string;
  filterDownline?: string;
  filterCustom?: string;
  searchPlaceholder?: string;
  showingAll?: string;
  showingDownlineOf?: string;
  noMembersInDownline?: string;
  viewAllText?: string;
}> = {
  TH: {
    title: 'ทำเนียบสมาชิกในแต่ละแผน (Rank Directory)',
    subtitle: 'ตรวจสอบรายชื่อผู้ใช้งานและ ID สมาชิกที่ได้เปิดใช้งานในแต่ละระดับ (Rank 1 - 12) ทั้งหมดที่ต่อสายงาน',
    toggleShow: 'แสดงรายชื่อสมาชิกแต่ละแผน',
    toggleHide: 'ซ่อนรายชื่อสมาชิกแต่ละแผน',
    totalSubscribers: 'จำนวนสมาชิกเปิดใช้งาน',
    noMembers: 'ยังไม่มี ID สมาชิกที่เปิดใช้งานแผนนี้ในระบบ/สายงานนี้',
    activeStatus: 'เปิดใช้งานแล้ว',
    clickToSearch: 'คลิกที่ ID เพื่อดูโครงสร้างบอร์ดเมทริกซ์และประวัติของสมาชิกรายนี้',
    filterAll: 'ทั้งหมดในระบบ',
    filterDownline: 'เฉพาะสายงานของ ID {id}',
    filterCustom: 'สายงานของ ID อื่นๆ',
    searchPlaceholder: 'กรอก ID เพื่อตรวจสอบสายงาน...',
    showingAll: 'กำลังแสดงรายชื่อสมาชิกทั้งหมดในระบบ',
    showingDownlineOf: 'กำลังแสดงรายชื่อสมาชิกภายใต้สายงานของ ID {id}',
    noMembersInDownline: 'ไม่พบ ID สมาชิกในสายงานของ ID {id} ที่เปิดใช้งาน Rank นี้',
    viewAllText: 'ดูสายงานทั้งหมด',
  },
  EN: {
    title: 'Member Directory by Rank',
    subtitle: 'Explore which User IDs have activated each specific plan (Rank 1 - 12) in the downline network',
    toggleShow: 'Show Member Directory',
    toggleHide: 'Hide Member Directory',
    totalSubscribers: 'Activated Members',
    noMembers: 'No User IDs have activated this Rank yet in this scope',
    activeStatus: 'Active',
    clickToSearch: 'Click ID to switch view and explore this member\'s board structure',
    filterAll: 'All in System',
    filterDownline: 'Downline of ID {id}',
    filterCustom: 'Downline of other ID',
    searchPlaceholder: 'Enter ID to view downline...',
    showingAll: 'Showing all registered members across the network',
    showingDownlineOf: 'Showing downline members under ID {id}',
    noMembersInDownline: 'No members under ID {id}\'s network have activated this Rank',
    viewAllText: 'View Entire Network',
  },
  ZH: {
    title: '各级别会员目录 (Rank Directory)',
    subtitle: '查看全网中激活了各个特定计划 (Rank 1 - 12) 的用户 ID 列表',
    toggleShow: '显示会员目录',
    toggleHide: '隐藏会员目录',
    totalSubscribers: '激活会员数',
    noMembers: '目前尚未有用户 ID 激活此级别',
    activeStatus: '已激活',
    clickToSearch: '点击 ID 切换视图并探索该会员的网格结构',
  },
  HI: {
    title: 'रैंक के अनुसार सदस्य निर्देशिका (Rank Directory)',
    subtitle: 'पता लगाएं कि पूरे नेटवर्क में किन उपयोगकर्ता आईडी ने प्रत्येक विशिष्ट योजना (Rank 1 - 12) को सक्रिय किया है',
    toggleShow: 'सदस्य निर्देशिका दिखाएं',
    toggleHide: 'सदस्य निर्देशिका छुपाएं',
    totalSubscribers: 'सक्रिय सदस्य संख्या',
    noMembers: 'इस रैंक में अभी तक किसी उपयोगकर्ता आईडी ने सक्रियता नहीं दिखाई है',
    activeStatus: 'सक्रिय',
    clickToSearch: 'इस सदस्य की बोर्ड संरचना देखने और उस पर जाने के लिए आईडी पर क्लिक करें',
  },
  VI: {
    title: 'Danh bạ thành viên theo Rank (Rank Directory)',
    subtitle: 'Khám phá xem những ID người dùng nào đã kích hoạt từng gói cụ thể (Rank 1 - 12) trên toàn hệ thống',
    toggleShow: 'Hiển thị danh bạ thành viên',
    toggleHide: 'Ẩn danh bạ thành viên',
    totalSubscribers: 'Thành viên đã kích hoạt',
    noMembers: 'Chưa có ID người dùng nào kích hoạt Rank này',
    activeStatus: 'Đang hoạt động',
    clickToSearch: 'Nhấp vào ID để chuyển đổi và kiểm tra cấu trúc bảng của thành viên này',
  },
  MY: {
    title: 'အဆင့်အလိုက် အဖွဲ့ဝင်များစာရင်း (Rank Directory)',
    subtitle: 'ကွန်ရက်တစ်ခုလုံးတွင် မည်သည့်အသုံးပြုသူ ID များသည် အစီအစဉ်တစ်ခုချင်းစီ (Rank 1 - 12) ကို အသက်သွင်းထားသည်ကို ရှာဖွေစူးစမ်းပါ',
    toggleShow: 'အဖွဲ့ဝင်များစာရင်းပြရန်',
    toggleHide: 'အဖွဲ့ဝင်များစာရင်းဝှက်ရန်',
    totalSubscribers: 'အသက်သွင်းထားသောအဖွဲ့ဝင်များ',
    noMembers: 'ဤအဆင့်သို့ အသက်သွင်းထားသော အသုံးပြုသူ ID မရှိသေးပါ',
    activeStatus: 'အသုံးပြုနေဆဲ',
    clickToSearch: 'ဤအဖွဲ့ဝင်၏ ဘုတ်တည်ဆောက်ပုံကို ကြည့်ရန် ID ကို နှိပ်ပါ',
  },
  MS: {
    title: 'Direktori Ahli mengikut Rank (Rank Directory)',
    subtitle: 'Semak ID Pengguna mana yang telah mengaktifkan setiap pelan khusus (Rank 1 - 12) di seluruh rangkaian',
    toggleShow: 'Tunjukkan Direktori Ahli',
    toggleHide: 'Sembunyikan Direktori Ahli',
    totalSubscribers: 'Ahli yang Mengaktifkan',
    noMembers: 'Belum ada ID Pengguna yang mengaktifkan pangkat ini',
    activeStatus: 'Aktif',
    clickToSearch: 'Klik ID untuk menukar paparan dan meneroka struktur papan ahli ini',
  },
  KM: {
    title: 'ថតសមាជិកតាម Rank (Rank Directory)',
    subtitle: 'រុករកថាតើ ID អ្នកប្រើប្រាស់ណាខ្លះដែលបានដំណើរការផែនការជាក់លាក់នីមួយៗ (Rank 1 - 12) នៅទូទាំងបណ្តាញ',
    toggleShow: 'បង្ហាញថតសមាជិក',
    toggleHide: 'លាក់ថតសមាជិក',
    totalSubscribers: 'សមាជិកដែលបានដំណើរការ',
    noMembers: 'មិនទាន់មាន ID អ្នកប្រើប្រាស់ណាបានដំណើរការចំណាត់ថ្នាក់នេះនៅឡើយទេ',
    activeStatus: 'សកម្ម',
    clickToSearch: 'ចុច ID ដើម្បីប្តូរการមើល និងរុករករចនាសម្ព័ន្ធក្តាររបស់សមាជិកនេះ',
  }
};

export default function App() {
  // Database State
  const [users, setUsers] = useState<Record<number, UserType>>(() => {
    try {
      const saved = localStorage.getItem('vmines_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // If the cached database contains old accounts or size-6 matrixes, reset to initial
          let isStale = false;
          Object.values(parsed).forEach((usr: any) => {
            if (usr && usr.plans) {
              Object.values(usr.plans).forEach((pl: any) => {
                if (pl && Array.isArray(pl.matrix) && pl.matrix.length !== 4) {
                  isStale = true;
                }
              });
            }
          });
          if (isStale) {
            localStorage.removeItem('vmines_users');
            return INITIAL_USERS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing vmines_users:', e);
    }
    return INITIAL_USERS;
  });

  const [stats, setStats] = useState<SystemStats>(() => {
    try {
      const saved = localStorage.getItem('vmines_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.totalAccounts > 10) {
            return INITIAL_STATS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing vmines_stats:', e);
    }
    return INITIAL_STATS;
  });

  // UI States
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('vmines_lang') as Language;
      if (saved && translations[saved]) {
        return saved;
      }
    } catch (e) {
      console.error('Error getting vmines_lang:', e);
    }
    return 'TH';
  });
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Simulated Web3 Wallet State
  const [walletConnected, setWalletConnected] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vmines_wallet_connected') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [walletAddress, setWalletAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('vmines_wallet_address') || '';
    } catch (e) {
      return '';
    }
  });
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vmines_wallet_balance');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error parsing wallet balance:', e);
    }
    return 500; // Starts with 500 USDT demo balance
  });

  // Current session
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('vmines_current_user_id');
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? null : parsed;
      }
    } catch (e) {
      console.error('Error parsing current user id:', e);
    }
    return null;
  });

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('vmines_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing history:', e);
    }
    return [
      {
        id: 'h-init-1',
        userId: 1,
        planId: '1',
        cost: 5,
        type: 'register',
        timestamp: '2026-07-20 00:00:15',
        txHash: '0x7f48b10d32c0291ba48c3b0380c100018a3d76e2'
      }
    ];
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [selectedRankDir, setSelectedRankDir] = useState<string>('1');
  const [isRankDirOpen, setIsRankDirOpen] = useState(true);

  // Recursive downline fetcher for a target user ID
  const getDownlineIds = (targetId: number): number[] => {
    const list: number[] = [];
    const queue: number[] = [targetId];
    const visited = new Set<number>([targetId]);

    // Fast lookup for direct referrals
    const referrerMap: Record<number, number[]> = {};
    (Object.values(users) as UserType[]).forEach((u) => {
      if (u.referrerId) {
        if (!referrerMap[u.referrerId]) {
          referrerMap[u.referrerId] = [];
        }
        referrerMap[u.referrerId].push(u.id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = referrerMap[current] || [];
      for (const childId of children) {
        if (!visited.has(childId)) {
          visited.add(childId);
          list.push(childId);
          queue.push(childId);
        }
      }
    }
    return list.sort((a, b) => a - b);
  };

  useEffect(() => {
    try {
      localStorage.setItem('vmines_history', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }, [history]);

  const addHistoryRecord = (userId: number, planId: string, cost: number, type: 'register' | 'buy' | 'autoup') => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const randomHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const txHash = '0x' + randomHex.substring(0, 8) + '...' + randomHex.substring(34, 40);
    
    const newRecord: HistoryRecord = {
      id: 'h-' + Math.random().toString(36).substring(2, 9),
      userId,
      planId,
      cost,
      type,
      timestamp,
      txHash
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  // Input states
  const [searchId, setSearchId] = useState('');
  const [joinUplineId, setJoinUplineId] = useState('1');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // FAQ accordion open states
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false
  });

  // Save states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vmines_users', JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('vmines_stats', JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving stats:', e);
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem('vmines_lang', lang);
    } catch (e) {
      console.error('Error saving lang:', e);
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('vmines_wallet_connected', String(walletConnected));
      localStorage.setItem('vmines_wallet_address', walletAddress);
      localStorage.setItem('vmines_wallet_balance', String(walletBalance));
    } catch (e) {
      console.error('Error saving wallet state:', e);
    }
  }, [walletConnected, walletAddress, walletBalance]);

  useEffect(() => {
    try {
      if (currentUserId !== null) {
        localStorage.setItem('vmines_current_user_id', String(currentUserId));
      } else {
        localStorage.removeItem('vmines_current_user_id');
      }
    } catch (e) {
      console.error('Error saving current user ID:', e);
    }
  }, [currentUserId]);

  // Translate helpers
  const t = translations[lang] || translations['TH'];

  // Helper to show custom notification toast
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // Web3 Wallet Events Listener
  useEffect(() => {
    if (walletConnected && isWeb3Installed()) {
      const cleanup = setupWeb3Listeners(
        (accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            setWalletConnected(false);
            setWalletAddress('');
            showToast(lang === 'TH' ? 'ยกเลิกการเชื่อมต่อในกระเป๋าแล้ว' : 'Wallet disconnected', 'info');
          }
        },
        (chainIdHex) => {
          const chainInt = parseInt(chainIdHex, 16);
          showToast(
            lang === 'TH' 
              ? `สลับเครือข่ายแล้ว (${getChainName(chainInt)})` 
              : `Switched network to ${getChainName(chainInt)}`, 
            'info'
          );
        }
      );
      return cleanup;
    }
  }, [walletConnected, lang]);

  // Connect wallet handler (Supports live Web3 extension or custom address)
  const handleConnectWallet = async (walletType: string, customAddress?: string) => {
    if (customAddress && customAddress.trim()) {
      const cleanAddr = customAddress.trim();
      setWalletAddress(cleanAddr);
      setWalletConnected(true);
      setIsWalletModalOpen(false);
      showToast(`${t.walletConnectedMsg} (${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)})`, 'success');
      return;
    }

    if (isWeb3Installed()) {
      try {
        const res = await connectWeb3Wallet();
        if (res.connected) {
          setWalletAddress(res.address);
          setWalletConnected(true);
          if (res.usdtBalance && parseFloat(res.usdtBalance) > 0) {
            setWalletBalance(parseFloat(res.usdtBalance));
          }
          setIsWalletModalOpen(false);
          showToast(`${t.walletConnectedMsg} (${res.address.slice(0, 6)}...${res.address.slice(-4)}) [${res.chainName}]`, 'success');
          return;
        }
      } catch (err: any) {
        console.warn('Web3 connection notification:', err);
        if (err?.code === 4001) {
          showToast(lang === 'TH' ? 'ยกเลิกการร้องขอเชื่อมต่อในกระเป๋า' : 'Connection request rejected', 'error');
          return;
        }
      }
    }

    // Fallback if no Web3 wallet extension is active
    const fallbackAddr = '0x3e77f2409b304c405963de7a23c3b0380c34';
    setWalletAddress(fallbackAddr);
    setWalletConnected(true);
    setIsWalletModalOpen(false);
    showToast(`${t.walletConnectedMsg} (${walletType})`, 'success');
  };

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    showToast(lang === 'TH' ? 'ยกเลิกการเชื่อมต่อกระเป๋าแล้ว' : 'Wallet disconnected', 'info');
  };

  // Log in user by ID
  const handleLogin = (idToLogin: number) => {
    const user = users[idToLogin];
    if (user) {
      setCurrentUserId(idToLogin);
      // Automatically connect simulated wallet with user's stored wallet if not already connected
      if (!walletConnected) {
        setWalletConnected(true);
        setWalletAddress(user.walletAddress || '0x3e77f2409b304c405963de7a23c3b0380c34');
      }
      showToast(lang === 'TH' ? `เข้าสู่ระบบสำเร็จ ID ${idToLogin}` : `Logged in successfully as ID ${idToLogin}`, 'success');
    } else {
      showToast(lang === 'TH' ? `ไม่พบผู้ใช้งาน ID ${idToLogin}! กรุณาลงทะเบียนก่อนหรือลองค้นหา ID 1` : `ID ${idToLogin} not found! Please register first or try ID 1`, 'error');
    }
  };

  // Search input log in trigger
  const handleSearchLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(searchId.trim(), 10);
    if (!isNaN(parsedId)) {
      handleLogin(parsedId);
    } else {
      showToast(lang === 'TH' ? 'กรุณากรอก ID เป็นตัวเลขเท่านั้น' : 'Please enter a valid numeric ID', 'error');
    }
  };

  // --------------------------------------------------------
  // SMART-CONTRACT MATRIX SIMULATION LOGIC (AUTO UP & REBORN)
  // --------------------------------------------------------

  // Trigger Reborn IDs in target Rank to help fill downlines/own matrix
  const triggerReborns = (
    sponsorId: number,
    count: number,
    updatedUsers: Record<number, UserType>,
    rankId: string = '1'
  ) => {
    let rebornsLeft = count;

    // 1. First, fill sponsor's own board in rankId if there are empty slots
    const sponsor = updatedUsers[sponsorId];
    if (sponsor && sponsor.plans[rankId]?.active) {
      while (rebornsLeft > 0 && sponsor.plans[rankId].matrix.some(s => !s)) {
        fillSlotAndProcessCommissions(sponsorId, rankId, updatedUsers, true);
        rebornsLeft--;
      }
    }

    if (rebornsLeft <= 0) return;

    // Helper to check if a user is a recursive downline of sponsorId
    const isDescendantOf = (childId: number, targetParentId: number): boolean => {
      const child = updatedUsers[childId];
      if (!child || !child.referrerId) return false;
      if (child.referrerId === targetParentId) return true;
      return isDescendantOf(child.referrerId, targetParentId);
    };

    // Find all recursive downlines of the sponsor who have the target Rank active
    const downlines = Object.values(updatedUsers).filter(
      u => isDescendantOf(u.id, sponsorId) && u.plans[rankId]?.active
    );

    // Helper to calculate depth distance from the sponsor
    const getPathLengthToSponsor = (childId: number, targetParentId: number, depth = 1): number => {
      const child = updatedUsers[childId];
      if (!child || !child.referrerId) return 9999;
      if (child.referrerId === targetParentId) return depth;
      return getPathLengthToSponsor(child.referrerId, targetParentId, depth + 1);
    };

    // Sort downlines: closest (direct downlines) first, then deeper levels
    const sortedDownlines = [...downlines].sort((a, b) => {
      const distA = getPathLengthToSponsor(a.id, sponsorId);
      const distB = getPathLengthToSponsor(b.id, sponsorId);
      return distA - distB;
    });

    // Fill slots of recursive downlines
    for (const dl of sortedDownlines) {
      if (rebornsLeft <= 0) break;
      const dlPlan = dl.plans[rankId];
      if (dlPlan) {
        while (rebornsLeft > 0 && dlPlan.matrix.some(s => !s)) {
          fillSlotAndProcessCommissions(dl.id, rankId, updatedUsers, true);
          rebornsLeft--;
        }
      }
    }
    
    // If reborns are still left, fill slots of any other active user in this Rank
    if (rebornsLeft > 0) {
      const activeUsers = Object.values(updatedUsers).filter(
        u => u.id !== sponsorId && u.plans[rankId]?.active
      );
      for (const usr of activeUsers) {
        if (rebornsLeft <= 0) break;
        const uPlan = usr.plans[rankId];
        if (uPlan) {
          while (rebornsLeft > 0 && uPlan.matrix.some(s => !s)) {
            fillSlotAndProcessCommissions(usr.id, rankId, updatedUsers, true);
            rebornsLeft--;
          }
        }
      }
    }
  };

  // Process filling a slot in a user's plan matrix
  const fillSlotAndProcessCommissions = (
    userId: number,
    planId: string,
    updatedUsers: Record<number, UserType>,
    isReborn: boolean = false
  ) => {
    const user = updatedUsers[userId];
    if (!user || !user.plans[planId] || !user.plans[planId].active) return;

    const plan = { ...user.plans[planId] };
    const emptySlotIdx = plan.matrix.findIndex(slot => !slot);
    if (emptySlotIdx === -1) return; // Matrix already full (shouldn't happen before recycle)

    const planPrice = PLAN_PRICES[planId];
    const newMatrix = [...plan.matrix];
    const newRebornSlots = [...(plan.rebornSlots || [false, false, false, false])];

    newMatrix[emptySlotIdx] = true;
    newRebornSlots[emptySlotIdx] = isReborn;

    plan.matrix = newMatrix;
    plan.rebornSlots = newRebornSlots;
    user.plans[planId] = plan;

    // Increment downlines count for the tree visual
    user.downlinesCount += 1;

    // 1. Commission distribution:
    if (emptySlotIdx === 0 || emptySlotIdx === 1) {
      // Slot 1 & 2 (Index 0, 1): 50% commission goes directly to YOU (the board owner)
      const comm = planPrice * 0.5;
      user.totalIncome += comm;
      showToast(
        lang === 'TH'
          ? `ID ${userId} (เจ้าของบอร์ด) ได้รับรายได้ 50% (${comm} USDT) จากสล็อตที่ ${emptySlotIdx + 1} แผน Rank ${planId}!`
          : `ID ${userId} received 50% income (${comm} USDT) from slot ${emptySlotIdx + 1} Rank ${planId}!`,
        'success'
      );
    } else if (emptySlotIdx === 2 || emptySlotIdx === 3) {
      // Slot 3 & 4 (Index 2, 3): Reserved for AUTO UP & Reborn TO Rank 1
      showToast(
        lang === 'TH'
          ? `สล็อตที่ ${emptySlotIdx + 1} ในแผน Rank ${planId} ของ ID ${userId} จัดสรรเข้าส่วน AUTO UP & Reborn`
          : `Slot ${emptySlotIdx + 1} in Rank ${planId} of ID ${userId} allocated to AUTO UP & Reborn`,
        'info'
      );

      // Check if both Slot 3 & 4 (Index 2 & 3) are filled -> Trigger AUTO UP & Reborn TO Rank 1!
      if (newMatrix[2] && newMatrix[3]) {
        const nextPlanId = (Number(planId) + 1).toString();
        const refId = user.referrerId;

        if (PLAN_PRICES[nextPlanId]) {
          const nextPlanActive = user.plans[nextPlanId]?.active;
          if (!nextPlanActive) {
            // Activate the next rank automatically (AUTO UP)
            user.plans[nextPlanId] = { active: true, matrix: [false, false, false, false] };
            user.planLevel = Math.max(user.planLevel, Number(nextPlanId));
            
            addHistoryRecord(userId, nextPlanId, PLAN_PRICES[nextPlanId], 'autoup');

            showToast(
              lang === 'TH'
                ? `🔥 ยินดีด้วย! ID ${userId} ได้รับการอัปเกรดอัตโนมัติ (AUTO UP) เป็น Rank ${nextPlanId} (${PLAN_PRICES[nextPlanId]}$) สำเร็จ!`
                : `🔥 Congratulations! ID ${userId} automatically upgraded (AUTO UP) to Rank ${nextPlanId} (${PLAN_PRICES[nextPlanId]}$)!`,
              'success'
            );

            // Increment global system statistics with new plan cost
            setStats(prev => ({
              ...prev,
              totalUsdtInvested: prev.totalUsdtInvested + PLAN_PRICES[nextPlanId]
            }));

            // Recursively place the user in their referrer's board for the next rank
            if (refId && updatedUsers[refId]) {
              fillSlotAndProcessCommissions(refId, nextPlanId, updatedUsers);
            }
          }
        }

        // Trigger Reborn IDs in Rank 1 (formula: 2^(Rank - 1))
        const rebornCount = Math.pow(2, Number(planId) - 1);
        showToast(
          lang === 'TH'
            ? `♻️ Reborn TO Rank 1: สร้างรหัสเกิดใหม่ (Reborn ID) ต่อ ID เราเอง ทันที จำนวน ${rebornCount} ID!`
            : `♻️ Reborn TO Rank 1: Created ${rebornCount} Reborn IDs under your own ID in Rank 1 immediately!`,
          'info'
        );
        triggerReborns(userId, rebornCount, updatedUsers, '1');
      }
    }

    // If all 4 slots are filled, perform recycle reset
    if (newMatrix.every(slot => slot)) {
      plan.matrix = [false, false, false, false];
      plan.rebornSlots = [false, false, false, false];
      user.plans[planId] = plan;
      showToast(
        lang === 'TH'
          ? `♻️ แผน Rank ${planId} ของ ID ${userId} ครบ 4 สล็อตแล้ว ทำการรีไซเคิลล้างกระดานเพื่อรับรอบถัดไป!`
          : `♻️ ID ${userId}'s Rank ${planId} matrix completed 4 slots & recycled for next round!`,
        'info'
      );
    }
  };

  // Registration handler
  const handleRegister = async () => {
    // 1. Check wallet connection
    if (!walletConnected) {
      setIsWalletModalOpen(true);
      showToast(lang === 'TH' ? 'กรุณาเชื่อมต่อกระเป๋าเพื่อลงทะเบียน' : 'Please connect your wallet to register', 'info');
      return;
    }

    // 2. Validate sponsor
    const sponsorId = parseInt(joinUplineId.trim(), 10);
    if (isNaN(sponsorId) || !users[sponsorId]) {
      showToast(lang === 'TH' ? 'ไม่พบ ID ผู้แนะนำ! โปรดระบุ ID ผู้แนะนำที่ถูกต้อง (เช่น 1)' : 'Sponsor ID not found! Please specify a valid sponsor (e.g. 1)', 'error');
      return;
    }

    // 3. Validate balance (Registration requires 5 USDT for Rank 1)
    if (walletBalance < 5) {
      showToast(t.insufficientBalance, 'error');
      return;
    }

    // 4. Request Web3 Transaction if Web3 Browser Provider is installed
    if (isWeb3Installed()) {
      try {
        showToast(lang === 'TH' ? 'กรุณายืนยันธุรกรรมในกระเป๋า Web3 ของคุณ...' : 'Please confirm transaction in your Web3 wallet...', 'info');
        await executeWeb3Purchase({
          amountUsdt: 5,
          recipientAddress: users[sponsorId]?.walletAddress || '0x7a8e27c15e8df1569ca493e8e19c3b0380c10001'
        });
      } catch (e: any) {
        console.warn('Web3 Tx Notice:', e);
        if (e?.code === 4001) {
          showToast(lang === 'TH' ? 'คุณได้ยกเลิกธุรกรรมในกระเป๋า' : 'Transaction rejected in wallet', 'error');
          return;
        }
      }
    }

    // 5. Create new user
    const nextUserId = Math.max(...Object.keys(users).map(Number)) + 1;
    const newWallet = walletAddress || ('0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6));

    const newUser: UserType = {
      id: nextUserId,
      walletAddress: newWallet,
      referrerId: sponsorId,
      downlinesCount: 0,
      totalIncome: 0,
      planLevel: 1,
      plans: {
        '1': { active: true, matrix: [false, false, false, false] },
        ...Object.keys(PLAN_PRICES).slice(1).reduce((acc, key) => {
          acc[key] = { active: false, matrix: [false, false, false, false] };
          return acc;
        }, {} as any)
      }
    };

    // Deduct registration fee
    setWalletBalance(prev => Math.max(0, prev - 5));

    // Update sponsor's downline count and fill matrix slot
    const updatedUsers = { ...users };
    updatedUsers[sponsorId] = {
      ...updatedUsers[sponsorId],
      downlinesCount: updatedUsers[sponsorId].downlinesCount + 1
    };

    // Process filling the slot in sponsor's Rank 1 board!
    fillSlotAndProcessCommissions(sponsorId, '1', updatedUsers);

    // Save user
    updatedUsers[nextUserId] = newUser;
    setUsers(updatedUsers);
    
    addHistoryRecord(nextUserId, '1', 5, 'register');

    // Increment global stats
    setStats(prev => ({
      totalAccounts: prev.totalAccounts + 1,
      totalUsdtInvested: prev.totalUsdtInvested + 5
    }));

    // Logs in new user immediately!
    setCurrentUserId(nextUserId);
    setWalletAddress(newWallet);
    showToast(t.registerSuccess, 'success');
  };

  // Buy lock plan slot
  const handleBuyPlan = async (planId: string) => {
    if (!currentUserId || !users[currentUserId]) return;

    const price = PLAN_PRICES[planId];
    if (walletBalance < price) {
      showToast(t.insufficientBalance, 'error');
      return;
    }

    const updatedUsers = { ...users };
    const user = updatedUsers[currentUserId];

    // Confirm preceding plan is active
    const planKeys = Object.keys(PLAN_PRICES);
    const planIndex = planKeys.indexOf(planId);
    if (planIndex > 0) {
      const prevPlanId = planKeys[planIndex - 1];
      if (!user.plans[prevPlanId] || !user.plans[prevPlanId].active) {
        showToast(t.cannotBuyLocked, 'error');
        return;
      }
    }

    // Request Web3 Transaction if Web3 Wallet is active
    if (isWeb3Installed()) {
      try {
        showToast(lang === 'TH' ? 'กรุณายืนยันธุรกรรมในกระเป๋า Web3 ของคุณ...' : 'Please confirm transaction in your Web3 wallet...', 'info');
        await executeWeb3Purchase({
          amountUsdt: price,
          recipientAddress: '0x7a8e27c15e8df1569ca493e8e19c3b0380c10001'
        });
      } catch (e: any) {
        console.warn('Web3 Tx Notice:', e);
        if (e?.code === 4001) {
          showToast(lang === 'TH' ? 'คุณได้ยกเลิกธุรกรรมในกระเป๋า' : 'Transaction rejected in wallet', 'error');
          return;
        }
      }
    }

    // Deduct cost
    setWalletBalance(prev => Math.max(0, prev - price));

    // Activate Plan
    user.plans[planId] = { active: true, matrix: [false, false, false, false] };
    user.planLevel = Math.max(user.planLevel, planIndex + 1);

    addHistoryRecord(currentUserId, planId, price, 'buy');

    // Place this user in their referrer's board for this plan
    const refId = user.referrerId;
    if (refId && updatedUsers[refId]) {
      fillSlotAndProcessCommissions(refId, planId, updatedUsers);
    }

    setUsers(updatedUsers);

    // Increase total USDT
    setStats(prev => ({
      ...prev,
      totalUsdtInvested: prev.totalUsdtInvested + price
    }));

    showToast(t.planPurchased, 'success');
  };

  // Sandbox simulation actions
  const handleSandboxAddBalance = () => {
    setWalletBalance(prev => prev + 100);
    showToast(lang === 'TH' ? 'เพิ่มยอด USDT จำลองสำเร็จ (+100 USDT)' : 'Added 100 Demo USDT to wallet!', 'success');
  };

  const handleSandboxSimulateDownline = () => {
    if (!currentUserId || !users[currentUserId]) {
      showToast(lang === 'TH' ? 'กรุณาเข้าสู่ระบบแดชบอร์ดก่อนใช้งาน' : 'Please log in to the dashboard first', 'error');
      return;
    }

    const updatedUsers = { ...users };
    const user = updatedUsers[currentUserId];

    // Find the first plan that is active but has unfilled matrix slots
    const activePlanId = Object.keys(PLAN_PRICES).find(planId => {
      const plan = user.plans[planId];
      return plan && plan.active && plan.matrix.some(slot => !slot);
    });

    if (!activePlanId) {
      showToast(lang === 'TH' ? 'ยินดีด้วย! บอร์ดผังแมทริกซ์ทุกแผนถูกเติมเต็มแล้ว ปลดล็อกแผนถัดไปเพื่อรับโบนัสเพิ่ม!' : 'All active matrices are filled! Unlock higher plans to receive more commissions!', 'info');
      return;
    }

    // Process slot filling via our main function for absolute realism & integrity!
    fillSlotAndProcessCommissions(currentUserId, activePlanId, updatedUsers);
    setUsers(updatedUsers);
  };

  const handleSandboxResetDB = () => {
    localStorage.removeItem('vmines_users');
    localStorage.removeItem('vmines_stats');
    localStorage.removeItem('vmines_current_user_id');
    localStorage.removeItem('vmines_wallet_balance');
    localStorage.removeItem('vmines_history');
    setUsers(INITIAL_USERS);
    setStats(INITIAL_STATS);
    setHistory([
      {
        id: 'h-init-1',
        userId: 1,
        planId: '1',
        cost: 5,
        type: 'register',
        timestamp: '2026-07-20 00:00:15',
        txHash: '0x7f48b10d32c0291ba48c3b0380c100018a3d76e2'
      }
    ]);
    setWalletBalance(500);
    setCurrentUserId(null);
    showToast(lang === 'TH' ? 'รีเซ็ตข้อมูลระบบจำลองเป็นค่าเริ่มต้นแล้ว' : 'Reset simulator database to default successfully!', 'success');
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`${label} ${t.copied}`, 'success');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Language support lists
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'TH', name: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'ZH', name: 'Chinese', flag: '🇨🇳' },
    { code: 'HI', name: 'Hindi', flag: '🇮🇳' },
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'MY', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'MS', name: 'Malay', flag: '🇲🇾' },
    { code: 'KM', name: 'Khmer', flag: '🇰🇭' }
  ];

  const currentLanguageDetails = languages.find(l => l.code === lang) || languages[0];

  return (
    <div className="min-h-screen bg-[#070211] text-white font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden relative">
      
      {/* Dynamic Cosmic Background Canvas */}
      <div className="absolute inset-0 bg-radial from-[#130325] via-[#080212] to-[#04010a] pointer-events-none z-0" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8b5cf6]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Wallet Connection Popup Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleConnectWallet}
        title={t.selectWallet}
      />

      {/* APP VIEWS SCREEN WRAPPER */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        
        {/* TOP STATUS NAVIGATION BAR */}
        <header className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md mb-8">
          
          {/* Brand/Globe spinning button */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Globe className="h-5 w-5 animate-[spin_10s_linear_infinite]" />
            </div>
            {currentUserId && (
              <span className="font-display font-bold text-amber-400 text-sm tracking-wider">
                VMines ID {currentUserId}
              </span>
            )}
          </div>

          {/* Web3 Wallet Address Badge & Language Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {walletConnected ? (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs text-slate-300">
                  {walletAddress.substring(0, 5)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
                <button
                  onClick={handleDisconnectWallet}
                  className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Disconnect Wallet"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:opacity-95 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>{t.connectWallet}</span>
              </button>
            )}

            {/* Language Switcher Widget */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold hover:border-slate-700 transition-all cursor-pointer"
              >
                <span className="text-base leading-none">{currentLanguageDetails.flag}</span>
                <span className="font-display">{currentLanguageDetails.code}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsLangDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 z-40 w-40 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md"
                    >
                      {languages.map((item) => (
                        <button
                          key={item.code}
                          onClick={() => {
                            setLang(item.code);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-3.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all hover:bg-slate-800/80 ${
                            lang === item.code ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          <span className="text-sm leading-none">{item.flag}</span>
                          <span className="font-display">{item.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>


        {/* CONDITIONAL ROUTE RENDERING */}
        <main className="flex-1">
          {currentUserId === null ? (
            
            /* ========================================================
               1. LANDING PAGE VIEW (LOGIN / SIGNUP)
               ======================================================== */
            <div className="flex flex-col items-center">
              
              {/* Rotating VMINES Banner Logo */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <Logo size="md" />
                <h1 className="font-display font-extrabold text-3xl tracking-wider text-center bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent mt-4">
                  VMINES NETWORK
                </h1>
              </motion.div>

              {/* Login Block */}
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm mb-6 shadow-2xl relative">
                <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {t.loginToView}
                </h3>

                <form onSubmit={handleSearchLogin} className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t.enterId}
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all pr-12 font-mono"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-slate-500 pointer-events-none">
                      <Search className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseInt(searchId.trim(), 10);
                        if (!isNaN(parsed)) handleLogin(parsed);
                        else showToast(lang === 'TH' ? 'กรุณากรอก ID' : 'Please enter ID', 'error');
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:border-amber-500/30 bg-slate-950/80 hover:bg-slate-900 py-3 text-xs font-bold text-white transition-all active:scale-98 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-amber-500" />
                      <span>{t.search}</span>
                    </button>
                    
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 py-3 text-xs font-bold text-slate-950 shadow-[0_4px_15px_rgba(245,158,11,0.25)] transition-all active:scale-98 cursor-pointer"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>{t.login}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Join Under ID / Register block */}
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm mb-10 shadow-2xl relative">
                <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  {t.joinUnderId}
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={joinUplineId}
                      onChange={(e) => setJoinUplineId(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white focus:border-cyan-500 focus:outline-none transition-all pr-12 font-mono"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-slate-500 pointer-events-none">
                      <User className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Range slider underneath to feel high tech */}
                  <div className="px-1">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={isNaN(parseInt(joinUplineId, 10)) ? 1 : parseInt(joinUplineId, 10)}
                      onChange={(e) => setJoinUplineId(e.target.value)}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs text-slate-400">
                    <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block mb-0.5">{t.startWith5Usdt}</span>
                      <span>{t.balance}: <strong className="font-mono text-amber-400">{walletBalance} USDT</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 hover:opacity-95 py-3.5 text-xs font-bold font-display text-white tracking-widest shadow-[0_4px_20px_rgba(6,182,212,0.3)] transition-all active:scale-98 cursor-pointer"
                  >
                    <span>{t.register}</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>


              {/* HOW TO INVEST INSTRUCTION CARDS */}
              <div className="grid md:grid-cols-2 gap-4 w-full mb-10">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 relative">
                  <div className="absolute top-4 right-4 text-amber-500/10">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h4 className="font-display font-bold text-amber-400 text-sm mb-2">{t.howToInvest}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.howToInvestDesc}</p>
                </div>
                
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 relative">
                  <div className="absolute top-4 right-4 text-cyan-500/10">
                    <Award className="h-8 w-8" />
                  </div>
                  <h4 className="font-display font-bold text-cyan-400 text-sm mb-2">{t.howToAccess}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.howToAccessDesc}</p>
                </div>
              </div>


              {/* LIVE TOTAL STATS BOXES */}
              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className="rounded-2xl border border-amber-500/20 bg-slate-900/20 p-4 flex flex-col items-center justify-center shadow-lg backdrop-blur-xs">
                  <span className="text-[11px] text-slate-400 font-display font-semibold uppercase tracking-wider mb-1">{t.totalAccount}</span>
                  <span className="font-mono text-2xl font-bold text-amber-400">{stats.totalAccounts.toLocaleString()}</span>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/20 p-4 flex flex-col items-center justify-center shadow-lg backdrop-blur-xs">
                  <span className="text-[11px] text-slate-400 font-display font-semibold uppercase tracking-wider mb-1">{t.totalUsdt}</span>
                  <span className="font-mono text-2xl font-bold text-cyan-400">{stats.totalUsdtInvested.toLocaleString()}</span>
                </div>
              </div>


              {/* FAQ ACCORDION */}
              <div className="w-full mb-16">
                <h3 className="font-display font-extrabold text-xl text-center text-white mb-6 flex items-center justify-center gap-2">
                  <span className="h-1.5 w-6 bg-amber-500 rounded-full" />
                  {t.faq}
                  <span className="h-1.5 w-6 bg-amber-500 rounded-full" />
                </h3>

                <div className="flex flex-col gap-3">
                  {[
                    { q: t.faqQ1, a: t.faqA1 },
                    { q: t.faqQ2, a: t.faqA2 },
                    { q: t.faqQ3, a: t.faqA3 },
                    { q: t.faqQ4, a: t.faqA4 }
                  ].map((item, index) => (
                    <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
                      <button
                        onClick={() => setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold font-display hover:bg-slate-900/30 transition-all cursor-pointer"
                      >
                        <span className="text-white">{item.q}</span>
                        {faqOpen[index] ? (
                          <ChevronUp className="h-4.5 w-4.5 text-amber-400" />
                        ) : (
                          <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                        )}
                      </button>

                      {faqOpen[index] && (
                        <div className="p-4 bg-slate-950/50 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            
            /* ========================================================
               2. ACTIVE DASHBOARD VIEW (LOGGED IN)
               ======================================================== */
            (() => {
              const user = users[currentUserId];
              if (!user) return null;
              const refLink = `${window.location.origin}/?refId=${user.id}`;

              return (
                <div className="flex flex-col gap-6">
                  
                  {/* ID Header card */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm shadow-xl relative">
                    <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: ID & Copy Address block */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-display font-extrabold text-xl text-white tracking-wide flex items-center gap-2">
                            ID {user.id}
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-mono">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-400">
                            <span>{user.walletAddress.substring(0, 8)}...{user.walletAddress.substring(user.walletAddress.length - 6)}</span>
                            <button
                              onClick={() => handleCopy(user.walletAddress, 'Wallet address')}
                              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
                              title="Copy Wallet Address"
                            >
                              <Clipboard className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Close/Logout dashboard Button */}
                      <button
                        onClick={() => {
                          setCurrentUserId(null);
                          showToast(lang === 'TH' ? 'ออกจากระบบแดชบอร์ดแล้ว' : 'Logged out of dashboard', 'info');
                        }}
                        className="self-end sm:self-center flex items-center gap-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>

                    {/* Referral URL Info box */}
                    <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-0.5">{t.referralLink}</span>
                        <span className="font-mono text-xs text-amber-300 font-semibold break-all">{refLink}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(refLink, 'Referral link')}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 transition-all cursor-pointer"
                        >
                          {copiedText === refLink ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                          <span>{copiedText === refLink ? t.copied : 'Copy'}</span>
                        </button>
                        
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                          <span>{t.joinWithUpline}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold text-[10px]">ID {user.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* TOTAL INCOME BIG BLOCK */}
                  <div className="rounded-2xl border border-amber-500/30 bg-radial from-amber-500/10 via-slate-900/60 to-slate-950/80 p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                    {/* Ring graphics */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-amber-500/5 rounded-full pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-amber-500/3 rounded-full pointer-events-none" />
                    
                    <span className="text-xs text-slate-400 font-display font-semibold uppercase tracking-widest mb-2">
                      {t.totalIncome}
                    </span>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="font-mono text-5xl font-extrabold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                        {user.totalIncome.toLocaleString()}
                      </span>
                      <span className="font-display font-bold text-xl text-amber-400">USDT</span>
                    </div>
                  </div>


                  {/* STATS MATRIX SUMMARY GRID */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-3.5 flex flex-col items-center justify-center shadow-lg">
                      <Users className="h-5 w-5 text-amber-500/80 mb-1" />
                      <span className="text-[10px] text-slate-400 font-display uppercase font-semibold tracking-wider text-center">{t.downlines}</span>
                      <span className="font-mono text-md font-bold text-white mt-1">{user.downlinesCount}</span>
                    </div>
                    
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-3.5 flex flex-col items-center justify-center shadow-lg">
                      <Award className="h-5 w-5 text-cyan-400/80 mb-1" />
                      <span className="text-[10px] text-slate-400 font-display uppercase font-semibold tracking-wider text-center">{t.referrerId}</span>
                      <span className="font-mono text-md font-bold text-white mt-1">{user.referrerId || '-'}</span>
                    </div>
                    
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-3.5 flex flex-col items-center justify-center shadow-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-400/80 mb-1" />
                      <span className="text-[10px] text-slate-400 font-display uppercase font-semibold tracking-wider text-center">{t.planLevel}</span>
                      <span className="font-mono text-md font-bold text-white mt-1">{user.planLevel} / 12</span>
                    </div>
                  </div>


                  {/* SUBSCRIPTION HISTORY SECTION */}
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-amber-500 animate-pulse" />
                        <h3 className="font-display font-bold text-lg text-white">
                          {historyTranslations[lang]?.historyTitle || historyTranslations['TH'].historyTitle}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-[10px] text-amber-400 font-mono">
                          {history.filter(record => record.userId === user.id).length}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="p-1 rounded bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] px-2.5 font-semibold"
                      >
                        {isHistoryOpen ? (
                          <>
                            <span>{historyTranslations[lang]?.toggleHide || historyTranslations['TH'].toggleHide}</span>
                            <ChevronUp className="h-3.5 w-3.5 text-amber-500" />
                          </>
                        ) : (
                          <>
                            <span>{historyTranslations[lang]?.toggleShow || historyTranslations['TH'].toggleShow}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                          </>
                        )}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isHistoryOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {(() => {
                            const userHistory = history.filter(record => record.userId === user.id);
                            if (userHistory.length === 0) {
                              return (
                                <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                                  {historyTranslations[lang]?.noHistory || historyTranslations['TH'].noHistory}
                                </div>
                              );
                            }

                            return (
                              <div className="overflow-x-auto rounded-xl border border-slate-950 bg-slate-950/40">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-900 bg-slate-950/80 text-[10px] font-display font-semibold uppercase tracking-wider text-slate-400">
                                      <th className="px-4 py-3 text-center">{historyTranslations[lang]?.rankCol || historyTranslations['TH'].rankCol}</th>
                                      <th className="px-4 py-3">{historyTranslations[lang]?.costCol || historyTranslations['TH'].costCol}</th>
                                      <th className="px-4 py-3">{historyTranslations[lang]?.typeCol || historyTranslations['TH'].typeCol}</th>
                                      <th className="px-4 py-3 font-mono">{historyTranslations[lang]?.hashCol || historyTranslations['TH'].hashCol}</th>
                                      <th className="px-4 py-3 text-right">{historyTranslations[lang]?.timeCol || historyTranslations['TH'].timeCol}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                                    {userHistory.map((record) => {
                                      let typeLabel = '';
                                      let typeColor = '';
                                      if (record.type === 'register') {
                                        typeLabel = historyTranslations[lang]?.registerType || historyTranslations['TH'].registerType;
                                        typeColor = 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/20';
                                      } else if (record.type === 'buy') {
                                        typeLabel = historyTranslations[lang]?.buyType || historyTranslations['TH'].buyType;
                                        typeColor = 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/20';
                                      } else if (record.type === 'autoup') {
                                        typeLabel = historyTranslations[lang]?.autoupType || historyTranslations['TH'].autoupType;
                                        typeColor = 'text-fuchsia-400 bg-fuchsia-500/5 border border-fuchsia-500/20';
                                      }

                                      return (
                                        <tr key={record.id} className="hover:bg-slate-900/30 text-slate-300 transition-colors">
                                          <td className="px-4 py-3 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-bold text-amber-400 text-[10px]">
                                              Rank {record.planId}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 font-bold text-white">
                                            {record.cost} USDT
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-display ${typeColor}`}>
                                              {typeLabel}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-slate-400">
                                            <div className="flex items-center gap-1">
                                              <span className="cursor-help" title={record.txHash}>{record.txHash}</span>
                                              <button
                                                onClick={() => handleCopy(record.txHash, 'Transaction hash')}
                                                className="p-1 rounded hover:bg-slate-850 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                                                title="Copy Transaction Hash"
                                              >
                                                <Clipboard className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                                            {record.timestamp}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>


                  {/* VISUAL DOWNLINE NETWORK TREE VIEW */}
                  <div className="mt-6">
                    <NetworkTreeView currentUser={user} users={users} lang={lang} />
                  </div>




                  {/* VMINE DETAILED PLANS SECTION */}
                  <div className="mt-4">
                    <h3 className="font-display font-extrabold text-2xl text-white mb-6 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      {t.vminePlans}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                      {Object.keys(PLAN_PRICES).map((planId) => {
                        const planState = user.plans[planId] || { active: false, matrix: [false, false, false, false] };
                        
                        // Check if this plan is buyable (is locked, but previous plan is active)
                        const planKeys = Object.keys(PLAN_PRICES);
                        const planIdx = planKeys.indexOf(planId);
                        const buyable = !planState.active && (planIdx === 0 || (user.plans[planKeys[planIdx - 1]] && user.plans[planKeys[planIdx - 1]].active));

                        return (
                          <MatrixPlan
                            key={planId}
                            id={planId}
                            name={`Plan ${planId}`}
                            cost={PLAN_PRICES[planId]}
                            active={planState.active}
                            buyable={buyable}
                            matrix={planState.matrix}
                            rebornSlots={planState.rebornSlots}
                            onBuy={() => handleBuyPlan(planId)}
                            lang={lang}
                          />
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })()
          )}
        </main>

        
        {/* FOOTER BAR */}
        <footer className="mt-20 pt-8 border-t border-slate-900/80 pb-6 text-center text-xs text-slate-500 font-display flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 justify-center">
            <div className="h-2 w-2 rounded-full bg-amber-500/50" />
            <span>VMINES Network - MLM Decentralized Matrix Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-slate-600">
              Copyright @2026: Vmines Network
            </span>
          </div>
        </footer>

      </div>

      {/* FLOAT FLOATING SANDBOX SIMULATOR PANEL */}
      <Sandbox
        lang={lang}
        onAddBalance={handleSandboxAddBalance}
        onSimulateDownline={handleSandboxSimulateDownline}
        onResetDatabase={handleSandboxResetDB}
        currentBalance={walletBalance}
      />

    </div>
  );
}
