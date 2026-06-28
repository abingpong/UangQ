import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function InvestmentsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add new state
  const [isAdding, setIsAdding] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('stock'); // stock, bond, money_market
  const [totalInvested, setTotalInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  useEffect(() => {
    fetchInvestments();
  }, [user]);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvestments(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async () => {
    if (!assetName || !totalInvested || !currentValue) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('investments').insert({
        user_id: user?.id,
        asset_name: assetName,
        asset_type: assetType,
        total_invested: parseFloat(totalInvested),
        current_value: parseFloat(currentValue),
      });
      if (error) throw error;
      
      setAssetName('');
      setTotalInvested('');
      setCurrentValue('');
      setIsAdding(false);
      fetchInvestments();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Investment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('investments').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          fetchInvestments();
        }
      }
    ]);
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
        <Text style={styles.headerTitle}>Investments</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Plus color="#10b981" size={24} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <Text style={styles.label}>Asset Name</Text>
          <TextInput style={styles.input} value={assetName} onChangeText={setAssetName} placeholder="e.g. BBCA, SBN, Sucor" />
          
          <Text style={styles.label}>Asset Type</Text>
          <View style={styles.typeSelector}>
            {['stock', 'bond', 'money_market'].map((type) => (
              <TouchableOpacity key={type} style={[styles.typeButton, assetType === type && styles.typeButtonActive]} onPress={() => setAssetType(type)}>
                <Text style={[styles.typeButtonText, assetType === type && styles.typeButtonTextActive]}>{type.replace('_', ' ').toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Total Invested (Modal)</Text>
          <TextInput style={styles.input} value={totalInvested} onChangeText={setTotalInvested} placeholder="Amount" keyboardType="numeric" />
          
          <Text style={styles.label}>Current Value</Text>
          <TextInput style={styles.input} value={currentValue} onChangeText={setCurrentValue} placeholder="Amount" keyboardType="numeric" />

          <TouchableOpacity style={styles.submitButton} onPress={handleAddInvestment}>
            <Text style={styles.submitButtonText}>Save Investment</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !isAdding ? (
        <ActivityIndicator color="#10b981" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={investments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const profit = Number(item.current_value) - Number(item.total_invested);
            const profitPercentage = (profit / Number(item.total_invested)) * 100;
            const isProfit = profit >= 0;
            
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconContainer}>
                      <TrendingUp color="#10b981" size={24} />
                    </View>
                    <View>
                      <Text style={styles.assetName}>{item.asset_name}</Text>
                      <Text style={styles.assetType}>{item.asset_type.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Trash2 color="#ef4444" size={20} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cardBody}>
                  <View>
                    <Text style={styles.detailLabel}>Invested</Text>
                    <Text style={styles.detailValue}>{formatCurrency(item.total_invested)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.detailLabel}>Current</Text>
                    <Text style={styles.detailValue}>{formatCurrency(item.current_value)}</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.detailLabel}>Return</Text>
                  <Text style={[styles.profitText, { color: isProfit ? '#10b981' : '#ef4444' }]}>
                    {isProfit ? '+' : ''}{formatCurrency(profit)} ({isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No investments found.</Text>
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
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  typeButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  typeButtonActive: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  typeButtonText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  typeButtonTextActive: { color: '#10b981' },
  submitButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  listContainer: { padding: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { backgroundColor: '#d1fae5', padding: 12, borderRadius: 12, marginRight: 12 },
  assetName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  assetType: { fontSize: 12, color: '#64748b', marginTop: 4 },
  deleteButton: { padding: 4 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  profitText: { fontSize: 14, fontWeight: 'bold' },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyStateText: { color: '#64748b' },
});
