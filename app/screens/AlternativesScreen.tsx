import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Alternative, Criteria } from '../types';
import { getCurrentPeriod, getMinPeriod, getPeriodLabel } from '../utils/period';
import PeriodSelector from '../components/PeriodSelector';
import { customAlert } from '../utils/alert';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function AlternativesScreen({ route }: { route: any }) {
  const [allAlternatives, setAllAlternatives] = useState<Alternative[]>([]);
  const [allCriteria, setAllCriteria] = useState<Criteria[]>([]);
  const [period, setPeriod] = useState(route?.params?.period || getCurrentPeriod());
  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [focusedInputId, setFocusedInputId] = useState<string | null>(null);

  // Filter by period in JS (avoids composite index requirement)
  const alternatives = allAlternatives.filter(a => a.period === period);
  const criteria = allCriteria.filter(c => c.period === period);
  const minPeriod = getMinPeriod(auth.currentUser?.metadata?.creationTime);

  useEffect(() => {
    const userUid = auth.currentUser?.uid;
    if (!userUid) { setIsLoading(false); return; }

    let altLoaded = false, criLoaded = false;
    const done = () => { if (altLoaded && criLoaded) setIsLoading(false); };

    const unsubAlt = onSnapshot(query(collection(db, 'alternatives'), where('uid', '==', userUid)),
      snap => { setAllAlternatives(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alternative))); altLoaded = true; done(); });
    const unsubCri = onSnapshot(query(collection(db, 'criteria'), where('uid', '==', userUid)),
      snap => { setAllCriteria(snap.docs.map(d => ({ id: d.id, ...d.data() } as Criteria))); criLoaded = true; done(); });

    return () => { unsubAlt(); unsubCri(); };
  }, []);

  const handleValueChange = (criteriaId: string, text: string) => {
    setValues({ ...values, [criteriaId]: text.replace(/[^0-9.]/g, '') });
  };

  const handleSave = async () => {
    if (!name.trim()) { customAlert('Error', 'Nama karyawan wajib diisi'); return; }
    if (criteria.length === 0) {
      customAlert('Error', 'Belum ada kriteria untuk periode ini. Tambahkan kriteria terlebih dahulu.');
      return;
    }

    const parsedValues: Record<string, number> = {};
    for (const c of criteria) {
      if (!values[c.id] || values[c.id].trim() === '') {
        customAlert('Error', `Nilai untuk "${c.name}" wajib diisi`); return;
      }
      const num = parseFloat(values[c.id]);
      if (isNaN(num)) { customAlert('Error', `Nilai "${c.name}" harus berupa angka`); return; }
      parsedValues[c.id] = num;
    }

    const altData = { name: name.trim(), values: parsedValues, uid: auth.currentUser?.uid, period };
    const saveData = async () => {
      try {
        if (editingId) {
          await updateDoc(doc(db, 'alternatives', editingId), altData);
          customAlert('Berhasil', 'Data karyawan berhasil diperbarui.');
          setEditingId(null);
        } else {
          await addDoc(collection(db, 'alternatives'), altData);
          customAlert('Berhasil', 'Data karyawan baru berhasil ditambahkan.');
        }
        setName(''); setValues({});
      } catch (error: any) { customAlert('Gagal', error.message); }
    };

    if (editingId) {
      customAlert(
        'Simpan Perubahan',
        `Apakah Anda yakin ingin menyimpan perubahan untuk data "${name.trim()}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Simpan', onPress: saveData }
        ]
      );
    } else {
      saveData();
    }
  };

  const handleEdit = (item: Alternative) => {
    setName(item.name);
    const strValues: Record<string, string> = {};
    Object.keys(item.values).forEach(k => strValues[k] = item.values[k].toString());
    setValues(strValues);
    setEditingId(item.id);
  };

  const handleDelete = (id: string, empName: string) => {
    customAlert(
      'Hapus Karyawan',
      `Apakah Anda yakin ingin menghapus data karyawan "${empName}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => {
          try { await deleteDoc(doc(db, 'alternatives', id)); }
          catch (e: any) { customAlert('Gagal', e.message); }
        }}
      ]
    );
  };

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerCoffeeText}>☕ Kopi Kenangan ☕</Text>
      <Text style={styles.footerText}>© 2026 Darren Hoir Putra</Text>
      <Text style={styles.footerSubText}>NIM: 231011400446 · Kelas: 06 TPLM 003</Text>
      <Text style={styles.footerSubText2}>Program Studi Teknik Informatika - Universitas Pamulang</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <FlatList
          data={alternatives}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Manajemen Karyawan</Text>
                <Text style={styles.headerSubtitle}>Kelola nilai kinerja alternatif karyawan (barista & staff)</Text>
              </View>

              {/* Period Selector */}
              <PeriodSelector
                period={period}
                minPeriod={minPeriod}
                onPeriodChange={setPeriod}
                subtitle={`${alternatives.length} karyawan · ${criteria.length} kriteria`}
              />

              {/* Weight summary */}
              {criteria.length > 0 && (
                <View style={styles.weightCard}>
                  <Text style={styles.weightTitle}>📋 Kriteria & Bobot Periode Ini</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.weightRow}>
                      {criteria.map(c => (
                        <View key={c.id} style={[styles.weightChip, c.type === 'benefit' ? styles.chipGreen : styles.chipRed]}>
                          <Text style={styles.weightChipName} numberOfLines={1}>{c.name}</Text>
                          <Text style={styles.weightChipValue}>{c.weight}%</Text>
                          <Text style={[styles.weightChipType, c.type === 'benefit' ? styles.chipGreenText : styles.chipRedText]}>
                            {c.type === 'benefit' ? 'Benefit ↑' : 'Cost ↓'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={[styles.totalWeightText, totalWeight !== 100 && styles.totalWeightWarn]}>
                    {totalWeight !== 100 ? '⚠️ Total bobot belum ideal (disarankan 100)' : '✓ Total bobot ideal (100)'}
                  </Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit Data Barista' : 'Registrasi Karyawan Baru'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Lengkap Karyawan</Text>
                  <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                    <Feather name="user" size={18} color={isNameFocused ? '#C63D5F' : '#A1928D'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input} 
                      placeholder="Masukkan nama lengkap barista..."
                      value={name} 
                      onChangeText={setName} 
                      placeholderTextColor="#A1928D"
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>
                </View>

                {criteria.length > 0 && (
                  <View style={styles.criteriaSection}>
                    <Text style={styles.criteriaSectionTitle}>Nilai Parameter Kinerja</Text>
                    <Text style={styles.criteriaSectionSubtitle}>Masukkan angka aktual pencapaian karyawan</Text>
                    {criteria.map(c => {
                      const isFocused = focusedInputId === c.id;
                      return (
                        <View key={c.id} style={[styles.criteriaRow, isFocused && styles.criteriaRowFocused]}>
                          <View style={styles.criteriaLabelContainer}>
                            <Text style={styles.criteriaLabel}>{c.name}</Text>
                            {c.description ? (
                              <Text style={styles.criteriaRowDesc} numberOfLines={1}>
                                {c.description}
                              </Text>
                            ) : null}
                            <View style={styles.criteriaBadgeRow}>
                              <View style={[styles.typeBadge, c.type === 'benefit' ? styles.benefitBadge : styles.costBadge]}>
                                <Text style={[styles.typeText, c.type === 'benefit' ? styles.benefitText : styles.costText]}>
                                  {c.type === 'benefit' ? 'Benefit' : 'Cost'}
                                </Text>
                              </View>
                              <View style={styles.weightBadge}>
                                <Text style={styles.weightBadgeText}>W={c.weight}%</Text>
                              </View>
                            </View>
                          </View>
                          <View style={[styles.fieldWrapper, isFocused && styles.fieldWrapperFocused]}>
                            <TextInput
                              style={styles.criteriaInput}
                              placeholder="0" 
                              keyboardType="decimal-pad"
                              value={values[c.id] || ''}
                              onChangeText={t => handleValueChange(c.id, t)}
                              placeholderTextColor="#A1928D"
                              onFocus={() => setFocusedInputId(c.id)}
                              onBlur={() => setFocusedInputId(null)}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {criteria.length === 0 && !isLoading && (
                  <View style={styles.warningBox}>
                    <Feather name="alert-circle" size={20} color="#92400E" style={{ marginRight: 8 }} />
                    <Text style={styles.warningText}>
                      Belum ada kriteria penilaian untuk periode {getPeriodLabel(period)}. Silakan buat kriteria terlebih dahulu.
                    </Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.primaryButton, criteria.length === 0 && styles.disabledButton]}
                    onPress={handleSave} 
                    disabled={criteria.length === 0}
                    activeOpacity={0.8}
                  >
                    <Feather name={editingId ? 'save' : 'plus'} size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>{editingId ? 'Simpan Perubahan' : 'Simpan Karyawan'}</Text>
                  </TouchableOpacity>
                  
                  {editingId && (
                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      activeOpacity={0.8}
                      onPress={() => { setEditingId(null); setName(''); setValues({}); }}
                    >
                      <Text style={styles.secondaryButtonText}>Batal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C63D5F" />
                  <Text style={styles.loadingText}>Memuat data karyawan...</Text>
                </View>
              )}

              {!isLoading && alternatives.length > 0 && (
                <Text style={styles.listTitle}>Daftar Karyawan Aktif</Text>
              )}
            </>
          }
          ListEmptyComponent={!isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="users" size={32} color="#C63D5F" />
              </View>
              <Text style={styles.emptyText}>Belum ada data karyawan untuk periode ini.</Text>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>Karyawan Terdaftar</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={[styles.iconButton, { backgroundColor: '#FAF7F2' }]} 
                    onPress={() => handleEdit(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-2" size={15} color="#3C2415" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconButton, { backgroundColor: '#FAF2F4', borderColor: '#F5D6DC' }]} 
                    onPress={() => handleDelete(item.id, item.name)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={15} color="#C63D5F" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.criteriaGrid}>
                {criteria.map(c => (
                  <View key={c.id} style={styles.criteriaItem}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.criteriaItemName}>{c.name}</Text>
                      <Text style={styles.criteriaItemMeta}>W={c.weight}% · {c.type === 'benefit' ? 'Benefit' : 'Cost'}</Text>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={styles.criteriaItemValue}>{item.values[c.id] ?? '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          ListFooterComponent={renderFooter}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  listContent: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 20, marginTop: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#3C2415', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#8C6246', fontWeight: '600' },

  weightCard: {
    backgroundColor: '#FAF2F4', borderRadius: 20, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: '#F5D6DC',
    shadowColor: '#C63D5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1,
  },
  weightTitle: { fontSize: 14, fontWeight: '800', color: '#C63D5F', marginBottom: 12 },
  weightRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  weightChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    minWidth: 100, alignItems: 'center',
    borderWidth: 1, borderColor: '#FAF7F2',
  },
  chipGreen: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  chipRed: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  weightChipName: { fontSize: 11, fontWeight: '800', color: '#3C2415', marginBottom: 2 },
  weightChipValue: { fontSize: 13, fontWeight: '800', color: '#3C2415' },
  weightChipType: { fontSize: 9, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  chipGreenText: { color: '#047857' },
  chipRedText: { color: '#B91C1C' },
  totalWeightText: { fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 10 },
  totalWeightWarn: { color: '#D97706' },

  // Form
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#3C2415', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
    borderWidth: 1, borderColor: '#EFE9E2',
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#3C2415', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#3C2415', marginBottom: 6 },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFE9E2',
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: '#C63D5F',
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2B1B15',
    fontWeight: '600',
    height: '100%',
  },

  // Criteria input section
  criteriaSection: {
    backgroundColor: '#FAF7F2', borderRadius: 16, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#EFE9E2',
  },
  criteriaSectionTitle: { fontSize: 14, fontWeight: '800', color: '#3C2415', marginBottom: 2 },
  criteriaSectionSubtitle: { fontSize: 11, color: '#8C6246', marginBottom: 14, fontWeight: '600' },
  
  criteriaRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    backgroundColor: '#fff', padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#EFE9E2',
  },
  criteriaRowFocused: {
    borderColor: '#C63D5F',
  },
  criteriaRowDesc: {
    fontSize: 11,
    color: '#8C6246',
    marginTop: 2,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  criteriaLabelContainer: { flex: 1, paddingRight: 10 },
  criteriaLabel: { fontSize: 14, fontWeight: '800', color: '#3C2415' },
  criteriaBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  benefitBadge: { backgroundColor: '#D1FAE5' },
  costBadge: { backgroundColor: '#FEE2E2' },
  typeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  benefitText: { color: '#065F46' },
  costText: { color: '#991B1B' },
  weightBadge: { backgroundColor: '#FAF7F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: '#EFE9E2' },
  weightBadgeText: { fontSize: 9, fontWeight: '800', color: '#3C2415' },
  
  fieldWrapper: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5, 
    borderColor: '#EFE9E2', 
    borderRadius: 8,
    width: 64,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldWrapperFocused: {
    borderColor: '#C63D5F',
    backgroundColor: '#fff',
  },
  criteriaInput: {
    width: '100%',
    height: '100%',
    fontSize: 15, 
    fontWeight: '800', 
    color: '#3C2415',
    textAlign: 'center',
  },

  warningBox: {
    backgroundColor: '#FEF3C7', padding: 14, borderRadius: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A',
    flexDirection: 'row', alignItems: 'center',
  },
  warningText: { color: '#92400E', fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    flex: 2,
    backgroundColor: '#C63D5F', borderRadius: 12, height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C63D5F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  disabledButton: { backgroundColor: '#D0C5C0', shadowOpacity: 0 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FAF7F2', borderRadius: 12, height: 48,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#EFE9E2',
  },
  secondaryButtonText: { color: '#3C2415', fontSize: 15, fontWeight: '700' },

  listTitle: { fontSize: 16, fontWeight: '800', color: '#3C2415', marginBottom: 12 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#3C2415', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
    borderWidth: 1, borderColor: '#EFE9E2',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#3C2415', alignItems: 'center', justifyContent: 'center', marginRight: 12,
    shadowColor: '#3C2415', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FAF7F2' },
  cardTitleContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#3C2415' },
  cardSubtitle: { fontSize: 11, color: '#8C6246', fontWeight: '600', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#EFE9E2',
  },

  criteriaGrid: {
    flexDirection: 'column',
    backgroundColor: '#FAF7F2', borderRadius: 12, padding: 10, gap: 8,
  },
  criteriaItem: {
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#EFE9E2',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%',
  },
  criteriaItemName: { fontSize: 13, fontWeight: '700', color: '#3C2415', marginBottom: 1 },
  criteriaItemMeta: { fontSize: 10, color: '#8C6246', fontWeight: '500' },
  valueContainer: {
    backgroundColor: '#FAF2F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  criteriaItemValue: { fontSize: 15, fontWeight: '800', color: '#C63D5F' },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20,
    backgroundColor: '#fff', borderRadius: 20, marginTop: 10,
    borderWidth: 1, borderColor: '#EFE9E2', borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF2F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 14, color: '#8C6246', textAlign: 'center', fontWeight: '600' },
  loadingContainer: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#8C6246', fontWeight: '600' },

  footerContainer: {
    marginTop: 36,
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
