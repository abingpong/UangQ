import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  async function signIn() {
    setErrorMessage('');
    setLoading(true);
    let loginEmail = identifier.trim().toLowerCase();

    if (!loginEmail.includes('@')) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', loginEmail)
        .single();
      if (profileError || !data) {
        setErrorMessage('Username tidak ditemukan');
        setLoading(false);
        return;
      }
      loginEmail = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) setErrorMessage(error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.iconWrap}>
            <Wallet size={40} color={COLORS.purple} />
          </View>
          <Text style={styles.title}>Keuanganku</Text>
          <Text style={styles.subtitle}>Masuk untuk mengelola keuangan Anda</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email atau Username</Text>
        <TextInput style={styles.input} onChangeText={setIdentifier} value={identifier} placeholder="username atau email" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />

        <View style={styles.passwordHeader}>
          <Text style={styles.label}>Password</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Lupa?</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} onChangeText={setPassword} value={password} placeholder="Password" placeholderTextColor={COLORS.textMuted} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={signIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Masuk</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Daftar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 12, fontSize: 16, color: COLORS.textPrimary, marginBottom: 16 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { color: COLORS.purple, fontSize: 13, fontWeight: '600' },
  button: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: COLORS.textSecondary },
  link: { color: COLORS.purple, fontWeight: '600' },
  errorBox: { backgroundColor: COLORS.redBg, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 13, textAlign: 'center' },
});
