import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Plus, Wallet, TrendingUp, CreditCard, Mic, Banknote } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
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

      // Fetch username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (profile) setUsername(profile.username);

      // Fetch accounts
      const { data: accs } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setAccounts(accs || []);

      const total = accs?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;
      setTotalSaldo(total);

      // Fetch today's income/expense
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

        // Fetch recent transactions
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

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote size={24} color={COLORS.green} />;
      case 'ewallet': return <Wallet size={24} color={COLORS.blueBright} />;
      case 'bank': return <CreditCard size={24} color={COLORS.purple} />;
      case 'investment': return <TrendingUp size={24} color={COLORS.yellow} />;
      default: return <Wallet size={24} color={COLORS.textSecondary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.purple} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Keuanganku</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        </View>

        {/* Total Saldo Card */}
        <View style={styles.saldoCard}>
          <View style={styles.saldoHeader}>
            <Text style={styles.saldoLabel}>TOTAL SALDO</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={20} color="#fff" /> : <EyeOff size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
          ) : (
            <Text style={styles.saldoAmount}>{showBalance ? fmt(totalSaldo) : '••••••••'}</Text>
          )}
          <Text style={styles.saldoSub}>Seluruh dompet — {monthNames[now.getMonth()]} {now.getFullYear()}</Text>
          <View style={styles.saldoRow}>
            <View style={styles.saldoStat}>
              <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.saldoStatLabel}>Pemasukan</Text>
            </View>
            <View style={styles.saldoStat}>
              <View style={[styles.dot, { backgroundColor: COLORS.red }]} />
              <Text style={styles.saldoStatLabel}>Pengeluaran</Text>
            </View>
          </View>
          <View style={styles.saldoRow}>
            <Text style={[styles.saldoStatValue, { color: COLORS.green }]}>+{showBalance ? fmt(todayIncome) : '••••'}</Text>
            <Text style={[styles.saldoStatValue, { color: COLORS.red }]}>-{showBalance ? fmt(todayExpense) : '••••'}</Text>
          </View>
        </View>

        {/* Dompet Saya */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dompet saya</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.seeAll}>Lihat semua</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
          {accounts.slice(0, 4).map(acc => (
            <View key={acc.id} style={styles.walletCard}>
              {acc.provider_code ? (
                <Image source={{ uri: `https://logo.clearbit.com/${acc.provider_code}` }} style={styles.walletLogo} />
              ) : (
                getAccountIcon(acc.type)
              )}
              <Text style={styles.walletName} numberOfLines={1}>{acc.name}</Text>
              <Text style={styles.walletBalance}>{showBalance ? fmt(acc.current_balance) : '••••'}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.walletAddCard} onPress={() => navigation.navigate('Accounts')}>
            <Plus size={28} color={COLORS.textSecondary} />
            <Text style={styles.walletAddText}>Kelola{'\n'}Dompet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Transaksi Terbaru */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsList')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.purple} />
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
            <View style={styles.voiceHint}>
              <Text style={styles.voiceHintText}>Catat Transaksi Lewat Suara! 🎙️</Text>
              <Text style={styles.voiceHintSub}>Ketuk tombol Mic di bawah ini untuk merekam transaksi Anda secara otomatis.</Text>
            </View>
          </View>
        ) : (
          recentTransactions.map(tx => {
            const isIncome = tx.categories?.type === 'income';
            return (
              <View key={tx.id} style={styles.txItem}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, { backgroundColor: isIncome ? COLORS.greenBg : COLORS.redBg }]}>
                    <Text style={{ fontSize: 20 }}>{tx.categories?.icon || (isIncome ? '💰' : '💸')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>{tx.notes || tx.categories?.name || 'Transaksi'}</Text>
                    <Text style={styles.txSub}>{tx.accounts?.name} • {new Date(tx.transaction_date).toLocaleDateString('id-ID')}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isIncome ? COLORS.green : COLORS.red }]}>
                  {isIncome ? '+' : '-'}{fmt(tx.amount)}
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
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  dateText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  // Saldo Card
  saldoCard: { backgroundColor: COLORS.gradientMid, borderRadius: 20, padding: 20, marginBottom: 24 },
  saldoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saldoLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  saldoAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
  saldoSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  saldoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saldoStat: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  saldoStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  saldoStatValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.purple },
  // Wallet
  walletScroll: { marginBottom: 24 },
  walletCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginRight: 12, width: 120, minHeight: 110, justifyContent: 'center' },
  walletLogo: { width: 32, height: 32, borderRadius: 16, marginBottom: 8 },
  walletName: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', marginTop: 4 },
  walletBalance: { fontSize: 12, color: COLORS.green, fontWeight: 'bold', marginTop: 4 },
  walletAddCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, width: 100, minHeight: 110, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  walletAddText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  // Transactions
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, padding: 14, borderRadius: 14, marginBottom: 8 },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  txSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold' },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
  voiceHint: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center', width: '100%' },
  voiceHintText: { fontSize: 14, fontWeight: '600', color: COLORS.purple },
  voiceHintSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
});
