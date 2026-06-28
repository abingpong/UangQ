import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, TrendingUp, CreditCard, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const ONBOARDING_DATA = [
  { title: 'Catat Semua Keuangan', description: 'Catat semua pemasukan dan pengeluaran Anda dengan mudah dan rapi di satu tempat.', iconType: 'wallet' },
  { title: 'Pantau Investasi', description: 'Pantau portofolio investasi Anda, nilai aset saat ini, dan persentase keuntungan secara real-time.', iconType: 'trending' },
  { title: 'Kelola Cicilan', description: 'Catat cicilan, pantau progres pembayaran, dan pastikan Anda tidak pernah telat bayar.', iconType: 'credit' },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'wallet': return <Wallet size={64} color={COLORS.purple} />;
    case 'trending': return <TrendingUp size={64} color={COLORS.green} />;
    case 'credit': return <CreditCard size={64} color={COLORS.red} />;
    default: return <Wallet size={64} color={COLORS.purple} />;
  }
};

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      navigation.navigate('Login');
    }
  };

  const item = ONBOARDING_DATA[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.slideArea}>
        <View style={styles.iconWrap}>
          {getIcon(item.iconType)}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View key={index} style={[styles.dot, currentIndex === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{currentIndex === ONBOARDING_DATA.length - 1 ? 'Mulai' : 'Lanjut'}</Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  slideArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { backgroundColor: COLORS.bgCard, width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagination: { flexDirection: 'row' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginHorizontal: 4 },
  dotActive: { backgroundColor: COLORS.purple, width: 24 },
  button: { backgroundColor: COLORS.purple, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 4 },
});
