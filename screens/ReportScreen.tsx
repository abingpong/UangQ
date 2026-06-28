import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 200;

const PERIODS = ['Harian', 'Mingguan', 'Bulanan', 'Custom'];

export default function ReportScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Harian');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [chartData, setChartData] = useState<{label: string; income: number; expense: number}[]>([]);
  const [dateOffset, setDateOffset] = useState(0);

  useEffect(() => {
    fetchFilters();
  }, [user]);

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod, selectedAccountId, selectedCatFilter, dateOffset, accounts]);

  const fetchFilters = async () => {
    if (!user) return;
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id);
    setAccounts(accs || []);
    const { data: cats } = await supabase.from('categories').select('*');
    setCategories(cats || []);
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date, label: string;

    if (selectedPeriod === 'Harian') {
      const d = new Date(now);
      d.setDate(d.getDate() + dateOffset);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      label = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    } else if (selectedPeriod === 'Mingguan') {
      const d = new Date(now);
      d.setDate(d.getDate() + (dateOffset * 7));
      const day = d.getDay();
      start = new Date(d);
      start.setDate(d.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      label = `${start.getDate()}/${start.getMonth() + 1} — ${end.getDate() - 1}/${end.getMonth() + 1}/${end.getFullYear()}`;
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() + dateOffset, 1);
      start = d;
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }

    return { start, end, label };
  };

  const fetchReport = async () => {
    if (!user || accounts.length === 0) return;
    setLoading(true);

    const { start, end } = getDateRange();
    const accIds = selectedAccountId === 'all' ? accounts.map(a => a.id) : [selectedAccountId];

    let query = supabase
      .from('transactions')
      .select('*, categories(name, type, icon)')
      .in('account_id', accIds)
      .gte('transaction_date', start.toISOString())
      .lt('transaction_date', end.toISOString())
      .order('transaction_date', { ascending: true });

    const { data: txs } = await query;
    const filtered = txs || [];

    const finalTxs = selectedCatFilter === 'all' ? filtered : filtered.filter(t => t.category_id === selectedCatFilter);
    setTransactions(finalTxs);

    const inc = finalTxs.filter(t => t.categories?.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = finalTxs.filter(t => t.categories?.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    setTotalIncome(inc);
    setTotalExpense(exp);

    // Build chart data
    buildChartData(finalTxs, start, end);
    setLoading(false);
  };

  const buildChartData = (txs: any[], start: Date, end: Date) => {
    const points: {label: string; income: number; expense: number}[] = [];

    if (selectedPeriod === 'Harian') {
      // Group by hour buckets (6 buckets of 4 hours)
      for (let h = 0; h < 24; h += 4) {
        const bucket = txs.filter(t => {
          const hour = new Date(t.transaction_date).getHours();
          return hour >= h && hour < h + 4;
        });
        points.push({
          label: `${String(h).padStart(2, '0')}:00`,
          income: bucket.filter(t => t.categories?.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expense: bucket.filter(t => t.categories?.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    } else if (selectedPeriod === 'Mingguan') {
      const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + d);
        const bucket = txs.filter(t => {
          const td = new Date(t.transaction_date);
          return td.getDate() === dayDate.getDate() && td.getMonth() === dayDate.getMonth();
        });
        points.push({
          label: dayLabels[d],
          income: bucket.filter(t => t.categories?.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expense: bucket.filter(t => t.categories?.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    } else {
      // Monthly: group by week
      const weeks = 4;
      for (let w = 0; w < weeks; w++) {
        const wStart = new Date(start);
        wStart.setDate(start.getDate() + (w * 7));
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 7);
        const bucket = txs.filter(t => {
          const td = new Date(t.transaction_date);
          return td >= wStart && td < wEnd;
        });
        points.push({
          label: `Mgg ${w + 1}`,
          income: bucket.filter(t => t.categories?.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
          expense: bucket.filter(t => t.categories?.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    }
    setChartData(points);
  };

  const fmt = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}rb`;
    return String(n);
  };

  const fmtFull = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const { label: periodLabel } = getDateRange();

  // Simple chart renderer
  const renderChart = () => {
    if (chartData.length === 0) return null;
    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1);
    const barWidth = Math.floor((CHART_WIDTH - 40) / chartData.length) - 8;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Tren Alur Kas (Pemasukan vs Pengeluaran)</Text>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yLabel}>{fmt(maxVal)}</Text>
            <Text style={styles.yLabel}>{fmt(maxVal * 0.66)}</Text>
            <Text style={styles.yLabel}>{fmt(maxVal * 0.33)}</Text>
            <Text style={styles.yLabel}>0</Text>
          </View>
          {/* Bars */}
          <View style={styles.barsContainer}>
            {chartData.map((d, i) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.barPair}>
                  <View style={[styles.bar, { height: Math.max((d.income / maxVal) * CHART_HEIGHT * 0.8, 2), backgroundColor: COLORS.green }]} />
                  <View style={[styles.bar, { height: Math.max((d.expense / maxVal) * CHART_HEIGHT * 0.8, 2), backgroundColor: COLORS.red }]} />
                </View>
                <Text style={styles.xLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const netProfit = totalIncome - totalExpense;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Laporan Keuangan</Text>

        {/* Export banner */}
        <TouchableOpacity style={styles.exportBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Export PDF & Excel</Text>
            <Text style={styles.exportSub}>Download laporan keuangan Anda</Text>
          </View>
          <Download size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Period tabs */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} style={[styles.periodTab, selectedPeriod === p && styles.periodTabActive]} onPress={() => { setSelectedPeriod(p); setDateOffset(0); }}>
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => setDateOffset(dateOffset - 1)}>
            <ChevronLeft size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.dateNavText}>{periodLabel}</Text>
          <TouchableOpacity onPress={() => setDateOffset(dateOffset + 1)}>
            <ChevronRight size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, selectedAccountId === 'all' && styles.chipActive]} onPress={() => setSelectedAccountId('all')}>
            <Text style={[styles.chipText, selectedAccountId === 'all' && styles.chipTextActive]}>Semua</Text>
          </TouchableOpacity>
          {accounts.map(a => (
            <TouchableOpacity key={a.id} style={[styles.chip, selectedAccountId === a.id && styles.chipActive]} onPress={() => setSelectedAccountId(a.id)}>
              <Text style={[styles.chipText, selectedAccountId === a.id && styles.chipTextActive]}>● {a.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category filter - Income */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, selectedCatFilter === 'all' && styles.chipActive]} onPress={() => setSelectedCatFilter('all')}>
            <Text style={[styles.chipText, selectedCatFilter === 'all' && styles.chipTextActive]}>Semua</Text>
          </TouchableOpacity>
          {incomeCategories.map(c => (
            <TouchableOpacity key={c.id} style={[styles.chip, selectedCatFilter === c.id && styles.chipActive]} onPress={() => setSelectedCatFilter(c.id)}>
              <Text style={[styles.chipText, selectedCatFilter === c.id && styles.chipTextActive]}>{c.icon} {c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category filter - Expense */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {expenseCategories.map(c => (
            <TouchableOpacity key={c.id} style={[styles.chip, selectedCatFilter === c.id && styles.chipActive]} onPress={() => setSelectedCatFilter(c.id)}>
              <Text style={[styles.chipText, selectedCatFilter === c.id && styles.chipTextActive]}>{c.icon} {c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        {loading ? <ActivityIndicator color={COLORS.purple} style={{ marginVertical: 32 }} /> : renderChart()}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: COLORS.green }]} />
              <Text style={styles.summaryLabel}>Pemasukan</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, { backgroundColor: COLORS.red }]} />
              <Text style={styles.summaryLabel}>Pengeluaran</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryValue, { color: COLORS.green }]}>{fmtFull(totalIncome)}</Text>
            <Text style={[styles.summaryValue, { color: COLORS.red }]}>{fmtFull(totalExpense)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.netLabel}>Laba Bersih</Text>
            <Text style={[styles.netValue, { color: netProfit >= 0 ? COLORS.green : COLORS.red }]}>
              {netProfit >= 0 ? '▲' : '▼'} {fmtFull(Math.abs(netProfit))}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, paddingTop: 12, paddingBottom: 16 },
  // Export
  exportBanner: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  exportTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  exportSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  // Period
  periodRow: { flexDirection: 'row', marginBottom: 16 },
  periodTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.bgCard, marginHorizontal: 3 },
  periodTabActive: { backgroundColor: COLORS.purple },
  periodText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  periodTextActive: { color: '#fff' },
  // Date nav
  dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateNavText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  // Filter
  filterRow: { marginBottom: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bgCard, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: '#fff' },
  // Chart
  chartContainer: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 16 },
  chartTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 16 },
  chartArea: { flexDirection: 'row', height: CHART_HEIGHT },
  yAxis: { justifyContent: 'space-between', marginRight: 8, paddingBottom: 20 },
  yLabel: { fontSize: 10, color: COLORS.textMuted },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  barGroup: { alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end' },
  bar: { width: 8, borderRadius: 4, marginHorizontal: 1 },
  xLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  // Summary
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryItem: { flexDirection: 'row', alignItems: 'center' },
  summaryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  netLabel: { fontSize: 14, color: COLORS.textSecondary },
  netValue: { fontSize: 16, fontWeight: 'bold' },
});
