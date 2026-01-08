"use client"

import { useState } from "react"
import { useTikTok } from "./tiktok-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Users, Heart, Gift, Diamond, Loader2, Radio } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ConnectionPanel() {
  const { username, setUsername, isConnected, connect, disconnect, stats, error, mode, setMode } = useTikTok()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    await connect()
    setIsConnecting(false)
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">TikTok Live</span>
          {isConnected ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Wifi className="w-3 h-3 mr-1" />
              Подключено
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              <WifiOff className="w-3 h-3 mr-1" />
              Отключено
            </Badge>
          )}
          {isConnected && (
            <Badge
              variant="outline"
              className={
                mode === "live"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }
            >
              <Radio className="w-3 h-3 mr-1" />
              {mode === "live" ? "LIVE" : "DEMO"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-switch" className="text-sm font-medium">
              Режим подключения
            </Label>
            <Badge variant="outline" className="text-xs">
              {mode === "live" ? "Реальный TikTok" : "Демо данные"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Демо</span>
            <Switch
              id="mode-switch"
              checked={mode === "live"}
              onCheckedChange={(checked) => setMode(checked ? "live" : "demo")}
              disabled={isConnected}
            />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={mode === "live" ? "Имя стримера TikTok (без @)" : "Любое имя для демо"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isConnected}
            className="bg-secondary/50 border-border/50"
          />
          {isConnected ? (
            <Button onClick={disconnect} variant="destructive">
              Отключить
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting} className="bg-primary hover:bg-primary/80">
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : (
                "Подключить"
              )}
            </Button>
          )}
        </div>

        {mode === "live" && !isConnected && (
          <p className="text-xs text-muted-foreground bg-primary/10 p-2 rounded-md">
            Для подключения к реальному стриму введите имя пользователя TikTok, который сейчас ведет прямой эфир.
          </p>
        )}

        {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}

        {isConnected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Зрители</p>
                <p className="font-mono font-bold">{stats.viewerCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Heart className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Лайки</p>
                <p className="font-mono font-bold">{stats.likeCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Gift className="w-5 h-5 text-chart-3" />
              <div>
                <p className="text-xs text-muted-foreground">Подарки</p>
                <p className="font-mono font-bold">{stats.totalGifts.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
              <Diamond className="w-5 h-5 text-chart-1" />
              <div>
                <p className="text-xs text-muted-foreground">Монеты</p>
                <p className="font-mono font-bold">{stats.totalDiamonds.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
