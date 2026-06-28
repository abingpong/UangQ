import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleUpdate = async () => {
    if (password !== confirmPassword) { Alert.alert('Error', 'Password tidak cocok'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password minimal 6 karakter'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Berhasil', 'Password berhasil diubah'); navigation.goBack(); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.iconWrap}><Lock size={40} color={COLORS.purple} /></View>
        <Text style={styles.title}>Ubah Password</Text>
        <Text style={styles.subtitle}>Masukkan password baru Anda</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password baru" placeholderTextColor={COLORS.textMuted} secureTextEntry autoCapitalize="none" />
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Konfirmasi password" placeholderTextColor={COLORS.textMuted} secureTextEntry autoCapitalize="none" />
        <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Simpan Password</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  back: { padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 12, fontSize: 16, color: COLORS.textPrimary, width: '100%', marginBottom: 16 },
  button: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
