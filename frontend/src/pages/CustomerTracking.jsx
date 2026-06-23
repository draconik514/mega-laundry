import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusTimeline from '../components/StatusTimeline'
import api from '../services/api'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const CustomerTracking = () => {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(urlCode || '')
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode)
      handleSearch(urlCode)
    }
  }, [urlCode])

  const handleSearch = async (searchCode = code) => {
    if (!searchCode.trim()) {
      toast.error('Masukkan kode order')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const response = await api.get(`/customer/order/${searchCode.trim()}`)
      setOrder(response.data.order)
      setHistory(response.data.history || [])
    } catch {
      toast.error('Order tidak ditemukan')
      setOrder(null)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const statusLabels = {
    pending_pickup: 'Menunggu Pickup', picked_up: 'Dijemput', washing: 'Dicuci',
    drying: 'Dikeringkan', ironing: 'Disetrika', ready_for_delivery: 'Siap Diantar',
    completed: 'Selesai', cancelled: 'Dibatalkan'
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
              <p className="text-xs text-gray-400 leading-tight">Tracking Pesanan</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/customer')}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            + Buat Order
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cek Status Laundry</h1>
          <p className="text-gray-500 mt-1">Masukkan kode order untuk melihat status terkini</p>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch() }} className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: LW12345678"
                className="input pl-10 tracking-wider"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Cek'}
            </button>
          </form>
        </div>

        {/* Order result */}
        {order && !loading && (
          <div className="space-y-4">
            {/* Order info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Kode Order</p>
                  <p className="text-2xl font-bold text-blue-600 tracking-wider">{order.code}</p>
                </div>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Pelanggan</p>
                  <p className="font-semibold text-gray-800">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Layanan</p>
                  <p className="font-semibold text-gray-800">{order.service_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Berat</p>
                  <p className="font-semibold text-gray-800">{order.weight} kg</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Harga</p>
                  <p className="font-semibold text-gray-800">Rp{order.total_price?.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Estimasi Selesai</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {order.created_at
                      ? new Date(new Date(order.created_at).getTime() + (order.estimated_day || 2) * 86400000)
                          .toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'}
                  </p>
                </div>
                <a
                  href={`https://wa.me/62${order.customer_phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  💬 Hubungi Admin
                </a>
              </div>
            </div>

            {/* Status timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Progress Laundry</h3>
              <StatusTimeline currentStatus={order.status} />
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
                <div className="space-y-2">
                  {history.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-gray-400 text-xs w-36 flex-shrink-0">
                        {new Date(h.updated_at).toLocaleString('id-ID')}
                      </span>
                      <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 text-xs font-medium">
                        {statusLabels[h.status] || h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {searched && !order && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-gray-700">Order tidak ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">Pastikan kode order yang dimasukkan benar</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerTracking
