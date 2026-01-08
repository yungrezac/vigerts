"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"
import type { TopLiker, TopDonor, TopGift, StreamStats, TikTokUser } from "@/lib/tiktok-store"

interface TikTokContextType {
  username: string
  setUsername: (username: string) => void
  isConnected: boolean
  mode: "live" | "demo"
  setMode: (mode: "live" | "demo") => void
  connect: () => Promise<void>
  disconnect: () => void
  topLikers: TopLiker[]
  topDonors: TopDonor[]
  topGift: TopGift | null
  stats: StreamStats
  error: string | null
}

const TikTokContext = createContext<TikTokContextType | null>(null)

export function useTikTok() {
  const context = useContext(TikTokContext)
  if (!context) {
    throw new Error("useTikTok must be used within TikTokProvider")
  }
  return context
}

export function TikTokProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [mode, setMode] = useState<"live" | "demo">("demo")
  const [topLikers, setTopLikers] = useState<TopLiker[]>([])
  const [topDonors, setTopDonors] = useState<TopDonor[]>([])
  const [topGift, setTopGift] = useState<TopGift | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<StreamStats>({
    viewerCount: 0,
    likeCount: 0,
    totalGifts: 0,
    totalDiamonds: 0,
    isConnected: false,
    roomId: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const likersMapRef = useRef<Map<string, TopLiker>>(new Map())
  const donorsMapRef = useRef<Map<string, TopDonor>>(new Map())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateTopLikers = useCallback((user: TikTokUser, likeCount: number) => {
    const existing = likersMapRef.current.get(user.uniqueId)
    const newTotal = (existing?.totalLikes || 0) + likeCount

    likersMapRef.current.set(user.uniqueId, {
      user,
      totalLikes: newTotal,
    })

    const sorted = Array.from(likersMapRef.current.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10)

    setTopLikers(sorted)
  }, [])

  const updateTopDonors = useCallback((user: TikTokUser, diamonds: number) => {
    const existing = donorsMapRef.current.get(user.uniqueId)

    donorsMapRef.current.set(user.uniqueId, {
      user,
      totalDiamonds: (existing?.totalDiamonds || 0) + diamonds,
      giftCount: (existing?.giftCount || 0) + 1,
    })

    const sorted = Array.from(donorsMapRef.current.values())
      .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
      .slice(0, 10)

    setTopDonors(sorted)
  }, [])

  const setupEventSource = useCallback(() => {
    if (!username.trim()) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(
      `/api/tiktok/stream?username=${encodeURIComponent(username.trim())}&mode=${mode}`,
    )
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setStats((prev) => ({ ...prev, isConnected: true }))
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case "connected":
            setStats((prev) => ({
              ...prev,
              roomId: data.roomId,
              isConnected: true,
            }))
            break

          case "like":
            updateTopLikers(data.user, data.likeCount)
            setStats((prev) => ({
              ...prev,
              likeCount: prev.likeCount + data.likeCount,
            }))
            break

          case "gift":
            const totalDiamonds = data.diamondCount * data.repeatCount
            updateTopDonors(data.user, totalDiamonds)
            setTopGift({
              user: data.user,
              giftName: data.giftName,
              giftPictureUrl: data.giftPictureUrl,
              diamondCount: data.diamondCount,
              repeatCount: data.repeatCount,
              timestamp: Date.now(),
            })
            setStats((prev) => ({
              ...prev,
              totalGifts: prev.totalGifts + data.repeatCount,
              totalDiamonds: prev.totalDiamonds + totalDiamonds,
            }))
            break

          case "roomUser":
            setStats((prev) => ({
              ...prev,
              viewerCount: data.viewerCount,
            }))
            break

          case "error":
            setError(data.message)
            break
        }
      } catch (e) {
        console.error("Error parsing event:", e)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setStats((prev) => ({ ...prev, isConnected: false }))
      eventSource.close()

      // Переподключение через 3 секунды
      reconnectTimeoutRef.current = setTimeout(() => {
        setupEventSource()
      }, 3000)
    }
  }, [username, mode, updateTopLikers, updateTopDonors])

  const connect = useCallback(async () => {
    if (!username.trim()) {
      setError("Введите имя пользователя TikTok")
      return
    }

    setError(null)

    // Очищаем таймаут реконнекта если есть
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    likersMapRef.current.clear()
    donorsMapRef.current.clear()
    setTopLikers([])
    setTopDonors([])
    setTopGift(null)

    setupEventSource()
  }, [username, setupEventSource])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setStats((prev) => ({ ...prev, isConnected: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <TikTokContext.Provider
      value={{
        username,
        setUsername,
        isConnected,
        mode,
        setMode,
        connect,
        disconnect,
        topLikers,
        topDonors,
        topGift,
        stats,
        error,
      }}
    >
      {children}
    </TikTokContext.Provider>
  )
}
