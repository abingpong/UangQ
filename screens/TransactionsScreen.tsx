import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/theme';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { colors, formatCurrency } = useTheme();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [txType, setTxType] = useState('expense');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, [user]);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*, categories(name, type, icon), accounts(name)').eq('user_id', user?.id).order('transaction_date', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  const fetchAccounts = async () => {
    const { data } = await supabase.from('accounts').select('id, name, current_balance').eq('user_id', user?.id);
    setAccounts(data || []);
    if (data && data.length > 0) setAccountId(data[0].id);
  };

  const handleAdd = async () => {
    if (!amount || !accountId || !categoryName) { Alert.alert('Error', 'Lengkapi data wajib'); return; }
    setLoading(true);
    
    // Auto-create category if doesn't exist
    let category_id = null;
    const { data: catExist } = await supabase.from('categories').select('id').eq('user_id', user?.id).eq('name', categoryName).eq('type', txType).single();
    
    if (catExist) {
      category_id = catExist.id;
    } else {
      const { data: newCat } = await supabase.from('categories').insert({ user_id: user?.id, name: categoryName, type: txType, icon: txType === 'income' ? '💰' : '💸' }).select().single();
      if (newCat) category_id = newCat.id;
    }

    if (category_id) {
      const { error } = await supabase.from('transactions').insert({ user_id: user?.id, account_id: accountId, category_id, amount: parseFloat(amount), notes, transaction_date: new Date().toISOString() });
      if (!error) {
        setIsAdding(false); setAmount(''); setNotes(''); setCategoryName(''); fetchTransactions(); fetchAccounts();
      } else { Alert.alert('Error', error.message); }
    }
    setLoading(false);
  };

  const activeCategories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={colors.textSecondary} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daftar Transaksi</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}>
          {isAdding ? <X size={24} color={colors.red} /> : <Plus size={24} color={colors.purple} />}
        </TouchableOpacity>
      </View>

      {isAdding && (
        <ScrollView style={styles.formScroll}>
          <View style={[styles.form, { borderBottomColor: colors.border }]}>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }, txType === 'expense' && { borderColor: colors.red, backgroundColor: colors.redBg }]} onPress={() => setTxType('expense')}>
                <Text style={[styles.typeBtnText, { color: colors.textSecondary }, txType === 'expense' && { color: colors.red }]}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }, txType === 'income' && { borderColor: colors.green, backgroundColor: colors.greenBg }]} onPress={() => setTxType('income')}>
                <Text style={[styles.typeBtnText, { color: colors.textSecondary }, txType === 'income' && { color: colors.green }]}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nominal</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Pilih Dompet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} style={[styles.accPill, { backgroundColor: colors.bgCard, borderColor: colors.border }, accountId === acc.id && { borderColor: colors.purple }]} onPress={() => setAccountId(acc.id)}>
                  <Text style={[styles.accPillText, { color: colors.textSecondary }, accountId === acc.id && { color: colors.purple }]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
            <TouchableOpacity style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, justifyContent: 'center' }]} onPress={() => setShowCategoryModal(true)}>
              <Text style={{ color: categoryName ? colors.textPrimary : colors.textMuted, fontSize: 16 }}>
                {categoryName || "Pilih Kategori"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Keterangan (Opsional)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]} value={notes} onChangeText={setNotes} placeholder="Beli makan siang..." placeholderTextColor={colors.textMuted} />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: txType === 'income' ? colors.green : colors.red }]} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgPrimary, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.catGrid}>
              {activeCategories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.catItem, { backgroundColor: colors.bgCard, borderColor: colors.border }, categoryName === cat.name && { borderColor: colors.purple }]}
                  onPress={() => { setCategoryName(cat.name); setShowCategoryModal(false); }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</Text>
                  <Text style={{ fontSize: 12, color: colors.textPrimary, textAlign: 'center' }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FlatList data={transactions} keyExtractor={i => i.id} contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isIncome = item.categories?.type === 'income';
          return (
            <View style={[styles.txItem, { backgroundColor: colors.bgCard }]}>
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: isIncome ? colors.greenBg : colors.redBg }]}>
                  <Text style={{ fontSize: 20 }}>{item.categories?.icon || (isIncome ? '💰' : '💸')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{item.notes || item.categories?.name || 'Transaksi'}</Text>
                  <Text style={[styles.txSub, { color: colors.textSecondary }]}>{item.accounts?.name} • {new Date(item.transaction_date).toLocaleDateString('id-ID')}</Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: isIncome ? colors.green : colors.red }]}>
                {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada transaksi</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  formScroll: { maxHeight: 500 },
  form: { padding: 20, borderBottomWidth: 1 },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  typeBtnText: { fontSize: 13, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 16, fontSize: 16 },
  accPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8, height: 40, justifyContent: 'center' },
  accPillText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 20 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 10 },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  txIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  txSub: { fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40 },
  // Modal
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { height: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  catItem: { width: '22%', margin: '1.5%', aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
});
