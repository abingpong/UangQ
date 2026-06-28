import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants/theme';
import { ChevronRight, ChevronDown, ChevronUp, LogOut, User, RefreshCw, Cloud, Palette, Shield, Sliders, Wallet, CreditCard } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SectionKey = 'account' | 'finance' | 'appearance' | 'security' | 'advanced';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [username, setUsername] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    account: true,
    finance: false,
    appearance: false,
    security: false,
    advanced: false,
  });

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
        if (data) setUsername(data.username);
      });
    }
  }, [user]);

  const toggleSection = (key: SectionKey) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);
  };

  const SectionHeader = ({ title, color, sectionKey }: { title: string; color: string; sectionKey: SectionKey }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sectionKey)}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {expandedSections[sectionKey] ? <ChevronUp size={20} color={color} /> : <ChevronDown size={20} color={color} />}
    </TouchableOpacity>
  );

  const MenuItem = ({ icon, title, subtitle, onPress, rightElement }: { icon: React.ReactNode; title: string; subtitle?: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <ChevronRight size={18} color={COLORS.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Pengaturan</Text>

        {/* AKUN & PROFIL */}
        <SectionHeader title="AKUN & PROFIL" color={COLORS.green} sectionKey="account" />
        {expandedSections.account && (
          <View style={styles.sectionContent}>
            <MenuItem
              icon={<Cloud size={20} color={COLORS.green} />}
              title="Sinkronisasi Awan"
              subtitle={user?.email || 'Belum terhubung'}
            />
            <MenuItem
              icon={<RefreshCw size={20} color={COLORS.blueBright} />}
              title="Sinkronisasi Manual"
              subtitle="Paksa simpan data ke awan sekarang"
              onPress={() => Alert.alert('Sinkronisasi', 'Data telah disinkronkan!')}
            />
            <MenuItem
              icon={<LogOut size={20} color={COLORS.red} />}
              title="Keluar / Sign Out"
              subtitle="Hapus sesi login dari perangkat ini"
              onPress={handleSignOut}
            />
            <MenuItem
              icon={<User size={20} color={COLORS.purple} />}
              title="Nama Profil"
              subtitle={username || user?.email?.split('@')[0] || 'User'}
            />
          </View>
        )}

        {/* PENGELOLAAN KEUANGAN */}
        <SectionHeader title="PENGELOLAAN KEUANGAN" color={COLORS.red} sectionKey="finance" />
        {expandedSections.finance && (
          <View style={styles.sectionContent}>
            <MenuItem
              icon={<Wallet size={20} color={COLORS.purple} />}
              title="Kelola Dompet"
              subtitle="Cash, E-Wallet, Bank, Investasi"
              onPress={() => navigation.navigate('Accounts')}
            />
            <MenuItem
              icon={<CreditCard size={20} color={COLORS.blueBright} />}
              title="Kelola Kategori"
              subtitle="Atur kategori pemasukan & pengeluaran"
            />
          </View>
        )}

        {/* TAMPILAN & FORMAT */}
        <SectionHeader title="TAMPILAN & FORMAT" color={COLORS.yellow} sectionKey="appearance" />
        {expandedSections.appearance && (
          <View style={styles.sectionContent}>
            <MenuItem
              icon={<Palette size={20} color={COLORS.yellow} />}
              title="Tema Gelap"
              subtitle="Aktif (Dark Mode)"
            />
            <MenuItem
              icon={<Sliders size={20} color={COLORS.textSecondary} />}
              title="Format Mata Uang"
              subtitle="Rupiah (IDR)"
            />
          </View>
        )}

        {/* KEAMANAN & PRIVASI */}
        <SectionHeader title="KEAMANAN & PRIVASI" color={COLORS.blueBright} sectionKey="security" />
        {expandedSections.security && (
          <View style={styles.sectionContent}>
            <MenuItem
              icon={<Shield size={20} color={COLORS.blueBright} />}
              title="Ubah Password"
              subtitle="Ganti password akun Anda"
              onPress={() => navigation.navigate('UpdatePassword')}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, paddingTop: 12, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  sectionContent: { paddingBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
