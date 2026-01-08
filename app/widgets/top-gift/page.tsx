"use client"

import { useEffect, useState, useRef } from "react"
import type { TopGift } from "@/lib/tiktok-store"
import { Diamond, Sparkles } from "lucide-react"

export default function TopGiftWidget() {
  const [topGift, setTopGift] = useState<TopGift | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const username = urlParams.get("username")

    if (!username) {
      return
    }

    const connectToStream = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(`/api/tiktok/stream?username=${encodeURIComponent(username)}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "gift") {
            const newGift: TopGift = {
              user: data.user,
              giftName: data.giftName,
              giftPictureUrl: data.giftPictureUrl,
              diamondCount: data.diamondCount,
              repeatCount: data.repeatCount,
              timestamp: Date.now(),
            }

            setTopGift((current) => {
              const newTotal = newGift.diamondCount * newGift.repeatCount
              const currentTotal = current ? current.diamondCount * current.repeatCount : 0
              if (newTotal >= currentTotal || Date.now() - (current?.timestamp || 0) > 30000) {
                setShowAnimation(true)
                setTimeout(() => setShowAnimation(false), 1000)
                return newGift
              }
              return current
            })
          }
        } catch (e) {
          console.error("Error parsing event:", e)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()

        reconnectTimeoutRef.current = setTimeout(() => {
          connectToStream()
        }, 3000)
      }
    }

    connectToStream()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="p-6 font-sans relative overflow-hidden" style={{ background: "transparent", width: "320px" }}>
      {/* Animated background sparkles */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <Sparkles
              key={i}
              className="absolute text-yellow-400 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: 0.6,
              }}
              size={16}
            />
          ))}
        </div>
      )}

      {/* Индикатор соединения */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
      />

      {!topGift ? (
        <div className="text-center py-8 text-gray-400">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
            <Diamond className="w-10 h-10 opacity-30" />
          </div>
          <p>Ожидание подарка...</p>
        </div>
      ) : (
        <div className={`flex flex-col items-center ${showAnimation ? "animate-pulse" : ""}`}>
          {/* Gift Image with Avatar overlay */}
          <div className="relative mb-4">
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full animate-pulse-glow"
              style={{
                background: "radial-gradient(circle, rgba(255, 0, 128, 0.3) 0%, transparent 70%)",
                transform: "scale(1.5)",
              }}
            />

            {/* Gift Image */}
            <img
              src={topGift.giftPictureUrl || "/placeholder.svg?height=100&width=100&query=gift"}
              alt={topGift.giftName}
              className="w-24 h-24 object-contain relative z-10"
              style={{
                filter: "drop-shadow(0 0 20px rgba(255, 0, 128, 0.5))",
              }}
            />

            {/* Avatar overlay */}
            <div
              className="absolute -top-2 -right-2 z-20"
              style={{
                filter: "drop-shadow(0 0 10px rgba(0, 210, 211, 0.5))",
              }}
            >
              <img
                src={topGift.user.profilePictureUrl || "/placeholder.svg?height=44&width=44&query=avatar"}
                alt={topGift.user.nickname}
                className="w-11 h-11 rounded-full object-cover"
                style={{
                  border: "3px solid #00d2d3",
                }}
              />
            </div>
          </div>

          {/* Donor Name */}
          <p
            className="font-bold text-xl mb-1"
            style={{
              color: "#fff",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
            }}
          >
            {topGift.user.nickname}
          </p>

          {/* Gift Name */}
          <p className="text-gray-400 text-sm mb-3">
            {topGift.giftName}
            {topGift.repeatCount > 1 && (
              <span className="ml-1 font-bold" style={{ color: "#ff0080" }}>
                x{topGift.repeatCount}
              </span>
            )}
          </p>

          {/* Diamond Count */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(0, 210, 211, 0.2), rgba(255, 0, 128, 0.2))",
              border: "1px solid rgba(0, 210, 211, 0.3)",
            }}
          >
            <Diamond className="w-5 h-5 text-[#00d2d3]" />
            <span
              className="font-bold font-mono text-xl"
              style={{
                background: "linear-gradient(90deg, #00d2d3, #ff0080)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {(topGift.diamondCount * topGift.repeatCount).toLocaleString()}
            </span>
            <span className="text-gray-400 text-sm">монет</span>
          </div>
        </div>
      )}
    </div>
  )
}
