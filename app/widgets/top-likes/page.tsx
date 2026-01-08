"use client"

import { useEffect, useState, useRef } from "react"
import type { TopLiker, TikTokUser } from "@/lib/tiktok-store"
import { Heart } from "lucide-react"

export default function TopLikesWidget() {
  const [topLikers, setTopLikers] = useState<TopLiker[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const likersMapRef = useRef(new Map<string, TopLiker>())
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

          if (data.type === "like") {
            const user: TikTokUser = data.user
            const existing = likersMapRef.current.get(user.uniqueId)
            const newTotal = (existing?.totalLikes || 0) + data.likeCount

            likersMapRef.current.set(user.uniqueId, {
              user,
              totalLikes: newTotal,
            })

            const sorted = Array.from(likersMapRef.current.values())
              .sort((a, b) => b.totalLikes - a.totalLikes)
              .slice(0, 10)

            setTopLikers(sorted)
          }
        } catch (e) {
          console.error("Error parsing event:", e)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()

        // Переподключение через 3 секунды
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
    <div className="p-4 font-sans" style={{ background: "transparent", width: "380px" }}>
      {/* Индикатор соединения */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
      />

      {/* List */}
      <div className="space-y-2">
        {topLikers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Ожидание лайков...</p>
          </div>
        ) : (
          topLikers.map((liker, index) => (
            <div
              key={liker.user.uniqueId}
              className="flex items-center gap-3 p-3 rounded-xl animate-slide-in"
              style={{
                background:
                  index === 0
                    ? "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05))"
                    : index === 1
                      ? "linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.05))"
                      : index === 2
                        ? "linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.05))"
                        : "rgba(30, 30, 50, 0.5)",
                animationDelay: `${index * 0.1}s`,
                border:
                  index < 3
                    ? `1px solid ${index === 0 ? "rgba(255, 215, 0, 0.4)" : index === 1 ? "rgba(192, 192, 192, 0.4)" : "rgba(205, 127, 50, 0.4)"}`
                    : "1px solid transparent",
              }}
            >
              {/* Rank */}
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

              {/* Avatar */}
              <div className="relative">
                <img
                  src={liker.user.profilePictureUrl || "/placeholder.svg?height=40&width=40&query=avatar"}
                  alt={liker.user.nickname}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{
                    border: `2px solid ${index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#444"}`,
                  }}
                />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{liker.user.nickname}</p>
                <p className="text-xs text-gray-400">@{liker.user.uniqueId}</p>
              </div>

              {/* Likes Count */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-[#ff0080]" fill="#ff0080" />
                  <span
                    className="font-bold font-mono"
                    style={{
                      color: "#ff0080",
                      textShadow: "0 0 10px rgba(255, 0, 128, 0.5)",
                    }}
                  >
                    {liker.totalLikes.toLocaleString()}
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
