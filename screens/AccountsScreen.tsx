import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Image, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet, Trash2, CheckCircle2, ArrowLeft, Banknote, CreditCard, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

const BANK_PROVIDERS = [
  { code: 'bca.co.id', name: 'BCA' },
  { code: 'bankmandiri.co.id', name: 'Mandiri' },
  { code: 'bni.co.id', name: 'BNI' },
  { code: 'bri.co.id', name: 'BRI' },
  { code: 'jago.com', name: 'Bank Jago' },
  { code: 'seabank.co.id', name: 'SeaBank' },
];

const EWALLET_PROVIDERS = [
  { code: 'gojek.com', name: 'GoPay' },
  { code: 'ovo.id', name: 'OVO' },
  { code: 'dana.id', name: 'DANA' },
  { code: 'shopee.co.id', name: 'ShopeePay' },
  { code: 'linkaja.id', name: 'LinkAja' },
];

export default function AccountsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('bank');
  const [selectedProvider, setSelectedProvider] = useState('');

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
    const { error } = await supabase.from('accounts').insert({ user_id: user?.id, name: newAccountName, type: newAccountType, provider_code: selectedProvider || null, current_balance: 0 });
    if (!error) { setNewAccountName(''); setSelectedProvider(''); setIsAdding(false); fetchAccounts(); }
    else { Alert.alert('Error', error.message); setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Hapus Akun', 'Yakin? Semua transaksi di akun ini akan ikut terhapus.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { setLoading(true); await supabase.from('accounts').delete().eq('id', id); fetchAccounts(); } }
    ]);
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote size={24} color={COLORS.green} />;
      case 'ewallet': return <Wallet size={24} color={COLORS.blueBright} />;
      case 'bank': return <CreditCard size={24} color={COLORS.purple} />;
      case 'investment': return <TrendingUp size={24} color={COLORS.yellow} />;
      default: return <Wallet size={24} color={COLORS.textSecondary} />;
    }
  };

  const providers = newAccountType === 'bank' ? BANK_PROVIDERS : newAccountType === 'ewallet' ? EWALLET_PROVIDERS : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color={COLORS.textSecondary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Dompet Saya</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)}><Plus size={24} color={COLORS.purple} /></TouchableOpacity>
      </View>

      {isAdding && (
        <ScrollView style={styles.formScroll}>
          <View style={styles.form}>
            <Text style={styles.label}>Tipe</Text>
            <View style={styles.typeRow}>
              {['cash', 'ewallet', 'bank', 'investment'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, newAccountType === t && styles.typeBtnActive]}
                  onPress={() => { setNewAccountType(t); setSelectedProvider(''); setNewAccountName(t === 'cash' ? 'Cash' : ''); }}>
                  <Text style={[styles.typeBtnText, newAccountType === t && styles.typeBtnTextActive]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {providers.length > 0 && (
              <>
                <Text style={styles.label}>Pilih Provider</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {providers.map(p => (
                    <TouchableOpacity key={p.code} style={[styles.providerCard, selectedProvider === p.code && styles.providerCardActive]} onPress={() => handleProviderSelect(p)}>
                      <Image source={{ uri: `https://logo.clearbit.com/${p.code}` }} style={styles.providerImg} />
                      <Text style={styles.providerName}>{p.name}</Text>
                      {selectedProvider === p.code && <View style={styles.checkIcon}><CheckCircle2 size={14} color={COLORS.purple} /></View>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Nama Akun</Text>
            <TextInput style={styles.input} value={newAccountName} onChangeText={setNewAccountName} placeholder="Contoh: BCA, Cash" placeholderTextColor={COLORS.textMuted} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddAccount}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {loading && !isAdding ? <ActivityIndicator color={COLORS.purple} style={{ marginTop: 24 }} /> : (
        <FlatList data={accounts} keyExtractor={i => i.id} contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.cardIcon}>
                  {item.provider_code ? <Image source={{ uri: `https://logo.clearbit.com/${item.provider_code}` }} style={styles.cardLogo} /> : getIcon(item.type)}
                </View>
                <View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardBalance}>{fmt(item.current_balance)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}><Trash2 size={18} color={COLORS.red} /></TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>Belum ada dompet. Tambahkan sekarang!</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  formScroll: { maxHeight: 400 },
  form: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 12, borderRadius: 10, marginBottom: 16, color: COLORS.textPrimary },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: COLORS.bgCard },
  typeBtnActive: { borderColor: COLORS.purple, backgroundColor: 'rgba(124,92,252,0.15)' },
  typeBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.purple },
  providerCard: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, marginRight: 10, alignItems: 'center', width: 75, height: 85 },
  providerCardActive: { borderColor: COLORS.purple },
  providerImg: { width: 28, height: 28, borderRadius: 14, marginBottom: 6 },
  providerName: { fontSize: 9, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  checkIcon: { position: 'absolute', top: 3, right: 3 },
  saveBtn: { backgroundColor: COLORS.purple, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, padding: 14, borderRadius: 14, marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.bgInput, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardLogo: { width: 24, height: 24, borderRadius: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  cardType: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardBalance: { fontSize: 14, fontWeight: 'bold', color: COLORS.green, marginBottom: 6 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary },
});
