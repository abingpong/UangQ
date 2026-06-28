import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';
import { Mic, MicOff, X, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function VoiceInputScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    setAccounts(accs || []);
    if (accs && accs.length > 0) setSelectedAccountId(accs[0].id);
    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      // Parse the transcript for amount and notes
      parseTranscript(transcript);
    } else {
      setIsListening(true);
      setTranscript('');
      // Note: Web Speech API is used on web, expo-speech for native
      // For now we use manual text input as fallback
    }
  };

  const parseTranscript = (text: string) => {
    // Try to extract numbers from text
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      setAmount(numbers[0]);
    }
    setNotes(text);
  };

  const handleSave = async () => {
    if (!amount || !selectedAccountId) {
      Alert.alert('Error', 'Nominal dan akun harus diisi');
      return;
    }
    setLoading(true);

    const defaultCat = categories.find(c => c.type === type);
    const numAmount = parseFloat(amount);

    try {
      const { error } = await supabase.from('transactions').insert({
        account_id: selectedAccountId,
        category_id: defaultCat?.id || null,
        amount: numAmount,
        transaction_date: new Date().toISOString(),
        notes: notes || 'Voice input',
      });
      if (error) throw error;

      // Update balance
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account) {
        const newBalance = type === 'income'
          ? Number(account.current_balance) + numAmount
          : Number(account.current_balance) - numAmount;
        await supabase.from('accounts').update({ current_balance: newBalance }).eq('id', selectedAccountId);
      }

      Alert.alert('Berhasil!', 'Transaksi berhasil dicatat');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Close button */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <X size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Catat Transaksi</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Mic Button */}
        <View style={styles.micArea}>
          <TouchableOpacity style={[styles.micButton, isListening && styles.micButtonActive]} onPress={toggleListening}>
            {isListening ? <MicOff size={48} color="#fff" /> : <Mic size={48} color="#fff" />}
          </TouchableOpacity>
          <Text style={styles.micHint}>
            {isListening ? 'Sedang mendengarkan... Ketuk untuk berhenti' : 'Ketuk untuk mulai merekam'}
          </Text>
        </View>

        {/* Type selector */}
        <View style={styles.typeRow}>
          <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => setType('expense')}>
            <Text style={[styles.typeBtnText, type === 'expense' && { color: COLORS.red }]}>Pengeluaran</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} onPress={() => setType('income')}>
            <Text style={[styles.typeBtnText, type === 'income' && { color: COLORS.green }]}>Pemasukan</Text>
          </TouchableOpacity>
        </View>

        {/* Manual input */}
        <Text style={styles.label}>Nominal (Rp)</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="50000" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />

        <Text style={styles.label}>Keterangan</Text>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Makan siang" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Sumber Dana</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {accounts.map(a => (
            <TouchableOpacity key={a.id} style={[styles.chip, selectedAccountId === a.id && styles.chipActive]} onPress={() => setSelectedAccountId(a.id)}>
              <Text style={[styles.chipText, selectedAccountId === a.id && styles.chipTextActive]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  micArea: { alignItems: 'center', paddingVertical: 32 },
  micButton: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.purple, justifyContent: 'center', alignItems: 'center' },
  micButtonActive: { backgroundColor: COLORS.red },
  micHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.bgCard, marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.border },
  typeBtnExpense: { backgroundColor: COLORS.redBg, borderColor: COLORS.red },
  typeBtnIncome: { backgroundColor: COLORS.greenBg, borderColor: COLORS.green },
  typeBtnText: { fontWeight: '600', color: COLORS.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 10, marginBottom: 16, color: COLORS.textPrimary, fontSize: 16 },
  filterRow: { marginBottom: 20, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgCard, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
