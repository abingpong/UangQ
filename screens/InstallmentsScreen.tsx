import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CreditCard, Trash2, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function InstallmentsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add new state
  const [isAdding, setIsAdding] = useState(false);
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');

  useEffect(() => {
    fetchInstallments();
  }, [user]);

  const fetchInstallments = async () => {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInstallments(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstallment = async () => {
    if (!itemName || !totalAmount || !monthlyPayment) {
      Alert.alert('Error', 'Item name, Total Amount, and Monthly Payment are required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('installments').insert({
        user_id: user?.id,
        item_name: itemName,
        total_amount: parseFloat(totalAmount),
        monthly_payment: parseFloat(monthlyPayment),
        amount_paid: parseFloat(amountPaid) || 0,
      });
      if (error) throw error;
      
      setItemName('');
      setTotalAmount('');
      setMonthlyPayment('');
      setAmountPaid('0');
      setIsAdding(false);
      fetchInstallments();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Installment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('installments').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          fetchInstallments();
        }
      }
    ]);
  };

  const handlePayInstallment = async (item: any) => {
    const newAmountPaid = Number(item.amount_paid) + Number(item.monthly_payment);
    const cappedAmountPaid = Math.min(newAmountPaid, Number(item.total_amount));
    
    setLoading(true);
    const { error } = await supabase
      .from('installments')
      .update({ amount_paid: cappedAmountPaid })
      .eq('id', item.id);
      
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      fetchInstallments();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Installments</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Plus color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <Text style={styles.label}>Item Name (e.g. iPhone 15)</Text>
          <TextInput style={styles.input} value={itemName} onChangeText={setItemName} />
          
          <Text style={styles.label}>Total Debt Amount</Text>
          <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />
          
          <Text style={styles.label}>Monthly Payment</Text>
          <TextInput style={styles.input} value={monthlyPayment} onChangeText={setMonthlyPayment} keyboardType="numeric" />

          <Text style={styles.label}>Already Paid (Optional)</Text>
          <TextInput style={styles.input} value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" />

          <TouchableOpacity style={styles.submitButton} onPress={handleAddInstallment}>
            <Text style={styles.submitButtonText}>Save Installment</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !isAdding ? (
        <ActivityIndicator color="#ef4444" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={installments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const progress = (Number(item.amount_paid) / Number(item.total_amount)) * 100;
            const isCompleted = progress >= 100;

            return (
              <View style={[styles.card, isCompleted && { opacity: 0.7 }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconContainer}>
                      <CreditCard color="#ef4444" size={24} />
                    </View>
                    <View>
                      <Text style={styles.itemName}>{item.item_name}</Text>
                      <Text style={styles.monthlyText}>{formatCurrency(item.monthly_payment)} / month</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Trash2 color="#94a3b8" size={20} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.detailLabel}>Paid: {formatCurrency(item.amount_paid)}</Text>
                    <Text style={styles.detailLabel}>Total: {formatCurrency(item.total_amount)}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle color="#10b981" size={16} style={{ marginRight: 4 }} />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.payButton} onPress={() => handlePayInstallment(item)}>
                      <Text style={styles.payButtonText}>Pay {formatCurrency(item.monthly_payment)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active installments found.</Text>
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
  addForm: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 12, borderRadius: 8, marginBottom: 16 },
  submitButton: { backgroundColor: '#ef4444', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  listContainer: { padding: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  monthlyText: { fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: '600' },
  deleteButton: { padding: 4 },
  progressContainer: { marginBottom: 16 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ef4444', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#64748b' },
  payButton: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  payButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  completedText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyStateText: { color: '#64748b' },
});
