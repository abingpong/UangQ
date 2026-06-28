import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Image, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Wallet, Trash2, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

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
  
  // Add new account state
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('bank'); // bank, ewallet, cash
  const [selectedProvider, setSelectedProvider] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      Alert.alert('Error fetching accounts', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: any) => {
    setSelectedProvider(provider.code);
    setNewAccountName(provider.name);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      Alert.alert('Validation Error', 'Account name is required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('accounts').insert({
        user_id: user?.id,
        name: newAccountName,
        type: newAccountType,
        provider_code: selectedProvider || null,
        current_balance: 0,
      });
      if (error) throw error;
      
      setNewAccountName('');
      setSelectedProvider('');
      setIsAdding(false);
      fetchAccounts();
    } catch (error: any) {
      Alert.alert('Error adding account', error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Account', 'Are you sure? This will delete all transactions in this account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('accounts').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
          } else {
            fetchAccounts();
          }
        }
      }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const renderProviderSelector = () => {
    if (newAccountType === 'cash') return null;
    
    const providers = newAccountType === 'bank' ? BANK_PROVIDERS : EWALLET_PROVIDERS;
    
    return (
      <View style={styles.providerContainer}>
        <Text style={styles.label}>Select Provider</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
          {providers.map((p) => (
            <TouchableOpacity 
              key={p.code} 
              style={[styles.providerCard, selectedProvider === p.code && styles.providerCardActive]}
              onPress={() => handleProviderSelect(p)}
            >
              <Image source={{ uri: `https://logo.clearbit.com/${p.code}` }} style={styles.providerImage} />
              <Text style={styles.providerName}>{p.name}</Text>
              {selectedProvider === p.code && (
                <View style={styles.checkIcon}>
                  <CheckCircle2 size={16} color="#2563eb" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Accounts</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Plus color="#2563eb" size={24} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeSelector}>
            {['bank', 'ewallet', 'cash'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, newAccountType === type && styles.typeButtonActive]}
                onPress={() => {
                  setNewAccountType(type);
                  setSelectedProvider('');
                  setNewAccountName(type === 'cash' ? 'Cash Wallet' : '');
                }}
              >
                <Text style={[styles.typeButtonText, newAccountType === type && styles.typeButtonTextActive]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {renderProviderSelector()}

          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={newAccountName}
            onChangeText={setNewAccountName}
            placeholder="e.g. BCA, OVO, Cash Wallet"
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handleAddAccount}>
            <Text style={styles.submitButtonText}>Save Account</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !isAdding ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View style={styles.iconContainer}>
                  {item.provider_code ? (
                     <Image source={{ uri: `https://logo.clearbit.com/${item.provider_code}` }} style={styles.accountLogo} />
                  ) : (
                     <Wallet color="#2563eb" size={24} />
                  )}
                </View>
                <View>
                  <Text style={styles.accountName}>{item.name}</Text>
                  <Text style={styles.accountType}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountBalance}>{formatCurrency(item.current_balance)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No accounts found. Add one to get started.</Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addButton: {
    padding: 8,
  },
  addForm: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#2563eb',
  },
  providerContainer: {
    marginBottom: 16,
  },
  providerScroll: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  providerCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 80,
    height: 90,
  },
  providerCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  providerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: '#334155',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 24,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  accountType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#64748b',
  },
});
