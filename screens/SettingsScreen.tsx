import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ChevronRight, LogOut, User, Palette, Sliders, ArrowLeft, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, currency, setCurrency, colors } = useTheme();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setUsername(data.username);
          setNewUsername(data.username);
        }
      });
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.includes(' ')) {
      Alert.alert('Error', 'Username tidak valid (jangan pakai spasi)');
      return;
    }
    const { data: existing } = await supabase.from('profiles').select('username').eq('username', newUsername.toLowerCase()).single();
    if (existing && existing.username !== username) {
      Alert.alert('Error', 'Username sudah dipakai');
      return;
    }

    const { error } = await supabase.from('profiles').update({ username: newUsername.toLowerCase() }).eq('id', user?.id);
    if (!error) {
      setUsername(newUsername.toLowerCase());
      setShowUsernameModal(false);
      Alert.alert('Berhasil', 'Username diubah');
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: colors.bgCard }]}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Pengaturan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AKUN</Text>
        <MenuItem
          icon={<User size={20} color={colors.purple} />}
          title="Nama Profil (Username)"
          subtitle={username || user?.email?.split('@')[0]}
          onPress={() => setShowUsernameModal(true)}
        />
        <MenuItem
          icon={<LogOut size={20} color={colors.red} />}
          title="Keluar / Sign Out"
          subtitle={user?.email}
          onPress={handleSignOut}
        />

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 24 }]}>TAMPILAN & FORMAT</Text>
        <MenuItem
          icon={<Palette size={20} color={colors.yellow} />}
          title="Tema Aplikasi"
          subtitle={theme.charAt(0).toUpperCase() + theme.slice(1)}
          onPress={() => setShowThemeModal(true)}
        />
        <MenuItem
          icon={<Sliders size={20} color={colors.blueBright} />}
          title="Mata Uang"
          subtitle={currency === 'IDR' ? 'Rupiah (IDR)' : 'US Dollar (USD)'}
          onPress={() => setShowCurrencyModal(true)}
        />
      </ScrollView>

      {/* Modals */}
      <Modal visible={showUsernameModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ubah Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.textPrimary }]}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Username baru"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.bgInput }]} onPress={() => setShowUsernameModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.purple }]} onPress={handleUpdateUsername}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Pilih Tema</Text>
            {['dark', 'light', 'ocean', 'forest'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeOption, { borderBottomColor: colors.border }]}
                onPress={() => { setTheme(t as any); setShowThemeModal(false); }}
              >
                <Text style={{ color: colors.textPrimary, textTransform: 'capitalize' }}>{t}</Text>
                {theme === t && <Check size={20} color={colors.purple} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setShowThemeModal(false)}>
              <Text style={{ color: colors.red, fontWeight: '600' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCurrencyModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Pilih Mata Uang</Text>
            {['IDR', 'USD'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.themeOption, { borderBottomColor: colors.border }]}
                onPress={() => { setCurrency(c as any); setShowCurrencyModal(false); }}
              >
                <Text style={{ color: colors.textPrimary }}>{c}</Text>
                {currency === c && <Check size={20} color={colors.purple} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setShowCurrencyModal(false)}>
              <Text style={{ color: colors.red, fontWeight: '600' }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  themeOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
});
