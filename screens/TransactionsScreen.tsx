import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, Wallet } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [type, setType] = useState('expense'); // expense or income

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch Accounts
      const { data: accountsData } = await supabase.from('accounts').select('*').eq('user_id', user?.id);
      setAccounts(accountsData || []);
      if (accountsData && accountsData.length > 0) setSelectedAccountId(accountsData[0].id);

      // Fetch Categories
      const { data: categoriesData } = await supabase.from('categories').select('*');
      setCategories(categoriesData || []);

      // Fetch Transactions
      if (accountsData && accountsData.length > 0) {
        const accIds = accountsData.map(a => a.id);
        const { data: txData } = await supabase
          .from('transactions')
          .select('*, categories(*), accounts(*)')
          .in('account_id', accIds)
          .order('transaction_date', { ascending: false });
        setTransactions(txData || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !selectedAccountId) {
      Alert.alert('Error', 'Amount and Account are required');
      return;
    }
    setLoading(true);
    
    // Default category if none selected
    let catId = selectedCategoryId;
    if (!catId) {
      const defaultCat = categories.find(c => c.type === type);
      if (defaultCat) catId = defaultCat.id;
    }

    try {
      const numAmount = parseFloat(amount);
      
      const { error } = await supabase.from('transactions').insert({
        account_id: selectedAccountId,
        category_id: catId || null,
        amount: numAmount,
        transaction_date: new Date(txDate).toISOString(),
        notes: notes,
      });
      if (error) throw error;
      
      // Update account balance
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account) {
        const newBalance = type === 'income' 
          ? Number(account.current_balance) + numAmount 
          : Number(account.current_balance) - numAmount;
          
        await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      }

      setAmount('');
      setNotes('');
      setTxDate(new Date().toISOString().split('T')[0]);
      setIsAdding(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (tx: any) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            // Revert balance
            const account = accounts.find(a => a.id === tx.account_id);
            if (account) {
              const revertAmount = tx.categories?.type === 'income' 
                ? Number(account.current_balance) - tx.amount 
                : Number(account.current_balance) + tx.amount;
              await supabase.from('accounts').update({ current_balance: revertAmount }).eq('id', tx.account_id);
            }
            fetchData();
          }
        }
      }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Plus color="#2563eb" size={24} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <ScrollView style={styles.addFormScrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.addForm}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonExpenseActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && { color: '#ef4444' }]}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonIncomeActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && { color: '#10b981' }]}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
            <View style={styles.dateContainer}>
              <Calendar color="#64748b" size={20} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateInput}
                value={txDate}
                onChangeText={setTxDate}
                placeholder="2023-12-31"
              />
            </View>

            <Text style={styles.label}>Nominal (Rp)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Contoh: 50000"
              keyboardType="numeric"
            />
            
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
              {filteredCategories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.catChip, selectedCategoryId === cat.id && styles.catChipActive]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon || '📌'}</Text>
                  <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Sumber Dana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={[styles.accountChip, selectedAccountId === acc.id && styles.accountChipActive]}
                  onPress={() => setSelectedAccountId(acc.id)}
                >
                  {acc.provider_code ? (
                    <Image source={{ uri: `https://logo.clearbit.com/${acc.provider_code}` }} style={styles.accountLogo} />
                  ) : (
                    <Wallet size={16} color={selectedAccountId === acc.id ? "#2563eb" : "#64748b"} style={{marginRight: 6}} />
                  )}
                  <Text style={[styles.chipText, selectedAccountId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Keterangan Tambahan</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Contoh: Makan siang bareng teman"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction}>
              <Text style={styles.submitButtonText}>Simpan Transaksi</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {loading && !isAdding ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
      ) : !isAdding && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isIncome = item.categories?.type === 'income';
            return (
              <View style={styles.txCard}>
                <View style={styles.txInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: isIncome ? '#d1fae5' : '#fee2e2' }]}>
                    {item.categories?.icon ? (
                      <Text style={{fontSize: 24}}>{item.categories.icon}</Text>
                    ) : (
                      isIncome ? <ArrowDownCircle color="#10b981" size={24} /> : <ArrowUpCircle color="#ef4444" size={24} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.txNotes}>{item.notes || item.categories?.name || 'Transaction'}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                      {item.accounts?.provider_code ? (
                        <Image source={{ uri: `https://logo.clearbit.com/${item.accounts.provider_code}` }} style={styles.smallLogo} />
                      ) : null}
                      <Text style={styles.txDetails}>{item.accounts?.name} • {new Date(item.transaction_date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isIncome ? '#10b981' : '#ef4444' }]}>
                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                    <Trash2 color="#94a3b8" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Belum ada transaksi.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 8 },
  backButtonText: { color: '#64748b', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  addButton: { padding: 8 },
  addFormScrollView: { maxHeight: '100%' },
  addForm: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  typeSelector: { flexDirection: 'row', marginBottom: 16 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  typeButtonExpenseActive: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  typeButtonIncomeActive: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  typeButtonText: { fontWeight: '600', color: '#64748b' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, marginBottom: 16 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, borderRadius: 8, marginBottom: 16 },
  dateInput: { flex: 1, paddingVertical: 12 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 },
  scrollSelector: { marginBottom: 20, flexDirection: 'row', paddingBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f8fafc', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  catIcon: { fontSize: 16, marginRight: 6 },
  accountChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f8fafc', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  accountChipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  accountLogo: { width: 16, height: 16, borderRadius: 8, marginRight: 6 },
  chipText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#2563eb' },
  submitButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  listContainer: { padding: 24 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  txInfo: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { padding: 10, borderRadius: 12, marginRight: 12, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  txNotes: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  txDetails: { fontSize: 12, color: '#64748b' },
  smallLogo: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  deleteButton: { padding: 4 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyStateText: { color: '#64748b' },
});
