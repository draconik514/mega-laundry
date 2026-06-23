import React, { useState, useEffect } from 'react'
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, ClockIcon, ScaleIcon } from '@heroicons/react/24/outline'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const emptyForm = { name: '', price_per_kg: '', estimated_day: '' }

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services')
      setServices(data)
    } catch {
      toast.error('Gagal memuat layanan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = {
        name: form.name,
        price_per_kg: parseFloat(form.price_per_kg),
        estimated_day: parseInt(form.estimated_day)
      }
      if (editing) {
        await api.put(`/services/${editing.id}`, data)
        toast.success('Layanan berhasil diupdate')
      } else {
        await api.post('/services', data)
        toast.success('Layanan berhasil ditambahkan')
      }
      fetchServices()
      resetForm()
    } catch {
      toast.error('Gagal menyimpan layanan')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteService = async (id, name) => {
    if (!window.confirm(`Hapus layanan "${name}"?`)) return
    try {
      await api.delete(`/services/${id}`)
      toast.success('Layanan berhasil dihapus')
      fetchServices()
    } catch {
      toast.error('Gagal menghapus layanan')
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowModal(false)
  }

  const editService = (service) => {
    setEditing(service)
    setForm({
      name: service.name,
      price_per_kg: service.price_per_kg.toString(),
      estimated_day: service.estimated_day.toString()
    })
    setShowModal(true)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Layanan</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola layanan dan tarif laundry</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Tambah Layanan
        </button>
      </div>

      {services.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🧴</div>
          <p className="text-gray-500 font-medium">Belum ada layanan</p>
          <p className="text-gray-400 text-sm mt-1">Tambah layanan pertama untuk mulai menerima order</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <div key={service.id} className="card hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🫧</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => editService(service)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteService(service.id, service.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-3">{service.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <ScaleIcon className="w-4 h-4" />
                    Harga per kg
                  </div>
                  <span className="font-bold text-blue-600">
                    Rp{service.price_per_kg.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    Estimasi
                  </div>
                  <span className="font-semibold text-gray-700">
                    {service.estimated_day} hari
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Layanan' : 'Tambah Layanan Baru'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Nama Layanan</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Contoh: Cuci + Setrika"
                  required
                />
              </div>
              <div>
                <label className="label">Harga per Kg (Rp)</label>
                <input
                  type="number"
                  value={form.price_per_kg}
                  onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                  className="input"
                  placeholder="Contoh: 10000"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="label">Estimasi Pengerjaan (Hari)</label>
                <input
                  type="number"
                  value={form.estimated_day}
                  onChange={(e) => setForm({ ...form, estimated_day: e.target.value })}
                  className="input"
                  placeholder="Contoh: 2"
                  required
                  min="1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : editing ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Services
