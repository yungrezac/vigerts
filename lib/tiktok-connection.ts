import { WebcastPushConnection } from "tiktok-live-connector"

interface TikTokConnectionEvents {
  onConnect: (state: { roomId: string }) => void
  onLike: (data: {
    uniqueId: string
    nickname: string
    profilePictureUrl: string
    likeCount: number
    totalLikeCount: number
  }) => void
  onGift: (data: {
    uniqueId: string
    nickname: string
    profilePictureUrl: string
    giftId: number
    giftName: string
    giftPictureUrl: string
    diamondCount: number
    repeatCount: number
    repeatEnd: boolean
  }) => void
  onRoomUser: (data: { viewerCount: number }) => void
  onError: (error: Error) => void
  onDisconnect: () => void
}

export class TikTokConnectionManager {
  private connection: WebcastPushConnection | null = null
  private events: TikTokConnectionEvents

  constructor(events: TikTokConnectionEvents) {
    this.events = events
  }

  async connect(username: string): Promise<void> {
    // Clean up existing connection
    if (this.connection) {
      this.connection.disconnect()
    }

    this.connection = new WebcastPushConnection(username, {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000,
      sessionId: undefined,
    })

    // Handle connection
    this.connection.on("connected", (state) => {
      this.events.onConnect({ roomId: state.roomId })
    })

    // Handle likes
    this.connection.on("like", (data) => {
      this.events.onLike({
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        profilePictureUrl: data.profilePictureUrl,
        likeCount: data.likeCount,
        totalLikeCount: data.totalLikeCount,
      })
    })

    // Handle gifts
    this.connection.on("gift", (data) => {
      // Only process when gift streak ends or for non-streak gifts
      if (data.giftType === 1 && !data.repeatEnd) {
        return // Skip intermediate streak updates
      }

      this.events.onGift({
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        profilePictureUrl: data.profilePictureUrl,
        giftId: data.giftId,
        giftName: data.giftName || "Подарок",
        giftPictureUrl: data.giftPictureUrl,
        diamondCount: data.diamondCount,
        repeatCount: data.repeatCount || 1,
        repeatEnd: data.repeatEnd ?? true,
      })
    })

    // Handle room user count
    this.connection.on("roomUser", (data) => {
      this.events.onRoomUser({ viewerCount: data.viewerCount })
    })

    // Handle disconnection
    this.connection.on("disconnected", () => {
      this.events.onDisconnect()
    })

    // Handle errors
    this.connection.on("error", (err) => {
      this.events.onError(err)
    })

    // Connect to the live stream
    await this.connection.connect()
  }

  disconnect(): void {
    if (this.connection) {
      this.connection.disconnect()
      this.connection = null
    }
  }
}
