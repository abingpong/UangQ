import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { LogOut, Wallet, TrendingUp, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netWorth, setNetWorth] = useState(0);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      if (!user) return;

      // 1. Fetch Liquid Accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('user_id', user.id);
      
      const liquidAssets = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;

      // 2. Fetch Investments
      const { data: investments } = await supabase
        .from('investments')
        .select('current_value')
        .eq('user_id', user.id);
      
      const investmentValue = investments?.reduce((sum, inv) => sum + Number(inv.current_value), 0) || 0;
      setTotalInvestments(investmentValue);

      // 3. Fetch Installments (Debt)
      const { data: installments } = await supabase
        .from('installments')
        .select('total_amount, amount_paid')
        .eq('user_id', user.id);
      
      const debtValue = installments?.reduce((sum, inst) => sum + (Number(inst.total_amount) - Number(inst.amount_paid)), 0) || 0;
      setTotalDebt(debtValue);

      setNetWorth(liquidAssets + investmentValue - debtValue);

      // 4. Fetch Recent Transactions
      const { data: accountsIds } = await supabase.from('accounts').select('id').eq('user_id', user.id);
      const accIds = accountsIds?.map(a => a.id) || [];
      
      if (accIds.length > 0) {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*, categories(name, type, icon), accounts(name)')
          .in('account_id', accIds)
          .order('transaction_date', { ascending: false })
          .limit(5);
        
        setRecentTransactions(transactions || []);
      } else {
        setRecentTransactions([]);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.emailText}>{user?.email?.split('@')[0]}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <LogOut size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Net Worth Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Net Worth</Text>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
          ) : (
            <Text style={styles.netWorthAmount}>{formatCurrency(netWorth)}</Text>
          )}
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#10b981" />
              <Text style={styles.statLabel}>Investments: {formatCurrency(totalInvestments)}</Text>
            </View>
            <View style={styles.statItem}>
              <CreditCard size={16} color="#ef4444" />
              <Text style={styles.statLabel}>Debt: {formatCurrency(totalDebt)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Accounts')}>
            <Wallet size={24} color="#2563eb" />
            <Text style={styles.actionText}>Accounts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Investments')}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={styles.actionText}>Investments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Installments')}>
            <CreditCard size={24} color="#ef4444" />
            <Text style={styles.actionText}>Installments</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent transactions found.</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={styles.txLeft}>
                <View style={[styles.iconContainer, { backgroundColor: tx.categories?.type === 'income' ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={styles.iconText}>{tx.categories?.icon || (tx.categories?.type === 'income' ? '↓' : '↑')}</Text>
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.notes || tx.categories?.name || 'Transaction'}</Text>
                  <Text style={styles.txAccount}>{tx.accounts?.name} • {new Date(tx.transaction_date).toLocaleDateString()}</Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: tx.categories?.type === 'income' ? '#10b981' : '#ef4444' }]}>
                {tx.categories?.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardLabel: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '500',
  },
  netWorthAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'column',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  seeAllText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#64748b',
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  txAccount: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
