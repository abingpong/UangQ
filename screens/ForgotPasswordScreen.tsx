import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleReset = async () => {
    setErrorMessage('');
    if (!email.trim()) { setErrorMessage('Email wajib diisi'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://uangq.vercel.app/update-password' });
    if (error) setErrorMessage(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.iconWrap}><Mail size={40} color={COLORS.purple} /></View>
        <Text style={styles.title}>{sent ? 'Cek Email Anda' : 'Lupa Password'}</Text>
        <Text style={styles.subtitle}>{sent ? `Link reset telah dikirim ke ${email}` : 'Masukkan email untuk menerima link reset password'}</Text>

        {!sent && (
          <>
            {errorMessage ? <View style={styles.errorBox}><Text style={styles.errorText}>{errorMessage}</Text></View> : null}
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@address.com" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirim Link Reset</Text>}
            </TouchableOpacity>
          </>
        )}
        {sent && (
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Kembali ke Login</Text>
          </TouchableOpacity>
        )}
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 12, fontSize: 16, color: COLORS.textPrimary, width: '100%', marginBottom: 16 },
  button: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorBox: { backgroundColor: COLORS.redBg, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: COLORS.red, width: '100%' },
  errorText: { color: COLORS.red, fontSize: 13, textAlign: 'center' },
});
