'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem as CartItemType } from '@/hooks/useCart'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
      <div className="flex-1">
        <h4 className="font-bold text-gray-800">{item.nama}</h4>
        <p className="text-sm text-gray-500">
          Rp {Number(item.harga_jual).toLocaleString('id-ID')} / {item.satuan}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-8 text-center font-bold">{item.quantity}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-right min-w-[100px]">
          <p className="font-bold text-blue-600">
            Rp {(Number(item.harga_jual) * item.quantity).toLocaleString('id-ID')}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
