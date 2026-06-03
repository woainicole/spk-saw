import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BarChart } from 'react-native-chart-kit';
import { db, auth } from '../firebaseConfig';
import { Alternative, Criteria } from '../types';
import { getCurrentPeriod, getMinPeriod } from '../utils/period';
import PeriodSelector from '../components/PeriodSelector';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [allCriteria, setAllCriteria] = useState<Criteria[]>([]);
  const [allAlternatives, setAllAlternatives] = useState<Alternative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [period, setPeriod] = useState(getCurrentPeriod());

  const minPeriod = getMinPeriod(auth.currentUser?.metadata?.creationTime);

  useEffect(() => {
    const userUid = auth.currentUser?.uid;
    if (!userUid) { setIsLoading(false); return; }

    let c = false, a = false;
    const done = () => { if (c && a) setIsLoading(false); };

    const unsubCri = onSnapshot(query(collection(db, 'criteria'), where('uid', '==', userUid)),
      snap => { setAllCriteria(snap.docs.map(d => ({ id: d.id, ...d.data() } as Criteria))); c = true; done(); });
    const unsubAlt = onSnapshot(query(collection(db, 'alternatives'), where('uid', '==', userUid)),
      snap => { setAllAlternatives(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alternative))); a = true; done(); });

    return () => { unsubCri(); unsubAlt(); };
  }, []);

  // Filter by period in JS (avoids composite index requirement)
  const criteria = allCriteria.filter(c => c.period === period);
  const alternatives = allAlternatives.filter(a => a.period === period);

  // SAW Calculation
  const minMax: Record<string, { min: number; max: number }> = {};
  criteria.forEach(c => {
    const vals = alternatives.map(a => a.values[c.id] || 0);
    minMax[c.id] = { min: Math.min(...vals), max: Math.max(...vals) };
  });

  const normalized = alternatives.map(alt => {
    const normValues: Record<string, number> = {};
    criteria.forEach(c => {
      const v = alt.values[c.id] || 0;
      normValues[c.id] = c.type === 'benefit'
        ? (minMax[c.id].max === 0 ? 0 : v / minMax[c.id].max)
        : (v === 0 ? 0 : minMax[c.id].min / v);
    });
    return { ...alt, normValues };
  });

  const finalScores = normalized.map(alt => {
    const score = criteria.reduce((sum, c) => sum + (alt.normValues[c.id] || 0) * (c.weight || 0), 0);
    return { ...alt, finalScore: score };
  }).sort((a, b) => b.finalScore - a.finalScore);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  // --- Render Helpers ---

  const renderChart = () => {
    if (finalScores.length === 0) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Feather name="bar-chart-2" size={20} color="#C63D5F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Statistik Skor Akhir Karyawan</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={{
              labels: finalScores.map(a => a.name.length > 7 ? a.name.substring(0, 7) + '.' : a.name),
              datasets: [{ data: finalScores.map(a => parseFloat(a.finalScore.toFixed(2))) }]
            }}
            width={Math.max(screenWidth - 64, finalScores.length * 75)}
            height={220}
            yAxisLabel="" yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 2,
              color: (op = 1) => `rgba(198,61,95,${op})`, // #C63D5F (Kopi Kenangan Pink)
              labelColor: (op = 1) => `rgba(60,36,21,${op})`, // #3C2415 (Espresso Brown)
              barPercentage: 0.65,
            }}
            style={{ borderRadius: 12, marginVertical: 4 }}
            showValuesOnTopOfBars
          />
        </ScrollView>
      </View>
    );
  };

  const renderInfoBobot = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.stepIndicator}><Text style={styles.stepIndicatorText}>1</Text></View>
        <Text style={styles.cardTitle}>Informasi Bobot Kriteria</Text>
      </View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, { flex: 2, textAlign: 'left' }]}>Kriteria</Text>
        <Text style={[styles.th, { flex: 1 }]}>Tipe</Text>
        <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>Bobot</Text>
      </View>
      {criteria.map((c, i) => (
        <View key={c.id} style={[styles.tableRow, i % 2 === 1 && styles.rowAlt]}>
          <Text style={[styles.td, { flex: 2, textAlign: 'left', fontWeight: '500' }]}>{c.name}</Text>
          <View style={[styles.typePill, c.type === 'benefit' ? styles.pillGreen : styles.pillRed]}>
            <Text style={[styles.pillText, c.type === 'benefit' ? styles.pillGreenText : styles.pillRedText]}>
              {c.type === 'benefit' ? 'Benefit' : 'Cost'}
            </Text>
          </View>
          <Text style={[styles.td, { width: 70, textAlign: 'right', fontWeight: '700', color: '#3C2415' }]}>{c.weight}</Text>
        </View>
      ))}
      <View style={[styles.tableRow, styles.totalRow]}>
        <Text style={[styles.td, { flex: 2, fontWeight: '700', textAlign: 'left', color: '#3C2415' }]}>Total</Text>
        <Text style={[styles.td, { flex: 1 }]} />
        <Text style={[styles.td, { width: 70, textAlign: 'right', fontWeight: '800', color: totalWeight === 100 ? '#059669' : '#dc2626' }]}>
          {totalWeight}
        </Text>
      </View>
      {totalWeight !== 100 && (
        <View style={styles.warningBox}>
          <Feather name="alert-triangle" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={styles.warningText}>Total bobot = {totalWeight}, disarankan = 100</Text>
        </View>
      )}
    </View>
  );

  const renderMatriksKeputusan = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.stepIndicator}><Text style={styles.stepIndicatorText}>2</Text></View>
        <Text style={styles.cardTitle}>Matriks Keputusan (X)</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: 120, textAlign: 'left' }]}>Alternatif</Text>
            {criteria.map(c => <Text key={c.id} style={[styles.th, { width: 100 }]}>{c.name}</Text>)}
          </View>
          {alternatives.map((alt, i) => (
            <View key={alt.id} style={[styles.tableRow, i % 2 === 1 && styles.rowAlt]}>
              <Text style={[styles.td, { width: 120, fontWeight: '700', textAlign: 'left', color: '#3C2415' }]}>{alt.name}</Text>
              {criteria.map(c => (
                <Text key={c.id} style={[styles.td, { width: 100 }]}>{alt.values[c.id] ?? '-'}</Text>
              ))}
            </View>
          ))}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.td, { width: 120, fontWeight: '700', textAlign: 'left', color: '#C63D5F' }]}>Rujukan (Max/Min)</Text>
            {criteria.map(c => (
              <Text key={c.id} style={[styles.td, { width: 100, fontWeight: '800', color: '#C63D5F' }]}>
                {c.type === 'benefit' ? `max=${minMax[c.id].max}` : `min=${minMax[c.id].min}`}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderLangkahNormalisasi = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.stepIndicator}><Text style={styles.stepIndicatorText}>3</Text></View>
        <Text style={styles.cardTitle}>Langkah Normalisasi</Text>
      </View>
      {criteria.map(c => (
        <View key={c.id} style={styles.normBlock}>
          <View style={styles.normHeader}>
            <Text style={styles.normCriteriaName}>{c.name}</Text>
            <View style={[styles.typePill, c.type === 'benefit' ? styles.pillGreen : styles.pillRed]}>
              <Text style={[styles.pillText, c.type === 'benefit' ? styles.pillGreenText : styles.pillRedText]}>
                {c.type === 'benefit' ? 'Benefit' : 'Cost'}
              </Text>
            </View>
          </View>
          <Text style={styles.normFormula}>
            {c.type === 'benefit'
              ? `Rumus: R = Xij / max(Xj) [nilai max = ${minMax[c.id].max}]`
              : `Rumus: R = min(Xj) / Xij [nilai min = ${minMax[c.id].min}]`}
          </Text>
          {alternatives.map(alt => {
            const v = alt.values[c.id] || 0;
            const norm = normalized.find(n => n.id === alt.id)?.normValues[c.id] ?? 0;
            const formula = c.type === 'benefit'
              ? `${v} / ${minMax[c.id].max}`
              : `${minMax[c.id].min} / ${v}`;
            return (
              <View key={alt.id} style={styles.normRow}>
                <Text style={styles.normAlt}>{alt.name}</Text>
                <Text style={styles.normCalc}>R = {formula} = </Text>
                <Text style={styles.normResult}>{norm.toFixed(4)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderMatriksNormalisasi = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.stepIndicator}><Text style={styles.stepIndicatorText}>4</Text></View>
        <Text style={styles.cardTitle}>Matriks Normalisasi (R)</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: 120, textAlign: 'left' }]}>Alternatif</Text>
            {criteria.map(c => <Text key={c.id} style={[styles.th, { width: 100 }]}>{c.name}</Text>)}
          </View>
          {normalized.map((alt, i) => (
            <View key={alt.id} style={[styles.tableRow, i % 2 === 1 && styles.rowAlt]}>
              <Text style={[styles.td, { width: 120, fontWeight: '700', textAlign: 'left', color: '#3C2415' }]}>{alt.name}</Text>
              {criteria.map(c => (
                <Text key={c.id} style={[styles.td, { width: 100, fontWeight: '600' }]}>
                  {(alt.normValues[c.id] ?? 0).toFixed(4)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderLangkahPreferensi = () => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.stepIndicator}><Text style={styles.stepIndicatorText}>5</Text></View>
        <Text style={styles.cardTitle}>Perhitungan Preferensi (V)</Text>
      </View>
      <Text style={styles.normFormula}>Rumus: Vi = Σ (Wj × Rij)</Text>
      {normalized.map(alt => {
        const components = criteria.map(c => {
          const r = (alt.normValues[c.id] || 0);
          const product = r * c.weight;
          return { c, r, product };
        });
        const total = components.reduce((s, x) => s + x.product, 0);
        return (
          <View key={alt.id} style={styles.prefBlock}>
            <Text style={styles.prefAltName}>{alt.name}</Text>
            <View style={styles.prefCalculationContent}>
              <Text style={styles.prefFormula}>
                V = {components.map(x => `(${x.c.weight} × ${x.r.toFixed(4)})`).join('\n  + ')}
              </Text>
              <View style={styles.prefDivider} />
              <Text style={styles.prefFormulaSub}>
                V = {components.map(x => x.product.toFixed(4)).join(' + ')}
              </Text>
              <Text style={styles.prefTotal}>Skor Preferensi Akhir = {total.toFixed(4)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderHasilRanking = () => (
    <View style={[styles.card, styles.highlightCard]}>
      <View style={styles.cardHeaderRow}>
        <Feather name="trending-up" size={20} color="#C63D5F" style={{ marginRight: 8 }} />
        <Text style={styles.cardTitle}>Hasil Preferensi & Pemeringkatan</Text>
      </View>
      
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, { width: 60 }]}>Rank</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>Nama Karyawan</Text>
        <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>Skor Akhir (V)</Text>
      </View>
      {finalScores.map((alt, i) => (
        <View key={alt.id} style={[styles.tableRow, i % 2 === 1 && styles.rowAlt]}>
          <View style={{ width: 60, alignItems: 'center' }}>
            <View style={[
              styles.rankCircle, 
              i === 0 && styles.rankFirstCircle,
              i === 1 && styles.rankSecondCircle,
              i === 2 && styles.rankThirdCircle,
            ]}>
              <Text style={[
                styles.rankCircleText,
                i < 3 && styles.rankTopText
              ]}>
                {i + 1}
              </Text>
            </View>
          </View>
          <Text style={[
            styles.td, 
            { flex: 1, textAlign: 'left', fontWeight: i === 0 ? '800' : '600' }
          ]}>
            {alt.name}
          </Text>
          <Text style={[styles.td, { width: 100, textAlign: 'right', fontWeight: '800', color: i === 0 ? '#C63D5F' : '#3C2415' }]}>
            {alt.finalScore.toFixed(4)}
          </Text>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C63D5F" />
        <Text style={styles.loadingText}>Memuat Data Kopi Kenangan...</Text>
      </View>
    );
  }

  const hasData = criteria.length > 0 && alternatives.length > 0;
  const winner = finalScores.length > 0 ? finalScores[0] : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeText}>Selamat datang,</Text>
            <Text style={styles.welcomeUser}>Supervisor Kopi Kenangan ☕</Text>
          </View>
          <View style={styles.periodBadge}>
            <Text style={styles.periodBadgeText}>SAW Portal</Text>
          </View>
        </View>

        {/* Period Navigation */}
        <PeriodSelector
          period={period}
          minPeriod={minPeriod}
          onPeriodChange={setPeriod}
        />

        {/* Dashboard Navigation Cards */}
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => navigation.navigate('Criteria', { period })}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#FAF2F4' }]}>
              <Ionicons name="settings" size={24} color="#C63D5F" />
            </View>
            <Text style={styles.menuCardTitle}>Kelola Kriteria</Text>
            <Text style={styles.menuCardSubtitle}>{criteria.length} Kriteria Penilaian</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuCard} 
            onPress={() => navigation.navigate('Alternatives', { period })}
            activeOpacity={0.8}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#FAF7F2' }]}>
              <Ionicons name="people" size={24} color="#3C2415" />
            </View>
            <Text style={styles.menuCardTitle}>Data Karyawan</Text>
            <Text style={styles.menuCardSubtitle}>{alternatives.length} Barista & Staff</Text>
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="coffee" size={48} color="#C63D5F" />
            </View>
            <Text style={styles.emptyTitle}>
              {criteria.length === 0 ? 'Kriteria Belum Dibuat' : 'Data Barista Kosong'}
            </Text>
            <Text style={styles.emptyDesc}>
              {criteria.length === 0
                ? 'Tambahkan kriteria penilaian kualitas barista dan staff untuk bulan ini terlebih dahulu.'
                : 'Kriteria sudah didefinisikan. Silakan tambahkan data barista untuk melihat hasil pemeringkatan.'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => criteria.length === 0 ? navigation.navigate('Criteria', { period }) : navigation.navigate('Alternatives', { period })}
            >
              <Text style={styles.emptyButtonText}>
                {criteria.length === 0 ? 'Buat Kriteria Sekarang' : 'Tambah Data Barista'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.results}>
            {/* Winner Spotlight */}
            {winner && (
              <View style={styles.winnerSpotlightCard}>
                <View style={styles.spotlightHeader}>
                  <MaterialCommunityIcons name="crown" size={36} color="#D4AF37" />
                  <Text style={styles.spotlightTitle}>KARYAWAN TERBAIK BULAN INI</Text>
                </View>
                <View style={styles.winnerStatsContainer}>
                  <View style={styles.winnerAvatar}>
                    <Text style={styles.winnerAvatarText}>{winner.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.winnerNameContainer}>
                    <Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text>
                    <Text style={styles.winnerPeriod}>Periode {period.substring(0, 4)}/{period.substring(4, 6)}</Text>
                  </View>
                  <View style={styles.winnerScoreContainer}>
                    <Text style={styles.winnerScoreLabel}>Skor (V)</Text>
                    <Text style={styles.winnerScoreValue}>{winner.finalScore.toFixed(4)}</Text>
                  </View>
                </View>
                <View style={styles.goldDivider} />
                <Text style={styles.winnerCongrats}>🎉 Barista teladan bulan ini dengan nilai preferensi tertinggi!</Text>
              </View>
            )}

            {renderChart()}
            {renderHasilRanking()}

            <TouchableOpacity 
              style={styles.toggleBtn} 
              onPress={() => setShowDetails(!showDetails)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleBtnText}>
                {showDetails ? '▲ Sembunyikan Detail SAW' : '▼ Tampilkan Detail Perhitungan SAW'}
              </Text>
            </TouchableOpacity>

            {showDetails && (
              <View style={styles.detailsSection}>
                {renderInfoBobot()}
                {renderMatriksKeputusan()}
                {renderLangkahNormalisasi()}
                {renderMatriksNormalisasi()}
                {renderLangkahPreferensi()}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerCoffeeText}>☕ Kopi Kenangan ☕</Text>
          <Text style={styles.footerText}>© 2026 Darren Hoir Putra</Text>
          <Text style={styles.footerSubText}>NIM: 231011400446 · Kelas: 06 TPLM 003</Text>
          <Text style={styles.footerSubText2}>Program Studi Teknik Informatika - Universitas Pamulang</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF7F2' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#7A6A65', fontWeight: '600' },

  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    color: '#8C6246',
    fontWeight: '600',
  },
  welcomeUser: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3C2415',
    marginTop: 2,
  },
  periodBadge: {
    backgroundColor: '#3C2415',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodBadgeText: {
    color: '#FAF7F2',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  menuGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  menuCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE9E2',
    shadowColor: '#3C2415',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 4,
  },
  menuCardSubtitle: {
    fontSize: 11,
    color: '#8C6246',
    fontWeight: '600',
  },

  emptyState: {
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 32,
    alignItems: 'center',
    shadowColor: '#3C2415', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, 
    shadowRadius: 16, 
    elevation: 2,
    borderWidth: 1, 
    borderColor: '#EFE9E2',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FAF2F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#3C2415', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  emptyDesc: { 
    fontSize: 14, 
    color: '#7A6A65', 
    textAlign: 'center', 
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emptyButton: {
    backgroundColor: '#C63D5F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#C63D5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  results: { gap: 20 },
  detailsSection: { gap: 16, marginTop: 4 },

  winnerSpotlightCard: {
    backgroundColor: '#FFFDF6',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#F1E4C3',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 4,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  spotlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C6E2D',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  winnerStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  winnerNameContainer: {
    flex: 1,
    marginLeft: 14,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3C2415',
  },
  winnerPeriod: {
    fontSize: 11,
    color: '#8C6246',
    fontWeight: '600',
    marginTop: 2,
  },
  winnerScoreContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#FAF5E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE3C3',
  },
  winnerScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8C6E2D',
    textTransform: 'uppercase',
  },
  winnerScoreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C63D5F',
    marginTop: 2,
  },
  goldDivider: {
    height: 1,
    backgroundColor: '#EFE3C3',
    marginVertical: 14,
  },
  winnerCongrats: {
    fontSize: 12,
    color: '#8C6E2D',
    fontWeight: '700',
    lineHeight: 18,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#3C2415', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: '#EFE9E2',
  },
  highlightCard: {
    borderWidth: 2, borderColor: '#F5D6DC',
    shadowColor: '#C63D5F', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#3C2415' },

  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAF2F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F5D6DC',
  },
  stepIndicatorText: {
    color: '#C63D5F',
    fontSize: 12,
    fontWeight: '800',
  },

  tableHeaderRow: {
    flexDirection: 'row', borderBottomWidth: 1.5,
    borderBottomColor: '#EFE9E2', paddingBottom: 10, marginBottom: 6,
  },
  th: { fontSize: 12, fontWeight: '800', color: '#8C6246', textAlign: 'center', paddingHorizontal: 4 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#FAF7F2',
  },
  rowAlt: { backgroundColor: '#FDFCFB' },
  td: { fontSize: 13, color: '#2B1B15', textAlign: 'center', paddingHorizontal: 4 },
  totalRow: { backgroundColor: '#FAF2F4', borderTopWidth: 1.5, borderTopColor: '#F0C4CE', paddingVertical: 12 },

  typePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    alignSelf: 'center', flex: 1, marginHorizontal: 4, alignItems: 'center',
  },
  pillGreen: { backgroundColor: '#D1FAE5' },
  pillRed: { backgroundColor: '#FEE2E2' },
  pillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  pillGreenText: { color: '#065F46' },
  pillRedText: { color: '#991B1B' },
  warningBox: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  warningText: { fontSize: 12, color: '#B45309', fontWeight: '600' },

  normBlock: {
    borderWidth: 1, borderColor: '#EFE9E2', borderRadius: 16,
    padding: 14, marginBottom: 12, backgroundColor: '#FAF7F2',
  },
  normHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  normCriteriaName: { fontSize: 14, fontWeight: '800', color: '#3C2415', flex: 1 },
  normFormula: { fontSize: 12, color: '#8C6246', fontStyle: 'italic', marginBottom: 10, fontWeight: '500' },
  normRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EFE9E2',
  },
  normAlt: { flex: 1, fontSize: 13, fontWeight: '700', color: '#2B1B15' },
  normCalc: { fontSize: 12, color: '#8C6246', marginHorizontal: 4 },
  normResult: { fontSize: 13, fontWeight: '800', color: '#C63D5F', minWidth: 60, textAlign: 'right' },

  prefBlock: {
    borderWidth: 1, borderColor: '#EFE9E2', borderRadius: 16,
    padding: 14, marginBottom: 12, backgroundColor: '#FAF7F2',
  },
  prefAltName: { fontSize: 14, fontWeight: '800', color: '#3C2415', marginBottom: 8 },
  prefCalculationContent: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE9E2',
  },
  prefFormula: { fontSize: 12, color: '#2B1B15', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18 },
  prefFormulaSub: { fontSize: 12, color: '#8C6246', marginTop: 4 },
  prefDivider: { height: 1, backgroundColor: '#EFE9E2', marginVertical: 6 },
  prefTotal: { fontSize: 13, fontWeight: '800', color: '#C63D5F', marginTop: 8 },

  rankCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EFE9E2',
  },
  rankFirstCircle: { backgroundColor: '#C63D5F', borderColor: '#C63D5F' },
  rankSecondCircle: { backgroundColor: '#8C6246', borderColor: '#8C6246' },
  rankThirdCircle: { backgroundColor: '#C49A6C', borderColor: '#C49A6C' },
  rankCircleText: { fontSize: 12, fontWeight: '800', color: '#3C2415' },
  rankTopText: { color: '#fff' },

  toggleBtn: {
    backgroundColor: '#EFE9E2', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  toggleBtnText: { fontSize: 14, fontWeight: '700', color: '#3C2415' },

  footerContainer: {
    marginTop: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EFE9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCoffeeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C6246',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3C2415',
  },
  footerSubText: {
    fontSize: 11,
    color: '#8C6246',
    fontWeight: '600',
    marginTop: 2,
  },
  footerSubText2: {
    fontSize: 10,
    color: '#A1928D',
    marginTop: 2,
    textAlign: 'center',
  },
});
