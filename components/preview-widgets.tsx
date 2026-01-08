"use client"

import { useTikTok } from "./tiktok-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Diamond, Gift } from "lucide-react"

export function PreviewWidgets() {
  const { topLikers, topDonors, topGift, isConnected } = useTikTok()

  if (!isConnected) {
    return <div className="text-center text-muted-foreground py-8">Подключитесь к стриму для просмотра виджетов</div>
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Top Likes Preview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent" />
            Топ 10 по лайкам
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topLikers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Ожидание лайков...</p>
          ) : (
            topLikers.slice(0, 5).map((liker, index) => (
              <div key={liker.user.uniqueId} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
                <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}</span>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={liker.user.profilePictureUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{liker.user.nickname.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate flex-1">{liker.user.nickname}</span>
                <span className="text-xs font-mono text-accent">{liker.totalLikes.toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Donors Preview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Diamond className="w-4 h-4 text-primary" />
            Топ дарители
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topDonors.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Ожидание подарков...</p>
          ) : (
            topDonors.slice(0, 5).map((donor, index) => (
              <div key={donor.user.uniqueId} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
                <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}</span>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={donor.user.profilePictureUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{donor.user.nickname.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate flex-1">{donor.user.nickname}</span>
                <span className="text-xs font-mono text-primary">{donor.totalDiamonds.toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Top Gift Preview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gift className="w-4 h-4 text-chart-3" />
            Топ подарок
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!topGift ? (
            <p className="text-xs text-muted-foreground text-center py-4">Ожидание подарка...</p>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative">
                <img
                  src={topGift.giftPictureUrl || "/placeholder.svg?height=64&width=64&query=gift"}
                  alt={topGift.giftName}
                  className="w-16 h-16 object-contain"
                />
                <Avatar className="absolute -top-2 -right-2 w-8 h-8 border-2 border-card">
                  <AvatarImage src={topGift.user.profilePictureUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{topGift.user.nickname.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-xs font-medium">{topGift.user.nickname}</p>
              <p className="text-xs text-muted-foreground">
                {topGift.giftName} x{topGift.repeatCount}
              </p>
              <p className="text-xs font-mono text-primary">
                {(topGift.diamondCount * topGift.repeatCount).toLocaleString()} монет
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
