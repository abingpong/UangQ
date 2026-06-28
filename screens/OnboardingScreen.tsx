import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, TrendingUp, CreditCard, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  { title: 'Catat Semua Keuangan', description: 'Catat semua pemasukan dan pengeluaran Anda dengan mudah dan rapi di satu tempat.', icon: <Wallet size={80} color={COLORS.purple} /> },
  { title: 'Pantau Investasi', description: 'Pantau portofolio investasi Anda, nilai aset saat ini, dan persentase keuntungan secara real-time.', icon: <TrendingUp size={80} color={COLORS.green} /> },
  { title: 'Kelola Cicilan', description: 'Catat cicilan, pantau progres pembayaran, dan pastikan Anda tidak pernah telat bayar.', icon: <CreditCard size={80} color={COLORS.red} /> },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentIndex(Math.round(offsetX / width));
  };

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      await AsyncStorage.setItem('has_seen_onboarding', 'true');
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll}>
        {ONBOARDING_DATA.map((item, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.iconWrap}>{item.icon}</View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>
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
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { backgroundColor: COLORS.bgCard, padding: 32, borderRadius: 100, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  footer: { padding: 24, paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagination: { flexDirection: 'row' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginHorizontal: 4 },
  dotActive: { backgroundColor: COLORS.purple, width: 24 },
  button: { backgroundColor: COLORS.purple, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 4 },
});
