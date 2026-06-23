import React, { useState, useEffect } from 'react'
import {
  ClipboardDocumentListIcon, ClockIcon,
  CheckCircleIcon, ExclamationTriangleIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import CardStats from '../components/CardStats'
import { statusMap } from '../components/OrderTable'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0, processingOrders: 0, completedOrders: 0,
    lateOrders: 0, revenueToday: 0, weeklyData: [], recentOrders: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    try {
      const { data: d } = await api.get('/dashboard')
      setStats({
        totalOrders: d.total_orders ?? 0,
        processingOrders: d.processing_orders ?? 0,
        completedOrders: d.completed_orders ?? 0,
        lateOrders: d.late_orders ?? 0,
        revenueToday: d.revenue_today ?? 0,
        weeklyData: d.weekly_data ?? [],
        recentOrders: d.recent_orders ?? []
      })
    } catch { toast.error('Gagal memuat dashboard') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang, <span className="font-semibold text-blue-600">{user?.name}</span> — berikut ringkasan bisnis hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <CardStats title="Total Order" value={stats.totalOrders} icon={<ClipboardDocumentListIcon className="w-5 h-5" />} color="blue" />
        <CardStats title="Diproses" value={stats.processingOrders} icon={<ClockIcon className="w-5 h-5" />} color="yellow" />
        <CardStats title="Selesai" value={stats.completedOrders} icon={<CheckCircleIcon className="w-5 h-5" />} color="green" />
        <CardStats title="Terlambat" value={stats.lateOrders} icon={<ExclamationTriangleIcon className="w-5 h-5" />} color="red" />
        <CardStats title="Pendapatan Hari Ini" value={`Rp${stats.revenueToday.toLocaleString('id-ID')}`} icon={<CurrencyDollarIcon className="w-5 h-5" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Order Mingguan</h3>
              <p className="text-xs text-gray-400 mt-0.5">7 hari terakhir</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.weeklyData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Order Terbaru</h3>
            <Link to="/orders" className="text-xs text-blue-600 font-medium hover:underline">Lihat semua</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Belum ada order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => {
                const s = statusMap[order.status]
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.code}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.customer}</p>
                    </div>
                    <span className={`badge text-xs ${s?.color || 'bg-gray-100 text-gray-600'}`}>
                      {s?.label || order.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
