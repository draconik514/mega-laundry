import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'

const Profile = () => {
  const { user, login, logout } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', old_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.new_password && form.new_password !== form.confirm_password) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email }
      if (form.new_password) {
        payload.old_password = form.old_password
        payload.new_password = form.new_password
      }
      const res = await api.put('/profile', payload)
      const { token, user: updatedUser } = res.data
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // refresh user di context dengan re-decode token baru
      window.location.reload()
      toast.success('Profil berhasil diperbarui!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Profil</h1>
        <p className="text-sm text-gray-500 mt-1">Perbarui informasi akun Anda</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" /> Nama
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" /> Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <LockClosedIcon className="w-4 h-4 text-gray-400" /> Ganti Password
              <span className="text-xs font-normal text-gray-400">(opsional)</span>
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={form.old_password}
                onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                className="input"
                placeholder="Password lama"
              />
              <input
                type="password"
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                className="input"
                placeholder="Password baru"
              />
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                className="input"
                placeholder="Konfirmasi password baru"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
