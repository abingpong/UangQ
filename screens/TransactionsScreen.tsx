import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, Wallet, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [type, setType] = useState('expense');

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    setAccounts(accs || []);
    if (accs && accs.length > 0) setSelectedAccountId(accs[0].id);
    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);
    if (accs && accs.length > 0) {
      const ids = accs.map(a => a.id);
      const { data: txs } = await supabase.from('transactions').select('*, categories(*), accounts(*)').in('account_id', ids).order('transaction_date', { ascending: false });
      setTransactions(txs || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!amount || !selectedAccountId) { Alert.alert('Error', 'Nominal dan akun wajib diisi'); return; }
    setLoading(true);
    let catId = selectedCategoryId;
    if (!catId) { const dc = categories.find(c => c.type === type); if (dc) catId = dc.id; }
    const numAmount = parseFloat(amount);
    const { error } = await supabase.from('transactions').insert({ account_id: selectedAccountId, category_id: catId || null, amount: numAmount, transaction_date: new Date(txDate).toISOString(), notes });
    if (!error) {
      const acc = accounts.find(a => a.id === selectedAccountId);
      if (acc) {
        const nb = type === 'income' ? Number(acc.current_balance) + numAmount : Number(acc.current_balance) - numAmount;
        await supabase.from('accounts').update({ current_balance: nb }).eq('id', selectedAccountId);
      }
      setAmount(''); setNotes(''); setTxDate(new Date().toISOString().split('T')[0]); setIsAdding(false); fetchData();
    } else { Alert.alert('Error', error.message); setLoading(false); }
  };

  const handleDelete = async (tx: any) => {
    Alert.alert('Hapus Transaksi', 'Yakin?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        setLoading(true);
        await supabase.from('transactions').delete().eq('id', tx.id);
        const acc = accounts.find(a => a.id === tx.account_id);
        if (acc) {
          const rv = tx.categories?.type === 'income' ? Number(acc.current_balance) - tx.amount : Number(acc.current_balance) + tx.amount;
          await supabase.from('accounts').update({ current_balance: rv }).eq('id', tx.account_id);
        }
        fetchData();
      }}
    ]);
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const filteredCats = categories.filter(c => c.type === type);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={COLORS.textSecondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}><Plus size={24} color={COLORS.purple} /></TouchableOpacity>
      </View>

      {isAdding && (
        <ScrollView style={{ maxHeight: '100%' }} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExp]} onPress={() => setType('expense')}>
                <Text style={[styles.typeBtnText, type === 'expense' && { color: COLORS.red }]}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnInc]} onPress={() => setType('income')}>
                <Text style={[styles.typeBtnText, type === 'income' && { color: COLORS.green }]}>Pemasukan</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tanggal</Text>
            <View style={styles.dateRow}>
              <Calendar color={COLORS.textMuted} size={18} style={{ marginRight: 8 }} />
              <TextInput style={styles.dateInput} value={txDate} onChangeText={setTxDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
            </View>

            <Text style={styles.label}>Nominal (Rp)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="50000" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />

            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {filteredCats.map(c => (
                <TouchableOpacity key={c.id} style={[styles.chip, selectedCategoryId === c.id && styles.chipActive]} onPress={() => setSelectedCategoryId(c.id)}>
                  <Text style={styles.chipIcon}>{c.icon || '📌'}</Text>
                  <Text style={[styles.chipText, selectedCategoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Sumber Dana</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {accounts.map(a => (
                <TouchableOpacity key={a.id} style={[styles.chip, selectedAccountId === a.id && styles.chipActive]} onPress={() => setSelectedAccountId(a.id)}>
                  {a.provider_code ? <Image source={{ uri: `https://logo.clearbit.com/${a.provider_code}` }} style={styles.chipLogo} /> : <Wallet size={14} color={selectedAccountId === a.id ? '#fff' : COLORS.textSecondary} style={{ marginRight: 4 }} />}
                  <Text style={[styles.chipText, selectedAccountId === a.id && styles.chipTextActive]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Keterangan</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Makan siang" placeholderTextColor={COLORS.textMuted} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveBtnText}>Simpan Transaksi</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {loading && !isAdding ? <ActivityIndicator color={COLORS.purple} style={{ marginTop: 24 }} /> : !isAdding && (
        <FlatList data={transactions} keyExtractor={i => i.id} contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isInc = item.categories?.type === 'income';
            return (
              <View style={styles.txCard}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIcon, { backgroundColor: isInc ? COLORS.greenBg : COLORS.redBg }]}>
                    {item.categories?.icon ? <Text style={{ fontSize: 20 }}>{item.categories.icon}</Text> : (isInc ? <ArrowDownCircle color={COLORS.green} size={22} /> : <ArrowUpCircle color={COLORS.red} size={22} />)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle} numberOfLines={1}>{item.notes || item.categories?.name || 'Transaksi'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {item.accounts?.provider_code ? <Image source={{ uri: `https://logo.clearbit.com/${item.accounts.provider_code}` }} style={styles.smallLogo} /> : null}
                      <Text style={styles.txSub}>{item.accounts?.name} • {new Date(item.transaction_date).toLocaleDateString('id-ID')}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isInc ? COLORS.green : COLORS.red }]}>{isInc ? '+' : '-'}{fmt(item.amount)}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item)}><Trash2 color={COLORS.textMuted} size={16} /></TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Belum ada transaksi.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  form: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  typeBtnExp: { backgroundColor: COLORS.redBg, borderColor: COLORS.red },
  typeBtnInc: { backgroundColor: COLORS.greenBg, borderColor: COLORS.green },
  typeBtnText: { fontWeight: '600', color: COLORS.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 12, borderRadius: 10, marginBottom: 16, color: COLORS.textPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, borderRadius: 10, marginBottom: 16 },
  dateInput: { flex: 1, paddingVertical: 12, color: COLORS.textPrimary },
  chipScroll: { marginBottom: 16, flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.bgCard, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipIcon: { fontSize: 14, marginRight: 4 },
  chipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipLogo: { width: 14, height: 14, borderRadius: 7, marginRight: 4 },
  saveBtn: { backgroundColor: COLORS.purple, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 20 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, padding: 14, borderRadius: 14, marginBottom: 8 },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  txTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  txSub: { fontSize: 11, color: COLORS.textSecondary },
  smallLogo: { width: 12, height: 12, borderRadius: 6, marginRight: 4 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary },
});
