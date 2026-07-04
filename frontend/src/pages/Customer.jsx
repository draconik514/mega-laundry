import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { MagnifyingGlassIcon, CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid'
import {
  ClockIcon, PhoneIcon, MapPinIcon, SparklesIcon,
  BoltIcon, ShieldCheckIcon, TruckIcon
} from '@heroicons/react/24/outline'

const ADMIN_WA = import.meta.env.VITE_ADMIN_WA || '6281234567890'

const features = [
  { icon: SparklesIcon, title: 'Bersih & Wangi', desc: 'Menggunakan deterjen premium, hasil cucian bersih dan wangi tahan lama.', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: BoltIcon, title: 'Cepat & Tepat Waktu', desc: 'Proses laundry sesuai estimasi, tidak ada keterlambatan.', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { icon: ShieldCheckIcon, title: 'Aman & Terpercaya', desc: 'Pakaian Anda ditangani dengan hati-hati dan penuh tanggung jawab.', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: TruckIcon, title: 'Mudah Dipantau', desc: 'Cek status laundry Anda kapan saja lewat kode order.', color: 'text-purple-500', bg: 'bg-purple-50' },
]

const steps = [
  { num: '01', title: 'Antar Pakaian', desc: 'Datang ke toko kami dan serahkan pakaian Anda.' },
  { num: '02', title: 'Proses Laundry', desc: 'Kami cuci, keringkan, dan setrika dengan standar terbaik.' },
  { num: '03', title: 'Pantau Status', desc: 'Cek status laundry Anda kapan saja lewat kode order.' },
  { num: '04', title: 'Ambil Pakaian', desc: 'Pakaian bersih siap diambil sesuai estimasi.' },
]

const testimonials = [
  { name: 'Budi S.', text: 'Laundry paling bersih di sini! Baju putih saya jadi kinclong lagi.', rating: 5 },
  { name: 'Sari W.', text: 'Tepat waktu dan harganya terjangkau. Sudah langganan 2 tahun.', rating: 5 },
  { name: 'Andi P.', text: 'Pelayanannya ramah, hasil cucian rapi dan wangi. Recommended!', rating: 5 },
]

const Customer = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [code, setCode] = useState('')

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data)).catch(() => {})
  }, [])

  const handleTrack = (e) => {
    e.preventDefault()
    if (code.trim()) navigate(`/customer/track/${code.trim()}`)
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden">
              <img src="/laundryfoto.jpg" alt="Mega Laundry" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Mega Laundry</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#layanan" className="hover:text-blue-600 transition-colors">Layanan</a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
            <a href="#testimoni" className="hover:text-blue-600 transition-colors">Testimoni</a>
          </div>
          <a
            href={`https://wa.me/${ADMIN_WA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <PhoneIcon className="w-4 h-4" />
            Hubungi Kami
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <CheckBadgeIcon className="w-4 h-4 text-yellow-300" />
            Dipercaya ratusan pelanggan sejak 2020
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
            Laundry Bersih & Wangi,<br />
            <span className="text-yellow-300">Siap Tepat Waktu</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Serahkan pakaian Anda kepada kami. Kami jaga kebersihan dan kerapiannya dengan standar terbaik.
          </p>

          {/* Track order box */}
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-lg mx-auto">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-left">🔍 Cek Status Pesanan</p>
            <form onSubmit={handleTrack} className="flex gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Masukkan kode order..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider"
                />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Cek
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-6 text-center">
          {[['500+', 'Pelanggan Puas'], ['3 Tahun', 'Pengalaman'], ['100%', 'Tepat Waktu']].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-blue-600">{val}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Keunggulan Kami</p>
            <h2 className="text-3xl font-bold text-gray-900">Kenapa Pilih Mega Laundry?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <p className="font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="layanan" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Harga Transparan</p>
            <h2 className="text-3xl font-bold text-gray-900">Daftar Layanan & Harga</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.length === 0
              ? [1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              : services.map((s, i) => (
                  <div key={s.id} className={`rounded-2xl p-6 border-2 relative overflow-hidden ${i === 0 ? 'border-blue-500 bg-blue-600 text-white' : 'border-gray-100 bg-white'}`}>
                    {i === 0 && (
                      <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                        Populer
                      </span>
                    )}
                    <p className={`text-lg font-bold mb-1 ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                    <p className={`text-3xl font-extrabold mb-3 ${i === 0 ? 'text-white' : 'text-blue-600'}`}>
                      Rp{s.price_per_kg.toLocaleString('id-ID')}
                      <span className={`text-sm font-normal ${i === 0 ? 'text-blue-100' : 'text-gray-400'}`}>/kg</span>
                    </p>
                    <p className={`text-sm ${i === 0 ? 'text-blue-100' : 'text-gray-500'}`}>
                      ⏱ Estimasi {s.estimated_day} hari kerja
                    </p>
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Mudah & Simpel</p>
            <h2 className="text-3xl font-bold text-gray-900">Cara Kerja Kami</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
                  <p className="text-4xl font-extrabold text-blue-200 mb-3">{step.num}</p>
                  <p className="font-semibold text-gray-900 mb-2">{step.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-8 -right-4 z-10 items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-400 font-bold text-sm">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Kata Mereka</p>
            <h2 className="text-3xl font-bold text-gray-900">Testimoni Pelanggan</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map(({ name, text, rating }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info & CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Kunjungi Kami Sekarang</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-blue-100">
                  <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-300" />
                  <p className="text-sm">5W43+J59, Jl. Untad I Bumi Roviega, Tondo, Kec. Palu Tim., Kota Palu, Sulawesi Tengah 94111</p>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <ClockIcon className="w-5 h-5 flex-shrink-0 text-yellow-300" />
                  <p className="text-sm">Senin – Minggu, 08.00 – 21.00 WIB</p>
                </div>
                <div className="flex items-center gap-3 text-blue-100">
                  <PhoneIcon className="w-5 h-5 flex-shrink-0 text-yellow-300" />
                  <p className="text-sm">082225206397</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${ADMIN_WA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold py-3.5 px-6 rounded-2xl transition-colors text-sm"
              >
                💬 Chat WhatsApp Admin
              </a>
              <button
                onClick={() => navigate('/customer/track')}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold py-3.5 px-6 rounded-2xl transition-colors text-sm border border-white/20"
              >
                🔍 Cek Status Pesanan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden">
            <img src="/laundryfoto.jpg" alt="Mega Laundry" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-white">Mega Laundry</span>
        </div>
        <p className="text-gray-500 text-xs">© 2026 Mega Laundry. All rights reserved.</p>
      </footer>

    </div>
  )
}

export default Customer
