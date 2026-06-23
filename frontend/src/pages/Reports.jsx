import React, { useState, useEffect } from 'react'
import {
  CurrencyDollarIcon, ChartBarIcon, ShoppingBagIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import CardStats from '../components/CardStats'
import api from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444']

const fmt = (v) => `Rp${Number(v).toLocaleString('id-ID')}`

const Reports = () => {
  const [report, setReport] = useState({
    dailyRevenue: 0, monthlyRevenue: 0, totalRevenue: 0,
    totalOrders: 0, dailyOrders: 0, monthlyOrders: 0,
    averageOrder: 0, revenueByService: [], dailyData: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/financial')
      .then(({ data: d }) => {
        setReport({
          dailyRevenue: d.daily_revenue ?? 0,
          monthlyRevenue: d.monthly_revenue ?? 0,
          totalRevenue: d.total_revenue ?? 0,
          totalOrders: d.total_orders ?? 0,
          dailyOrders: d.daily_orders ?? 0,
          monthlyOrders: d.monthly_orders ?? 0,
          averageOrder: d.average_order ?? 0,
          revenueByService: (d.revenue_by_service ?? []).map(s => ({
            serviceName: s.service_name,
            totalOrders: s.total_orders,
            totalRevenue: s.total_revenue
          })),
          dailyData: d.daily_data ?? []
        })
      })
      .catch(() => toast.error('Gagal memuat laporan keuangan'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-500 text-sm mt-1">Ringkasan pendapatan dan performa bisnis</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStats
          title="Pendapatan Hari Ini"
          value={fmt(report.dailyRevenue)}
          icon={<CurrencyDollarIcon className="w-5 h-5" />}
          color="blue"
          subtitle={`${report.dailyOrders} order hari ini`}
        />
        <CardStats
          title="Pendapatan Bulan Ini"
          value={fmt(report.monthlyRevenue)}
          icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
          color="green"
          subtitle={`${report.monthlyOrders} order bulan ini`}
        />
        <CardStats
          title="Total Pendapatan"
          value={fmt(report.totalRevenue)}
          icon={<ChartBarIcon className="w-5 h-5" />}
          color="purple"
        />
        <CardStats
          title="Rata-rata per Order"
          value={fmt(report.averageOrder)}
          icon={<ShoppingBagIcon className="w-5 h-5" />}
          color="yellow"
          subtitle={`dari ${report.totalOrders} total order`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card lg:col-span-2">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Pendapatan 30 Hari Terakhir</h3>
            <p className="text-xs text-gray-400 mt-0.5">Hanya dari order yang sudah selesai</p>
          </div>
          {report.dailyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Belum ada data pendapatan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={report.dailyData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [fmt(v), 'Pendapatan']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Per Layanan</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribusi pendapatan</p>
          </div>
          {report.revenueByService.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Belum ada data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={report.revenueByService}
                  dataKey="totalRevenue"
                  nameKey="serviceName"
                  cx="50%" cy="45%"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {report.revenueByService.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Service detail table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Detail per Layanan</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Layanan</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Order</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {report.revenueByService.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-900">{item.serviceName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600">{item.totalOrders}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">{fmt(item.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports
