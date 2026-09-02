'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Phone,
  Hash,
  CheckCircle2,
  UserPlus,
  LogIn,
  Search,
  GraduationCap,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface StudentOption {
  id: number;
  nis: string;
  name: string;
  class: string;
  major: string;
  hasParent: boolean;
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNis, setRegNis] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Student Selection State (Linked to Data Siswa)
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Alert & Loading States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, registerParent } = useAuth();
  const router = useRouter();

  // Search students from public endpoint
  useEffect(() => {
    if (activeTab === 'register' && !selectedStudent) {
      const timer = setTimeout(() => {
        fetchPublicStudents(studentSearchQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [studentSearchQuery, activeTab, selectedStudent]);

  const fetchPublicStudents = async (query: string) => {
    try {
      setIsSearchingStudent(true);
      const res = await api.get('/students/public', {
        params: { search: query },
      });
      setStudentOptions(res.data);
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const handleSelectStudent = (student: StudentOption) => {
    setSelectedStudent(student);
    setRegNis(student.nis);
    setStudentSearchQuery(student.name);
    setShowStudentDropdown(false);
    setError('');
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setRegNis('');
    setStudentSearchQuery('');
    setShowStudentDropdown(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const user = await login(loginEmail, loginPassword);
      if (['admin', 'guru', 'staff'].includes(user.role)) {
        router.push('/admin/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login. Periksa email & password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoLogin = async (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (['admin', 'guru', 'staff'].includes(user.role)) {
        router.push('/admin/dashboard');
      } else {
        router.push('/parent/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login otomatis. Periksa koneksi API Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Nama lengkap, email, dan password wajib diisi.');
      return;
    }

    if (!selectedStudent && !regNis.trim()) {
      setError('Wajib memilih nama anak (siswa) dari data terdaftar agar akun terikat dengan siswa.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerParent({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        nis: selectedStudent ? selectedStudent.nis : regNis,
        studentId: selectedStudent ? selectedStudent.id : undefined,
        studentName: selectedStudent ? selectedStudent.name : undefined,
      });

      setSuccessMsg(
        selectedStudent
          ? `Pendaftaran berhasil! Akun Anda telah terikat dengan siswa ${selectedStudent.name}.`
          : 'Pendaftaran akun orang tua berhasil! Pengalihan ke portal...'
      );
      setTimeout(() => {
        router.push('/parent/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mendaftar akun orang tua. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden my-6">
      {/* Background Decorative Green Blobs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto mb-3 shadow-md border border-emerald-100">
            <img src="/logo.png" alt="Logo SMA AL - FURQON DRIYOREJO" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            SMA AL - FURQON DRIYOREJO
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">LMS SMA AL - FURQON</h2>
          <p className="text-xs text-slate-500 mt-1">Sistem Pemantauan Siswa untuk Orang Tua & Sekolah</p>
        </div>

        {/* Tab Switcher: LOGIN vs REGISTRASI ORANG TUA */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Masuk Akun
          </button>

          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-white/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Daftar Orang Tua
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p>{error}</p>
          </div>
        )}

        {/* TAB 1: FORM LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Masukkan Email Anda
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kata Sandi / Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                  title={showLoginPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk ke LMS SMA AL - FURQON
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              {/* DEMO AUTO LOGIN BUTTONS (1-KLIK OTOMATIS) */}
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Auto Login Otomatis (Demo)
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    1-Klik Auto
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAutoLogin('admin@sekolah.sch.id', 'password123')}
                    className="p-2 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 transition-all text-left group shadow-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">Admin</p>
                      <p className="text-[9px] text-slate-500 truncate">admin@sekolah</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAutoLogin('guru@sekolah.sch.id', 'password123')}
                    className="p-2 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 transition-all text-left group shadow-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">Guru</p>
                      <p className="text-[9px] text-slate-500 truncate">guru@sekolah</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAutoLogin('staff@sekolah.sch.id', 'password123')}
                    className="p-2 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 transition-all text-left group shadow-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">Staff / TU</p>
                      <p className="text-[9px] text-slate-500 truncate">staff@sekolah</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAutoLogin('orangtua@sekolah.sch.id', 'password123')}
                    className="p-2 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 transition-all text-left group shadow-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">Orang Tua</p>
                      <p className="text-[9px] text-slate-500 truncate">orangtua@sekolah</p>
                    </div>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Belum memiliki akun orang tua?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Daftar Akun Baru
                </button>
              </p>
            </div>
          </form>
        )}

        {/* TAB 2: FORM DAFTAR AKUN ORANG TUA SISWA */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nama Lengkap Wali / Orang Tua <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Hendra Pratama, S.E."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="orangtua@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                No. HP / WhatsApp Wali
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
              </div>
            </div>

            {/* INTEGRATED STUDENT SELECTION (TERIKAT DENGAN DATA SISWA) */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2.5 relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  Nama Anak (Siswa Terdaftar) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Terikat Data
                </span>
              </label>

              {selectedStudent ? (
                /* Card Status Siswa Terpilih */
                <div className="p-3 bg-white border border-emerald-300 rounded-xl shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        {selectedStudent.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Kelas: <span className="font-bold text-emerald-800">{selectedStudent.class}</span> • NIS:{' '}
                        <span className="font-mono text-slate-700">{selectedStudent.nis}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearStudent}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Ganti Siswa"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Search Autocomplete Input */
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        setShowStudentDropdown(true);
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      placeholder="Cari nama anak / NIS (contoh: Ahmad Rizky)..."
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-emerald-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showStudentDropdown && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-emerald-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {isSearchingStudent ? (
                        <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          Mencari data siswa...
                        </div>
                      ) : studentOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          Tidak ada siswa ditemukan dengan kata kunci &quot;{studentSearchQuery}&quot;.
                        </div>
                      ) : (
                        studentOptions.map((std) => (
                          <div
                            key={std.id}
                            onClick={() => handleSelectStudent(std)}
                            className="p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{std.name}</p>
                              <p className="text-[10px] text-slate-500">
                                NIS: <span className="font-mono text-slate-700">{std.nis}</span> | Kelas:{' '}
                                <span className="font-semibold text-emerald-800">{std.class}</span> ({std.major})
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              Pilih Siswa
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-emerald-800/80 leading-relaxed font-medium">
                * Pilih nama putra/putri Anda yang sudah terdaftar di sekolah agar akun otomatis terhubung dengan nilai, presensi, dan pembayaran SPP.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition-colors"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 mt-3"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Daftar Akun Orang Tua Siswa
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          </form>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-6">
          © 2026 Student Monitoring System - SMA AL - FURQON DRIYOREJO. All rights reserved.
        </p>
      </div>
    </div>
  );
}
