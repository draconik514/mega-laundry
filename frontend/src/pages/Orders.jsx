import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import OrderTable from '../components/OrderTable'
import api from '../services/api'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending_pickup', label: 'Menunggu Pickup' },
  { value: 'picked_up', label: 'Dijemput' },
  { value: 'washing', label: 'Dicuci' },
  { value: 'drying', label: 'Dikeringkan' },
  { value: 'ironing', label: 'Disetrika' },
  { value: 'ready_for_delivery', label: 'Siap Diantar' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const sourceOptions = [
  { value: 'walk_in', label: '🏪 Datang Langsung' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'website', label: '🖥️ Website' },
]

const emptyForm = {
  customer_name: '', customer_phone: '', customer_address: '',
  service_id: '', weight: '', note: '', order_source: 'walk_in'
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [date, setDate] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [services, setServices] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [successInfo, setSuccessInfo] = useState(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { fetchOrders() }, [search, status, date])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status !== 'all') params.append('status', status)
      if (date) params.append('date', date)
      const { data } = await api.get(`/orders?${params}`)
      setOrders(data || [])
    } catch {
      toast.error('Gagal memuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    if (services.length > 0) return
    try {
      const { data } = await api.get('/services')
      setServices(data || [])
      if (data.length > 0) {
        setForm(f => ({ ...f, service_id: data[0].id.toString() }))
      }
    } catch {
      toast.error('Gagal memuat layanan')
    }
  }

  const openModal = () => {
    setForm(emptyForm)
    setSuccessInfo(null)
    setShowModal(true)
    fetchServices()
  }

  const closeModal = () => {
    setShowModal(false)
    setSuccessInfo(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/orders', {
        ...form,
        weight: parseFloat(form.weight),
        service_id: parseInt(form.service_id),
      })
      toast.success(`Pesanan berhasil dibuat!`)
      setSuccessInfo(data)
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat pesanan')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === parseInt(form.service_id))
  const estimatedPrice = selectedService && form.weight
    ? selectedService.price_per_kg * parseFloat(form.weight || 0)
    : null

  const hasFilter = searchInput || status !== 'all' || date

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('all')
    setDate('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola semua pesanan laundry</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Buat Pesanan
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-48">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input sm:w-44"
          />
          {hasFilter && (
            <button onClick={clearFilters} className="btn-secondary gap-1.5 whitespace-nowrap">
              <XMarkIcon className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Memuat...' : `${orders.length} pesanan ditemukan`}
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <OrderTable orders={orders} />
        )}
      </div>

      {/* Modal Buat Pesanan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Buat Pesanan Baru</h2>
                <p className="text-xs text-gray-400 mt-0.5">Catat pesanan pelanggan yang datang langsung</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Success state */}
            {successInfo ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Pesanan Berhasil Dicatat!</h3>
                <p className="text-sm text-gray-500 mb-6">Berikut detail pesanan yang baru dibuat</p>

                <div className="w-full bg-blue-50 rounded-2xl p-5 text-left space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Kode Pesanan</span>
                    <span className="text-lg font-bold text-blue-600 tracking-wider font-mono">
                      {successInfo.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Harga</span>
                    <span className="text-base font-bold text-gray-900">
                      Rp{successInfo.total_price?.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-6">
                  Berikan kode ini ke pelanggan untuk tracking status laundry mereka
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setSuccessInfo(null)
                      setForm({ ...emptyForm, service_id: form.service_id })
                    }}
                    className="btn-secondary flex-1"
                  >
                    + Pesanan Lagi
                  </button>
                  <button onClick={closeModal} className="btn-primary flex-1">
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                  {/* Sumber pesanan */}
                  <div>
                    <label className="label">Sumber Pesanan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {sourceOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, order_source: opt.value })}
                          className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all text-center ${
                            form.order_source === opt.value
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info pelanggan */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="label">Nama Pelanggan <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        className="input"
                        placeholder="Nama lengkap"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="label">No. WhatsApp</label>
                      <input
                        type="tel"
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                        className="input"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Alamat <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
                    <input
                      type="text"
                      value={form.customer_address}
                      onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                      className="input"
                      placeholder="Alamat pelanggan"
                    />
                  </div>

                  {/* Layanan & berat */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Layanan <span className="text-red-400">*</span></label>
                      <select
                        value={form.service_id}
                        onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                        className="input"
                        required
                      >
                        {services.length === 0
                          ? <option value="">Memuat...</option>
                          : services.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="label">Berat (kg) <span className="text-red-400">*</span></label>
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

                  {/* Estimasi harga */}
                  {estimatedPrice !== null && estimatedPrice > 0 && (
                    <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-500 font-medium">Estimasi Total</p>
                        <p className="text-xl font-bold text-blue-700">
                          Rp{estimatedPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                      {selectedService && (
                        <div className="text-right">
                          <p className="text-xs text-blue-400">Estimasi selesai</p>
                          <p className="text-sm font-semibold text-blue-600">{selectedService.estimated_day} hari</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="label">Catatan <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="input resize-none"
                      rows="2"
                      placeholder="Contoh: ada karpet, jaket tebal, jangan diperas"
                    />
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Batal
                  </button>
                  <button type="submit" disabled={submitting || services.length === 0} className="btn-primary flex-1">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </span>
                    ) : 'Buat Pesanan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
