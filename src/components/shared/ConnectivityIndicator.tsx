'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Wifi, WifiOff, CloudSync, RefreshCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SyncManager } from '@/lib/sync-manager'
import { Button } from '@/components/ui/button'

export function ConnectivityIndicator() {
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleManualSync = async () => {
    setIsSyncing(true)
    await SyncManager.startSync()
    setIsSyncing(false)
  }

  return (
    <div className="flex items-center gap-3">
      {isOnline ? (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100 animate-pulse">
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </div>
      )}
      
      {isOnline && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 rounded-full hover:bg-slate-100" 
          onClick={handleManualSync}
          disabled={isSyncing}
        >
          <RefreshCcw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}
