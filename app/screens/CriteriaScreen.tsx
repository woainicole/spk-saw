import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Criteria } from '../types';
import { getCurrentPeriod, getMinPeriod } from '../utils/period';
import PeriodSelector from '../components/PeriodSelector';
import { customAlert } from '../utils/alert';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function CriteriaScreen({ route }: { route: any }) {
  const [allCriteria, setAllCriteria] = useState<Criteria[]>([]);
  const [period, setPeriod] = useState(route?.params?.period || getCurrentPeriod());
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [isBenefit, setIsBenefit] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isWeightFocused, setIsWeightFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);

  const criteria = allCriteria.filter(c => c.period === period);
  const minPeriod = getMinPeriod(auth.currentUser?.metadata?.creationTime);

  useEffect(() => {
    const userUid = auth.currentUser?.uid;
    if (!userUid) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'criteria'), where('uid', '==', userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllCriteria(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Criteria)));
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const seedBaseCriteria = () => {
    customAlert(
      'Gunakan Kriteria Bawaan',
      'Ini akan menambahkan 5 kriteria bawaan ke periode ini. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tambahkan',
          onPress: async () => {
            const baseCriteria = [
              { name: 'Kehadiran', type: 'benefit', weight: 20, description: 'Semakin sering hadir, semakin bagus' },
              { name: 'Kecepatan Pelayanan', type: 'cost', weight: 25, description: 'Semakin sedikit waktu pelayanan (cepat), semakin bagus' },
              { name: 'Ulasan Pelanggan', type: 'benefit', weight: 20, description: 'Semakin tinggi rating ulasan, semakin bagus' },
              { name: 'Kebersihan Area', type: 'benefit', weight: 15, description: 'Semakin bersih area, semakin bagus' },
              { name: 'Jumlah Komplain', type: 'cost', weight: 20, description: 'Semakin sedikit komplain, semakin bagus' },
            ];
            try {
              setIsLoading(true);
              const userUid = auth.currentUser?.uid;
              for (const c of baseCriteria) {
                await addDoc(collection(db, 'criteria'), { ...c, uid: userUid, period });
              }
              customAlert('Berhasil', '5 kriteria bawaan berhasil ditambahkan.');
            } catch (error: any) {
              customAlert('Gagal', error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !weight.trim()) {
      customAlert('Error', 'Nama dan Bobot wajib diisi');
      return;
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight)) {
      customAlert('Error', 'Bobot harus berupa angka yang valid');
      return;
    }

    const criteriaData = {
      name: name.trim(),
      weight: parsedWeight,
      type: isBenefit ? 'benefit' : 'cost',
      description: description.trim(),
      uid: auth.currentUser?.uid,
      period,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'criteria', editingId), criteriaData);
        customAlert('Berhasil', 'Kriteria berhasil diperbarui.');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'criteria'), criteriaData);
        customAlert('Berhasil', 'Kriteria baru berhasil ditambahkan.');
      }
      setName('');
      setWeight('');
      setDescription('');
      setIsBenefit(true);
    } catch (error: any) {
      customAlert('Gagal', error.message);
    }
  };

  const handleEdit = (item: Criteria) => {
    setName(item.name);
    setWeight(item.weight.toString());
    setDescription(item.description || '');
    setIsBenefit(item.type === 'benefit');
    setEditingId(item.id);
  };

  const handleDelete = (id: string, name: string) => {
    customAlert(
      'Hapus Kriteria',
      `Apakah Anda yakin ingin menghapus kriteria "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'criteria', id));
            } catch (error: any) {
              customAlert('Gagal', error.message);
            }
          }
        }
      ]
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Feather name="list" size={32} color="#C63D5F" />
        </View>
        <Text style={styles.emptyText}>Belum ada kriteria penilaian untuk periode ini.</Text>
        <TouchableOpacity style={styles.baseCriteriaButton} onPress={seedBaseCriteria} activeOpacity={0.8}>
          <Feather name="layers" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.baseCriteriaButtonText}>Gunakan Kriteria Bawaan</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          data={criteria}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Konfigurasi Kriteria</Text>
                <Text style={styles.headerSubtitle}>Tentukan kriteria pembobotan untuk evaluasi SAW</Text>
              </View>

              {/* Period Selector */}
              <PeriodSelector
                period={period}
                minPeriod={minPeriod}
                onPeriodChange={setPeriod}
                subtitle={`${criteria.length} kriteria aktif`}
              />

              <View style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {editingId ? 'Edit Detail Kriteria' : 'Tambah Kriteria Penilaian'}
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Kriteria</Text>
                  <View style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}>
                    <Feather name="tag" size={18} color={isNameFocused ? '#C63D5F' : '#A1928D'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: Kehadiran, Kualitas Brew"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#A1928D"
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bobot Kriteria (%)</Text>
                  <View style={[styles.inputWrapper, isWeightFocused && styles.inputWrapperFocused]}>
                    <Feather name="percent" size={18} color={isWeightFocused ? '#C63D5F' : '#A1928D'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: 20 (Total bobot disarankan = 100)"
                      value={weight}
                      keyboardType="decimal-pad"
                      onChangeText={setWeight}
                      placeholderTextColor="#A1928D"
                      onFocus={() => setIsWeightFocused(true)}
                      onBlur={() => setIsWeightFocused(false)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Keterangan / Deskripsi</Text>
                  <View style={[styles.inputWrapper, { height: 90, alignItems: 'flex-start', paddingTop: 12 }, isDescFocused && styles.inputWrapperFocused]}>
                    <Feather name="align-left" size={18} color={isDescFocused ? '#C63D5F' : '#A1928D'} style={[styles.inputIcon, { marginTop: 2 }]} />
                    <TextInput
                      style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingVertical: 0 }]}
                      placeholder="Tulis deskripsi kriteria..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      placeholderTextColor="#A1928D"
                      onFocus={() => setIsDescFocused(true)}
                      onBlur={() => setIsDescFocused(false)}
                    />
                  </View>
                </View>

                <View style={styles.switchContainer}>
                  <View>
                    <Text style={styles.switchLabel}>Tipe Kriteria</Text>
                    <Text style={styles.switchValue}>{isBenefit ? 'Benefit (Semakin tinggi semakin baik)' : 'Cost (Semakin rendah semakin baik)'}</Text>
                  </View>
                  <Switch
                    value={isBenefit}
                    onValueChange={setIsBenefit}
                    trackColor={{ false: '#F5D6DC', true: '#D1FAE5' }}
                    thumbColor={isBenefit ? '#065F46' : '#C63D5F'}
                  />
                </View>

                <View style={styles.actionButtonRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.8}>
                    <Feather name={editingId ? 'save' : 'plus'} size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>{editingId ? 'Simpan Perubahan' : 'Tambah Kriteria'}</Text>
                  </TouchableOpacity>

                  {editingId && (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        setEditingId(null);
                        setName('');
                        setWeight('');
                        setDescription('');
                        setIsBenefit(true);
                      }}
                    >
                      <Text style={styles.secondaryButtonText}>Batal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#C63D5F" />
                  <Text style={styles.loadingText}>Memuat kriteria...</Text>
                </View>
              )}

              {!isLoading && criteria.length > 0 && (
                <Text style={styles.listTitle}>Daftar Kriteria Aktif</Text>
              )}
            </>
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc}>
                    {item.description}
                  </Text>
                ) : null}
                
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, item.type === 'benefit' ? styles.badgeBenefit : styles.badgeCost]}>
                    <Text style={[styles.badgeText, item.type === 'benefit' ? styles.badgeTextBenefit : styles.badgeTextCost]}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.badgeWeight}>
                    <Feather name="award" size={12} color="#3C2415" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeTextWeight}>Bobot: {item.weight}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={[styles.iconButton, { backgroundColor: '#FAF7F2' }]} 
                  onPress={() => handleEdit(item)}
                  activeOpacity={0.7}
                >
                  <Feather name="edit-2" size={16} color="#3C2415" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconButton, { backgroundColor: '#FAF2F4', borderColor: '#F5D6DC' }]} 
                  onPress={() => handleDelete(item.id, item.name)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={16} color="#C63D5F" />
                </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2'
  },
  listContent: {
    padding: 16,
    paddingBottom: 48
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8C6246',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#3C2415',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFE9E2',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3C2415',
    marginBottom: 6,
  },
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE9E2',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C6246',
    marginBottom: 2,
  },
  switchValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C2415',
    maxWidth: 200,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#C63D5F',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C63D5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE9E2',
  },
  secondaryButtonText: {
    color: '#3C2415',
    fontSize: 15,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3C2415',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#EFE9E2',
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#8C6246',
    marginBottom: 8,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeBenefit: {
    backgroundColor: '#D1FAE5',
  },
  badgeCost: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextBenefit: {
    color: '#065F46',
  },
  badgeTextCost: {
    color: '#991B1B',
  },
  badgeWeight: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EFE9E2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTextWeight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3C2415',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE9E2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFE9E2',
    borderStyle: 'dashed',
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
  emptyText: {
    fontSize: 14,
    color: '#8C6246',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 20,
  },
  baseCriteriaButton: {
    backgroundColor: '#3C2415',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseCriteriaButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#8C6246',
    fontWeight: '600',
  },
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
