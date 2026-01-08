// Shared state store for TikTok Live data
export interface TikTokUser {
  uniqueId: string
  nickname: string
  profilePictureUrl: string
}

export interface LikeEvent {
  user: TikTokUser
  likeCount: number
  totalLikes: number
}

export interface GiftEvent {
  user: TikTokUser
  giftId: number
  giftName: string
  giftPictureUrl: string
  diamondCount: number
  repeatCount: number
}

export interface TopLiker {
  user: TikTokUser
  totalLikes: number
}

export interface TopDonor {
  user: TikTokUser
  totalDiamonds: number
  giftCount: number
}

export interface TopGift {
  user: TikTokUser
  giftName: string
  giftPictureUrl: string
  diamondCount: number
  repeatCount: number
  timestamp: number
}

export interface StreamStats {
  viewerCount: number
  likeCount: number
  totalGifts: number
  totalDiamonds: number
  isConnected: boolean
  roomId: string | null
}
