'use client'

import { useState, useCallback, useMemo } from 'react'
import { LocalProduct } from '@/lib/db'

export interface CartItem extends LocalProduct {
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = useCallback((product: LocalProduct) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = useMemo(() => 
    items.reduce((acc, item) => acc + (Number(item.harga_jual) * item.quantity), 0)
  , [items])

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
  }
}
