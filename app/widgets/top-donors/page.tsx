"use client"

import { useEffect, useState, useRef } from "react"
import type { TopDonor, TikTokUser } from "@/lib/tiktok-store"
import { Diamond, Crown } from "lucide-react"

export default function TopDonorsWidget() {
  const [topDonors, setTopDonors] = useState<TopDonor[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const donorsMapRef = useRef(new Map<string, TopDonor>())
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
            const user: TikTokUser = data.user
            const totalDiamonds = data.diamondCount * data.repeatCount
            const existing = donorsMapRef.current.get(user.uniqueId)

            donorsMapRef.current.set(user.uniqueId, {
              user,
              totalDiamonds: (existing?.totalDiamonds || 0) + totalDiamonds,
              giftCount: (existing?.giftCount || 0) + data.repeatCount,
            })

            const sorted = Array.from(donorsMapRef.current.values())
              .sort((a, b) => b.totalDiamonds - a.totalDiamonds)
              .slice(0, 10)

            setTopDonors(sorted)
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
    <div className="p-4 font-sans relative" style={{ background: "transparent", width: "380px" }}>
      {/* Индикатор соединения */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
      />

      {/* List */}
      <div className="space-y-2">
        {topDonors.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Diamond className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Ожидание подарков...</p>
          </div>
        ) : (
          topDonors.map((donor, index) => (
            <div
              key={donor.user.uniqueId}
              className="flex items-center gap-3 p-3 rounded-xl animate-slide-in"
              style={{
                background:
                  index === 0
                    ? "linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 215, 0, 0.05))"
                    : index === 1
                      ? "linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.05))"
                      : index === 2
                        ? "linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05))"
                        : "rgba(30, 30, 50, 0.5)",
                animationDelay: `${index * 0.1}s`,
                border:
                  index < 3
                    ? `1px solid ${index === 0 ? "rgba(255, 215, 0, 0.5)" : index === 1 ? "rgba(192, 192, 192, 0.4)" : "rgba(205, 127, 50, 0.4)"}`
                    : "1px solid transparent",
              }}
            >
              {/* Rank with Crown for #1 */}
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #ffd700, #ffaa00)"
                        : index === 1
                          ? "linear-gradient(135deg, #c0c0c0, #a0a0a0)"
                          : index === 2
                            ? "linear-gradient(135deg, #cd7f32, #a0522d)"
                            : "rgba(60, 60, 80, 0.8)",
                    color: index < 3 ? "#1a1a2e" : "#888",
                  }}
                >
                  {index + 1}
                </div>
                {index === 0 && (
                  <Crown
                    className="absolute -top-3 -right-1 w-5 h-5 text-yellow-400 animate-glow"
                    style={{ filter: "drop-shadow(0 0 5px #ffd700)" }}
                  />
                )}
              </div>

              {/* Avatar */}
              <img
                src={donor.user.profilePictureUrl || "/placeholder.svg?height=44&width=44&query=avatar"}
                alt={donor.user.nickname}
                className="w-11 h-11 rounded-full object-cover"
                style={{
                  border: `2px solid ${index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#444"}`,
                  boxShadow: index === 0 ? "0 0 15px rgba(255, 215, 0, 0.5)" : "none",
                }}
              />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{donor.user.nickname}</p>
                <p className="text-xs text-gray-400">{donor.giftCount} подарков</p>
              </div>

              {/* Diamonds Count */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Diamond className="w-4 h-4 text-[#00d2d3]" />
                  <span
                    className="font-bold font-mono text-lg"
                    style={{
                      color: "#00d2d3",
                      textShadow: "0 0 10px rgba(0, 210, 211, 0.5)",
                    }}
                  >
                    {donor.totalDiamonds.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
