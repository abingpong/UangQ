import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Plus, Wallet, TrendingUp, CreditCard, Mic, Banknote, Bell, Settings, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PROVIDER_LOGOS } from '../constants/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { colors, formatCurrency } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [username, setUsername] = useState('');

  const fetchData = async () => {
    try {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profile) setUsername(profile.username);

      const { data: accs } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setAccounts(accs || []);

      const total = accs?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;
      setTotalSaldo(total);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const accIds = accs?.map(a => a.id) || [];
      if (accIds.length > 0) {
        const { data: todayTx } = await supabase
          .from('transactions')
          .select('*, categories(type)')
          .in('account_id', accIds)
          .gte('transaction_date', startOfDay)
          .lt('transaction_date', endOfDay);

        const income = todayTx?.filter(t => t.categories?.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
        const expense = todayTx?.filter(t => t.categories?.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
        setTodayIncome(income);
        setTodayExpense(expense);

        const { data: txs } = await supabase
          .from('transactions')
          .select('*, categories(name, type, icon), accounts(name, provider_code)')
          .in('account_id', accIds)
          .order('transaction_date', { ascending: false })
          .limit(10);
        setRecentTransactions(txs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [navigation, user]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };
  
  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut }
    ]);
  };

  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const renderAccountLogo = (providerCode: string, type: string) => {
    if (providerCode && PROVIDER_LOGOS[providerCode]) {
      const p = PROVIDER_LOGOS[providerCode];
      return (
        <View style={[styles.walletLogo, { backgroundColor: p.color }]}>
          <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
        </View>
      );
    }
    
    // Fallback based on type
    const p = PROVIDER_LOGOS[type] || PROVIDER_LOGOS['cash'];
    return (
      <View style={[styles.walletLogo, { backgroundColor: p.color }]}>
        <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Baru */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appTitle, { color: colors.textPrimary }]}>Hai, {username || 'User'}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Bell size={20} color={colors.textPrimary} />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Saldo Card */}
        <View style={[styles.saldoCard, { backgroundColor: colors.purple }]}>
          <View style={styles.saldoHeader}>
            <Text style={styles.saldoLabel}>TOTAL SALDO</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={20} color="#fff" /> : <EyeOff size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
          ) : (
            <Text style={styles.saldoAmount}>{showBalance ? formatCurrency(totalSaldo) : '••••••••'}</Text>
          )}
          <Text style={styles.saldoSub}>Seluruh dompet — {monthNames[now.getMonth()]} {now.getFullYear()}</Text>
          <View style={styles.saldoRow}>
            <View style={styles.saldoStat}>
              <View style={[styles.dot, { backgroundColor: colors.green }]} />
              <Text style={styles.saldoStatLabel}>Pemasukan</Text>
            </View>
            <View style={styles.saldoStat}>
              <View style={[styles.dot, { backgroundColor: colors.red }]} />
              <Text style={styles.saldoStatLabel}>Pengeluaran</Text>
            </View>
          </View>
          <View style={styles.saldoRow}>
            <Text style={[styles.saldoStatValue, { color: colors.green }]}>+{showBalance ? formatCurrency(todayIncome) : '••••'}</Text>
            <Text style={[styles.saldoStatValue, { color: colors.red }]}>-{showBalance ? formatCurrency(todayExpense) : '••••'}</Text>
          </View>
        </View>

        {/* Dompet Saya */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dompet saya</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={[styles.seeAll, { color: colors.purple }]}>Lihat semua</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
          {accounts.slice(0, 4).map(acc => (
            <View key={acc.id} style={[styles.walletCard, { backgroundColor: colors.bgCard }]}>
              {renderAccountLogo(acc.provider_code, acc.type)}
              <Text style={[styles.walletName, { color: colors.textPrimary }]} numberOfLines={1}>{acc.name}</Text>
              <Text style={[styles.walletBalance, { color: colors.green }]}>{showBalance ? formatCurrency(acc.current_balance) : '••••'}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.walletAddCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={() => navigation.navigate('Accounts')}>
            <Plus size={28} color={colors.textSecondary} />
            <Text style={[styles.walletAddText, { color: colors.textSecondary }]}>Kelola{'\n'}Dompet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Transaksi Terbaru */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Transaksi Terbaru</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsList')}>
            <Text style={[styles.seeAll, { color: colors.purple }]}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.purple} />
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Belum ada transaksi</Text>
            <View style={[styles.voiceHint, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.voiceHintText, { color: colors.purple }]}>Catat Transaksi Lewat Suara! 🎙️</Text>
              <Text style={[styles.voiceHintSub, { color: colors.textSecondary }]}>Ketuk tombol + di bawah ini untuk merekam transaksi Anda secara otomatis.</Text>
            </View>
          </View>
        ) : (
          recentTransactions.map(tx => {
            const isIncome = tx.categories?.type === 'income';
            return (
              <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.bgCard }]}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, { backgroundColor: isIncome ? colors.greenBg : colors.redBg }]}>
                    <Text style={{ fontSize: 20 }}>{tx.categories?.icon || (isIncome ? '💰' : '💸')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>{tx.notes || tx.categories?.name || 'Transaksi'}</Text>
                    <Text style={[styles.txSub, { color: colors.textSecondary }]}>{tx.accounts?.name} • {new Date(tx.transaction_date).toLocaleDateString('id-ID')}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isIncome ? colors.green : colors.red }]}>
                  {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIcon: { padding: 4, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5252' },
  appTitle: { fontSize: 20, fontWeight: 'bold' },
  dateText: { fontSize: 13, marginTop: 2 },
  saldoCard: { borderRadius: 20, padding: 20, marginBottom: 24 },
  saldoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saldoLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  saldoAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
  saldoSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saldoStat: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  saldoStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  saldoStatValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  walletScroll: { marginBottom: 24 },
  walletCard: { borderRadius: 16, padding: 16, marginRight: 12, width: 120, minHeight: 110, justifyContent: 'center' },
  walletLogo: { width: 36, height: 36, borderRadius: 18, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  walletName: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  walletBalance: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  walletAddCard: { borderRadius: 16, padding: 16, width: 100, minHeight: 110, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  walletAddText: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8 },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txTitle: { fontSize: 14, fontWeight: '600' },
  txSub: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  voiceHint: { borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center', width: '100%' },
  voiceHintText: { fontSize: 14, fontWeight: '600' },
  voiceHintSub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
