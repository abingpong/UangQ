import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet, Trash2, CheckCircle2, ArrowLeft, Banknote, CreditCard, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BANK_PROVIDERS, EWALLET_PROVIDERS, PROVIDER_LOGOS } from '../constants/theme';

export default function AccountsScreen() {
  const { user } = useAuth();
  const { colors, formatCurrency } = useTheme();
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('bank');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');

  useEffect(() => { fetchAccounts(); }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    if (!error) setAccounts(data || []);
    setLoading(false);
  };

  const handleProviderSelect = (p: any) => { setSelectedProvider(p.code); setNewAccountName(p.name); };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) { Alert.alert('Error', 'Nama akun wajib diisi'); return; }
    setLoading(true);
    const balance = parseFloat(initialBalance) || 0;
    const { error } = await supabase.from('accounts').insert({ user_id: user?.id, name: newAccountName, type: newAccountType, provider_code: selectedProvider || null, current_balance: balance });
    if (!error) { 
      setNewAccountName(''); 
      setSelectedProvider(''); 
      setInitialBalance('0');
      setIsAdding(false); 
      fetchAccounts(); 
    }
    else { Alert.alert('Error', error.message); setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Hapus Akun', 'Yakin? Semua transaksi di akun ini akan ikut terhapus.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { setLoading(true); await supabase.from('accounts').delete().eq('id', id); fetchAccounts(); } }
    ]);
  };

  const renderAccountLogo = (providerCode: string, type: string) => {
    if (providerCode && PROVIDER_LOGOS[providerCode]) {
      const p = PROVIDER_LOGOS[providerCode];
      return (
        <View style={[styles.cardLogo, { backgroundColor: p.color }]}>
          <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
        </View>
      );
    }
    
    const p = PROVIDER_LOGOS[type] || PROVIDER_LOGOS['cash'];
    return (
      <View style={[styles.cardLogo, { backgroundColor: p.color }]}>
        <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
      </View>
    );
  };

  const providers = newAccountType === 'bank' ? BANK_PROVIDERS : newAccountType === 'ewallet' ? EWALLET_PROVIDERS : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={colors.textSecondary} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Dompet Saya</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}><Plus size={24} color={colors.purple} /></TouchableOpacity>
      </View>

      {isAdding && (
        <ScrollView style={styles.formScroll}>
          <View style={[styles.form, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tipe</Text>
            <View style={styles.typeRow}>
              {['cash', 'ewallet', 'bank', 'investment'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }, newAccountType === t && { borderColor: colors.purple, backgroundColor: colors.bgInput }]}
                  onPress={() => { setNewAccountType(t); setSelectedProvider(''); setNewAccountName(t === 'cash' ? 'Cash' : ''); }}>
                  <Text style={[styles.typeBtnText, { color: colors.textSecondary }, newAccountType === t && { color: colors.purple }]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {providers.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Pilih Provider</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {providers.map(p => {
                    const logoData = PROVIDER_LOGOS[p.code];
                    return (
                    <TouchableOpacity key={p.code} style={[styles.providerCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, selectedProvider === p.code && { borderColor: colors.purple }]} onPress={() => handleProviderSelect(p)}>
                      <View style={[styles.providerImgContainer, { backgroundColor: logoData?.color || colors.purple }]}>
                        <Text style={{ fontSize: 16 }}>{logoData?.emoji || '🏦'}</Text>
                      </View>
                      <Text style={[styles.providerName, { color: colors.textPrimary }]}>{p.name}</Text>
                      {selectedProvider === p.code && <View style={styles.checkIcon}><CheckCircle2 size={14} color={colors.purple} /></View>}
                    </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Akun</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]} value={newAccountName} onChangeText={setNewAccountName} placeholder="Contoh: BCA, Cash" placeholderTextColor={colors.textMuted} />
            
            <Text style={[styles.label, { color: colors.textSecondary }]}>Saldo Awal (Nominal)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]} value={initialBalance} onChangeText={setInitialBalance} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textMuted} />
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.purple }]} onPress={handleAddAccount}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {loading && !isAdding ? <ActivityIndicator color={colors.purple} style={{ marginTop: 24 }} /> : (
        <FlatList data={accounts} keyExtractor={i => i.id} contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
              <View style={styles.cardLeft}>
                {renderAccountLogo(item.provider_code, item.type)}
                <View>
                  <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.cardType, { color: colors.textSecondary }]}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardBalance, { color: colors.green }]}>{formatCurrency(item.current_balance)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color={colors.red} /></TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada dompet. Tambahkan sekarang!</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  formScroll: { maxHeight: 500 },
  form: { padding: 20, borderBottomWidth: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  typeBtnText: { fontSize: 10, fontWeight: '700' },
  providerCard: { borderWidth: 1, borderRadius: 12, padding: 10, marginRight: 10, alignItems: 'center', width: 75, height: 85 },
  providerImgContainer: { width: 32, height: 32, borderRadius: 16, marginBottom: 6, justifyContent: 'center', alignItems: 'center' },
  providerName: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  checkIcon: { position: 'absolute', top: 3, right: 3 },
  saveBtn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardLogo: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardType: { fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardBalance: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { },
});
