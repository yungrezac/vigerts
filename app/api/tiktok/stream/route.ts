import type { NextRequest } from "next/server"
import { TikTokConnectionManager } from "@/lib/tiktok-connection"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get("username")
  const mode = searchParams.get("mode") || "live" // "live" or "demo"

  if (!username) {
    return new Response(JSON.stringify({ error: "Username is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const encoder = new TextEncoder()

  // Demo mode for testing without real TikTok connection
  if (mode === "demo") {
    return createDemoStream(encoder, username)
  }

  // Real TikTok Live connection
  let connectionManager: TikTokConnectionManager | null = null
  let isStreamClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        if (!isStreamClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch {
            isStreamClosed = true
          }
        }
      }

      connectionManager = new TikTokConnectionManager({
        onConnect: (state) => {
          sendEvent({
            type: "connected",
            roomId: state.roomId,
            username,
          })
        },
        onLike: (data) => {
          sendEvent({
            type: "like",
            user: {
              uniqueId: data.uniqueId,
              nickname: data.nickname,
              profilePictureUrl: data.profilePictureUrl,
            },
            likeCount: data.likeCount,
            totalLikeCount: data.totalLikeCount,
          })
        },
        onGift: (data) => {
          sendEvent({
            type: "gift",
            user: {
              uniqueId: data.uniqueId,
              nickname: data.nickname,
              profilePictureUrl: data.profilePictureUrl,
            },
            giftId: data.giftId,
            giftName: data.giftName,
            giftPictureUrl: data.giftPictureUrl,
            diamondCount: data.diamondCount,
            repeatCount: data.repeatCount,
          })
        },
        onRoomUser: (data) => {
          sendEvent({
            type: "roomUser",
            viewerCount: data.viewerCount,
          })
        },
        onError: (error) => {
          sendEvent({
            type: "error",
            message: getErrorMessage(error),
          })
        },
        onDisconnect: () => {
          sendEvent({
            type: "disconnected",
            message: "Стрим завершен или соединение потеряно",
          })
          isStreamClosed = true
          controller.close()
        },
      })

      try {
        await connectionManager.connect(username)
      } catch (error) {
        sendEvent({
          type: "error",
          message: getErrorMessage(error),
        })
        controller.close()
      }
    },
    cancel() {
      isStreamClosed = true
      if (connectionManager) {
        connectionManager.disconnect()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("LIVE has ended")) {
      return "Стрим завершен"
    }
    if (error.message.includes("not found")) {
      return "Пользователь не найден или не ведет стрим"
    }
    if (error.message.includes("offline")) {
      return "Пользователь сейчас не в эфире"
    }
    return error.message
  }
  return "Неизвестная ошибка подключения"
}

// Demo mode implementation for testing
function createDemoStream(encoder: TextEncoder, username: string) {
  const DEMO_USERS = [
    { uniqueId: "streamer_fan1", nickname: "Александр", profilePictureUrl: "/young-man-avatar.png" },
    { uniqueId: "tiktok_lover", nickname: "Мария К.", profilePictureUrl: "/young-woman-avatar.png" },
    { uniqueId: "mega_supporter", nickname: "Дмитрий", profilePictureUrl: "/avatar-man-glasses.jpg" },
    { uniqueId: "live_queen", nickname: "Анна", profilePictureUrl: "/blonde-woman-avatar.png" },
    { uniqueId: "night_owl", nickname: "Кирилл", profilePictureUrl: "/avatar-man-beard.jpg" },
    { uniqueId: "lucky_star", nickname: "Елена", profilePictureUrl: "/avatar-woman-brunette.jpg" },
    { uniqueId: "gift_master", nickname: "Максим", profilePictureUrl: "/avatar-young-man-smile.jpg" },
    { uniqueId: "pink_diamond", nickname: "Ольга", profilePictureUrl: "/avatar-woman-redhead.jpg" },
  ]

  const DEMO_GIFTS = [
    { giftId: 1, giftName: "Роза", giftPictureUrl: "/rose-gift-tiktok.jpg", diamondCount: 1 },
    { giftId: 2, giftName: "TikTok", giftPictureUrl: "/tiktok-logo-gift.jpg", diamondCount: 5 },
    { giftId: 3, giftName: "Сердце", giftPictureUrl: "/heart-gift-glowing.jpg", diamondCount: 10 },
    { giftId: 4, giftName: "Корона", giftPictureUrl: "/golden-crown-gift.jpg", diamondCount: 50 },
    { giftId: 5, giftName: "Бриллиант", giftPictureUrl: "/diamond-gem-sparkling.jpg", diamondCount: 100 },
    { giftId: 6, giftName: "Лев", giftPictureUrl: "/lion-king-gift-golden.jpg", diamondCount: 500 },
    { giftId: 7, giftName: "Вселенная", giftPictureUrl: "/universe-galaxy-gift.jpg", diamondCount: 1000 },
  ]

  let intervalId: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", roomId: `demo_${Date.now()}`, username })}\n\n`),
      )

      intervalId = setInterval(() => {
        try {
          const eventType = Math.random()
          const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)]

          if (eventType < 0.6) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "like",
                  user,
                  likeCount: Math.floor(Math.random() * 20) + 1,
                })}\n\n`,
              ),
            )
          } else if (eventType < 0.85) {
            const weights = [0.3, 0.25, 0.2, 0.12, 0.08, 0.04, 0.01]
            let giftIndex = 0
            const random = Math.random()
            let cumulative = 0
            for (let i = 0; i < weights.length; i++) {
              cumulative += weights[i]
              if (random < cumulative) {
                giftIndex = i
                break
              }
            }
            const gift = DEMO_GIFTS[giftIndex]
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "gift",
                  user,
                  ...gift,
                  repeatCount: Math.floor(Math.random() * 5) + 1,
                })}\n\n`,
              ),
            )
          } else {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "roomUser",
                  viewerCount: Math.floor(Math.random() * 5000) + 100,
                })}\n\n`,
              ),
            )
          }
        } catch {
          if (intervalId) clearInterval(intervalId)
        }
      }, 1500)
    },
    cancel() {
      if (intervalId) clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
