import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { customAlert } from '../utils/alert';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      customAlert('Error', 'Email dan password tidak boleh kosong');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        customAlert('Pendaftaran Berhasil', 'Akun Anda berhasil dibuat dan Anda telah otomatis masuk.');
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Format email tidak valid.';
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email atau password salah. Periksa kembali dan coba lagi.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Terlalu banyak percobaan gagal. Akun sementara dinonaktifkan. Coba lagi nanti.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Akun ini telah dinonaktifkan. Hubungi administrator.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Login email belum diaktifkan. Aktifkan di Firebase Console → Authentication.';
          break;
      }
      customAlert('Login Gagal', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="cafe" size={44} color="#FAF7F2" />
            </View>
            <Text style={styles.title}>Kopi Kenangan</Text>
            <Text style={styles.subtitle}>Sistem Evaluasi Karyawan Terbaik · SAW</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>{isLogin ? 'Masuk Portal' : 'Daftar Akun Baru'}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper, 
                isEmailFocused && styles.inputWrapperFocused
              ]}>
                <Feather name="mail" size={20} color={isEmailFocused ? "#C63D5F" : "#A1928D"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="barista@kopikenangan.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#A1928D"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper, 
                isPasswordFocused && styles.inputWrapperFocused
              ]}>
                <Feather name="lock" size={20} color={isPasswordFocused ? "#C63D5F" : "#A1928D"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#A1928D"
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Feather 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#A1928D" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{isLogin ? 'Masuk ke Akun' : 'Daftar Sekarang'}</Text>
                  <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.7}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Masuk di sini'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>© 2026 Darren Hoir Putra</Text>
            <Text style={styles.footerSubText}>NIM: 231011400446 · Kelas: 06 TPLM 003</Text>
            <Text style={styles.footerSubText2}>Program Studi Teknik Informatika - Universitas Pamulang</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3C2415',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3C2415',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8C6246',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#3C2415',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EFE9E2',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3C2415',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3C2415',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFE9E2',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#C63D5F',
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2B1B15',
    fontWeight: '600',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    backgroundColor: '#C63D5F',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#C63D5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#C63D5F',
    fontSize: 14,
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#3C2415',
    fontSize: 13,
    fontWeight: '800',
  },
  footerSubText: {
    color: '#8C6246',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  footerSubText2: {
    color: '#A1928D',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  }
});
