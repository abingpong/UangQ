import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ReportScreen() {
  const { user } = useAuth();
  const { colors, formatCurrency } = useTheme();
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    if (user) {
      // Simulate data fetch based on period
      setLoading(true);
      setTimeout(() => {
        setTotalIncome(5000000);
        setTotalExpense(3200000);
        setLoading(false);
      }, 800);
    }
  }, [user, period]);

  const FilterPill = ({ label, value }: any) => (
    <TouchableOpacity
      style={[styles.filterPill, { borderColor: colors.border }, period === value && { backgroundColor: colors.purple, borderColor: colors.purple }]}
      onPress={() => setPeriod(value)}
    >
      <Text style={[styles.filterText, { color: colors.textSecondary }, period === value && { color: '#fff', fontWeight: 'bold' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Laporan Keuangan</Text>
        <TouchableOpacity><Filter size={20} color={colors.textPrimary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity style={[styles.periodNav, { backgroundColor: colors.bgCard }]}><ChevronLeft size={20} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={[styles.periodTitle, { color: colors.textPrimary }]}>Agustus 2023</Text>
          <TouchableOpacity style={[styles.periodNav, { backgroundColor: colors.bgCard }]}><ChevronRight size={20} color={colors.textPrimary} /></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <FilterPill label="Harian" value="daily" />
          <FilterPill label="Mingguan" value="weekly" />
          <FilterPill label="Bulanan" value="monthly" />
          <FilterPill label="Custom" value="custom" />
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} /> : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderTopColor: colors.green, borderTopWidth: 4 }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Pemasukan</Text>
                <Text style={[styles.summaryValue, { color: colors.green }]}>{formatCurrency(totalIncome)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderTopColor: colors.red, borderTopWidth: 4 }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Pengeluaran</Text>
                <Text style={[styles.summaryValue, { color: colors.red }]}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>

            {/* Net Income */}
            <View style={[styles.netIncomeCard, { backgroundColor: colors.purple }]}>
              <Text style={styles.netIncomeLabel}>Laba Bersih</Text>
              <Text style={styles.netIncomeValue}>{formatCurrency(totalIncome - totalExpense)}</Text>
            </View>

            {/* Placeholder Chart Area */}
            <View style={[styles.chartArea, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Tren Arus Kas</Text>
              <View style={[styles.chartPlaceholder, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary }}>[Area Grafik Batang / Garis]</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8 }}>Membutuhkan library seperti react-native-chart-kit</Text>
              </View>
            </View>

            {/* Export Section */}
            <TouchableOpacity style={[styles.exportCard, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
              <View style={[styles.exportIcon, { backgroundColor: colors.bgCard }]}><Download size={24} color={colors.purple} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportTitle, { color: colors.textPrimary }]}>Unduh Laporan</Text>
                <Text style={[styles.exportSub, { color: colors.textSecondary }]}>Export data ke PDF atau Excel (.csv)</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  periodSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  periodNav: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  periodTitle: { fontSize: 16, fontWeight: 'bold' },
  filterScroll: { flexDirection: 'row', marginBottom: 24, maxHeight: 40 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, height: 36, justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '500' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, marginRight: 8 },
  summaryLabel: { fontSize: 11, marginBottom: 8, fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  netIncomeCard: { padding: 20, borderRadius: 16, marginBottom: 24, alignItems: 'center' },
  netIncomeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  netIncomeValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  chartArea: { padding: 16, borderRadius: 16, marginBottom: 24 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  chartPlaceholder: { height: 200, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  exportCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  exportIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  exportTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  exportSub: { fontSize: 12 },
});
