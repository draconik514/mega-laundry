import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { UserIcon, PhoneIcon, MapPinIcon, ScaleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const Customer = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_address: '',
    service_id: '', weight: '', note: ''
  })

  useEffect(() => {
    api.get('/services')
      .then(r => {
        setServices(r.data)
        if (r.data.length > 0) setForm(p => ({ ...p, service_id: r.data[0].id.toString() }))
      })
      .catch(() => toast.error('Gagal memuat layanan'))
      .finally(() => setServicesLoading(false))
  }, [])

  const selectedService = services.find(s => s.id === parseInt(form.service_id))
  const estimatedPrice = selectedService && form.weight
    ? selectedService.price_per_kg * parseFloat(form.weight)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/customer/order', {
        ...form,
        weight: parseFloat(form.weight),
        service_id: parseInt(form.service_id),
        order_source: 'website'
      })
      toast.success(`Order berhasil! Kode: ${response.data.code}`)
      navigate(`/customer/track/${response.data.code}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal membuat order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-lg">🧺</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">LaundryFlow</p>
              <p className="text-xs text-gray-400 leading-tight">Laundry Cepat & Terpercaya</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/customer/track')}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Cek Status →
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pesan Laundry Online</h1>
          <p className="text-gray-500 mt-1">Isi form di bawah, kami akan jemput pakaian Anda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" /> Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="input"
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400" /> No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="input"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" /> Alamat Pickup
                </label>
                <textarea
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  className="input resize-none"
                  rows="2"
                  placeholder="Alamat lengkap untuk penjemputan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Jenis Layanan</label>
                  <select
                    value={form.service_id}
                    onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                    className="input"
                    required
                    disabled={servicesLoading}
                  >
                    {servicesLoading
                      ? <option>Memuat...</option>
                      : services.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} — Rp{s.price_per_kg.toLocaleString('id-ID')}/kg
                          </option>
                        ))
                    }
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <ScaleIcon className="w-3.5 h-3.5 text-gray-400" /> Perkiraan Berat (kg)
                  </label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="input"
                    placeholder="Contoh: 3"
                    required
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <DocumentTextIcon className="w-3.5 h-3.5 text-gray-400" /> Catatan (Opsional)
                </label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="input resize-none"
                  rows="2"
                  placeholder="Contoh: ada karpet, jaket, jangan diperas, dll"
                />
              </div>
            </div>

            {/* Price preview */}
            {estimatedPrice !== null && (
              <div className="mx-6 mb-5 p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Estimasi Harga</p>
                  <p className="text-xl font-bold text-blue-700">
                    Rp{estimatedPrice.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-500">Estimasi selesai</p>
                  <p className="text-sm font-semibold text-blue-700">
                    {selectedService.estimated_day} hari
                  </p>
                </div>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                type="submit"
                disabled={loading || servicesLoading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : '🚀 Kirim Pesanan'}
              </button>
            </div>
          </form>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[['🚐', 'Penjemputan', 'Gratis antar jemput'], ['✨', 'Bersih & Wangi', 'Dijamin bersih'], ['⚡', 'Tepat Waktu', 'Sesuai estimasi']].map(([icon, title, desc]) => (
            <div key={title} className="bg-white rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Customer
