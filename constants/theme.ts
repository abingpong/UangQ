// UangQ Premium Theme System
export const COLORS = {
  // Backgrounds
  bgPrimary: '#0a0e27',
  bgCard: '#141937',
  bgInput: '#1c2145',
  bgTabBar: '#0d1130',
  bgModal: '#0c0f2a',

  // Gradients
  gradientStart: '#6c5ce7',
  gradientEnd: '#a29bfe',
  gradientMid: '#7f6ef0',

  // Text
  textPrimary: '#edf0ff',
  textSecondary: '#8b8db0',
  textMuted: '#5a5c7a',

  // Accents
  green: '#00e676',
  greenBg: 'rgba(0, 230, 118, 0.12)',
  red: '#ff6b6b',
  redBg: 'rgba(255, 107, 107, 0.12)',
  blue: '#74b9ff',
  blueBright: '#0984e3',
  purple: '#6c5ce7',
  purpleLight: '#a29bfe',
  yellow: '#fdcb6e',
  orange: '#e17055',
  cyan: '#00cec9',

  // Borders
  border: '#232850',
  borderLight: '#2d3566',

  // Tab
  tabActive: '#6c5ce7',
  tabInactive: '#5a5c7a',
};

// Provider logos as styled text (reliable, no external dependency)
export const PROVIDER_LOGOS: Record<string, { emoji: string; color: string }> = {
  // Banks
  'bca': { emoji: '🏦', color: '#0060af' },
  'mandiri': { emoji: '🏦', color: '#003d79' },
  'bni': { emoji: '🏦', color: '#f15a22' },
  'bri': { emoji: '🏦', color: '#00529c' },
  'jago': { emoji: '🏦', color: '#6c5ce7' },
  'seabank': { emoji: '🏦', color: '#00b894' },
  'bsi': { emoji: '🏦', color: '#00695c' },
  // E-Wallets
  'gopay': { emoji: '💚', color: '#00aa13' },
  'ovo': { emoji: '💜', color: '#4c3494' },
  'dana': { emoji: '💙', color: '#108ee9' },
  'shopeepay': { emoji: '🧡', color: '#ee4d2d' },
  'linkaja': { emoji: '❤️', color: '#e2231a' },
  // Others
  'cash': { emoji: '💵', color: '#00e676' },
  'investment': { emoji: '📈', color: '#fdcb6e' },
};

export const EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', icon: '🍔', type: 'expense' },
  { name: 'Transportasi', icon: '🚗', type: 'expense' },
  { name: 'Belanja', icon: '🛍️', type: 'expense' },
  { name: 'Jajan', icon: '🍿', type: 'expense' },
  { name: 'Jalan-jalan', icon: '✈️', type: 'expense' },
  { name: 'Akademik', icon: '📚', type: 'expense' },
  { name: 'Tagihan', icon: '💡', type: 'expense' },
  { name: 'Kesehatan', icon: '⚕️', type: 'expense' },
  { name: 'Hiburan', icon: '🎬', type: 'expense' },
  { name: 'Kecantikan', icon: '💄', type: 'expense' },
  { name: 'Olahraga', icon: '⚽', type: 'expense' },
  { name: 'Lainnya', icon: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES = [
  { name: 'Gaji', icon: '💰', type: 'income' },
  { name: 'Bonus', icon: '🎉', type: 'income' },
  { name: 'Investasi', icon: '📈', type: 'income' },
  { name: 'Uang Saku', icon: '💵', type: 'income' },
  { name: 'Freelance', icon: '💻', type: 'income' },
  { name: 'Hadiah', icon: '🎁', type: 'income' },
  { name: 'Lainnya', icon: '📥', type: 'income' },
];

export const BANK_PROVIDERS = [
  { code: 'bca', name: 'BCA' },
  { code: 'mandiri', name: 'Mandiri' },
  { code: 'bni', name: 'BNI' },
  { code: 'bri', name: 'BRI' },
  { code: 'jago', name: 'Bank Jago' },
  { code: 'seabank', name: 'SeaBank' },
  { code: 'bsi', name: 'BSI' },
];

export const EWALLET_PROVIDERS = [
  { code: 'gopay', name: 'GoPay' },
  { code: 'ovo', name: 'OVO' },
  { code: 'dana', name: 'DANA' },
  { code: 'shopeepay', name: 'ShopeePay' },
  { code: 'linkaja', name: 'LinkAja' },
];
