'use client'

import { TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'

interface SummaryGridProps {
  stats: {
    totalSales: number
    txCount: number
    estimatedProfit: number
  }
}

export function SummaryGrid({ stats }: SummaryGridProps) {
  const items = [
    {
      label: 'Penjualan Hari Ini',
      value: `Rp ${stats.totalSales.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Jumlah Transaksi',
      value: stats.txCount.toString(),
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Estimasi Laba Kotor',
      value: `Rp ${stats.estimatedProfit.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className={`${item.bg} p-4 rounded-xl`}>
            <item.icon className={`${item.color} w-6 h-6`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-black text-gray-800">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
