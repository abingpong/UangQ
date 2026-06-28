import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, MailCheck } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  async function signUpWithEmail() {
    setErrorMessage('');
    if (!username.trim()) { setErrorMessage('Username wajib diisi.'); return; }
    if (username.includes(' ')) { setErrorMessage('Username tidak boleh ada spasi.'); return; }
    if (password !== confirmPassword) { setErrorMessage('Password tidak cocok!'); return; }
    if (password.length < 6) { setErrorMessage('Password minimal 6 karakter.'); return; }

    setLoading(true);
    const { data: existing } = await supabase.from('profiles').select('username').eq('username', username.toLowerCase().trim()).single();
    if (existing) { setErrorMessage('Username sudah dipakai.'); setLoading(false); return; }

    const { data: { session, user }, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErrorMessage(error.message); }
    else if (user) {
      await supabase.from('profiles').insert({ id: user.id, username: username.toLowerCase().trim(), email: email.toLowerCase().trim() });
      if (!session) setSuccess(true);
      else navigation.navigate('Login');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <MailCheck size={64} color={COLORS.green} />
          <Text style={styles.successTitle}>Cek Email Anda</Text>
          <Text style={styles.successSub}>Kami telah mengirim link verifikasi ke {email}. Klik link tersebut untuk mengaktifkan akun.</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.iconWrap}><UserPlus size={40} color={COLORS.purple} /></View>
          <Text style={styles.title}>Buat Akun</Text>
          <Text style={styles.subtitle}>Daftar untuk mulai mengelola keuangan</Text>
        </View>

        {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} onChangeText={setUsername} value={username} placeholder="johndoe" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} onChangeText={setEmail} value={email} placeholder="email@address.com" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} onChangeText={setPassword} value={password} placeholder="Password" placeholderTextColor={COLORS.textMuted} secureTextEntry autoCapitalize="none" />

        <Text style={styles.label}>Konfirmasi Password</Text>
        <TextInput style={styles.input} onChangeText={setConfirmPassword} value={confirmPassword} placeholder="Ketik ulang password" placeholderTextColor={COLORS.textMuted} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={signUpWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Daftar</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Masuk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 24, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 12, fontSize: 16, color: COLORS.textPrimary, marginBottom: 16 },
  button: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: COLORS.textSecondary },
  link: { color: COLORS.purple, fontWeight: '600' },
  errorBox: { backgroundColor: COLORS.redBg, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: 13, textAlign: 'center' },
});
