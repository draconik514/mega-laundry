import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import StatusTimeline from '../components/StatusTimeline'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const statusOptions = [
  { value: 'pending_pickup', label: 'Menunggu Pickup' },
  { value: 'picked_up', label: 'Sudah Dijemput' },
  { value: 'washing', label: 'Dicuci' },
  { value: 'drying', label: 'Dikeringkan' },
  { value: 'ironing', label: 'Disetrika' },
  { value: 'ready_for_delivery', label: 'Siap Diantar' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const statusColors = {
  pending_pickup: 'bg-amber-50 text-amber-700 border-amber-200',
  picked_up: 'bg-blue-50 text-blue-700 border-blue-200',
  washing: 'bg-violet-50 text-violet-700 border-violet-200',
  drying: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ironing: 'bg-pink-50 text-pink-700 border-pink-200',
  ready_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
  </div>
)

const OrderDetail = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => { fetchOrder() }, [code])

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/order/${code}`)
      setOrder(data.order)
      setSelectedStatus(data.order.status)
      setHistory(data.history || [])
    } catch {
      toast.error('Order tidak ditemukan')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async () => {
    if (selectedStatus === order.status) return
    const label = statusOptions.find(s => s.value === selectedStatus)?.label
    if (!window.confirm(`Ubah status menjadi "${label}"?`)) {
      setSelectedStatus(order.status)
      return
    }
    setUpdating(true)
    try {
      await api.put(`/orders/${order.id}/status`, { status: selectedStatus })
      toast.success('Status berhasil diupdate')
      fetchOrder()
    } catch {
      toast.error('Gagal mengupdate status')
      setSelectedStatus(order.status)
    } finally {
      setUpdating(false)
    }
  }

  const deleteOrder = async () => {
    if (!window.confirm('Yakin ingin menghapus order ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await api.delete(`/orders/${order.id}`)
      toast.success('Order berhasil dihapus')
      navigate('/orders')
    } catch {
      toast.error('Gagal menghapus order')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner />
    </div>
  )

  const statusColor = statusColors[order?.status] || 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate">Detail Order</h1>
            <span className="text-gray-400 font-mono text-sm">#{order?.code}</span>
          </div>
        </div>
        <span className={`badge border ${statusColor}`}>
          {statusOptions.find(s => s.value === order?.status)?.label || order?.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Order info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
              Informasi Order
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <InfoRow label="Pelanggan" value={order?.customer_name} />
              <InfoRow label="WhatsApp" value={order?.customer_phone} />
              <InfoRow label="Sumber" value={order?.order_source === 'website' ? '🖥️ Website' : order?.order_source === 'walk_in' ? '🏪 Datang Langsung' : order?.order_source} />
              <InfoRow label="Layanan" value={order?.service_name} />
              <InfoRow label="Berat" value={order?.weight ? `${order.weight} kg` : null} />
              <InfoRow
                label="Total Harga"
                value={order?.total_price ? `Rp${order.total_price.toLocaleString('id-ID')}` : null}
              />
              <div className="col-span-2 sm:col-span-3">
                <InfoRow label="Alamat" value={order?.customer_address} />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <InfoRow
                  label="Estimasi Selesai"
                  value={order?.created_at
                    ? new Date(new Date(order.created_at).getTime() + (order.estimated_day || 2) * 86400000)
                        .toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : null}
                />
              </div>
            </div>
            {order?.note && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Catatan</p>
                <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{order.note}</p>
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-green-500 rounded-full" />
              Progress Status
            </h3>
            <StatusTimeline currentStatus={order?.status} />
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
                Riwayat Status
              </h3>
              <div className="space-y-2">
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-gray-400 text-xs w-36 flex-shrink-0">
                      {new Date(h.updated_at).toLocaleString('id-ID')}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                      {statusOptions.find(s => s.value === h.status)?.label || h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating}
                className="input"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={updateStatus}
                disabled={updating || selectedStatus === order?.status}
                className="btn-primary w-full disabled:opacity-40"
              >
                {updating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Simpan Status
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Zona Bahaya</h3>
            <button
              onClick={deleteOrder}
              className="btn-danger w-full"
            >
              <TrashIcon className="w-4 h-4" />
              Hapus Order
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
