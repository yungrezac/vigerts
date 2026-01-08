"use client"

import { useState, useEffect } from "react"
import { useTikTok } from "./tiktok-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, ExternalLink, AlertCircle } from "lucide-react"

interface WidgetLink {
  name: string
  path: string
  description: string
  width: string
  height: string
}

const widgets: WidgetLink[] = [
  {
    name: "Топ 10 по лайкам",
    path: "/widgets/top-likes",
    description: "Показывает аватарку, имя и количество лайков",
    width: "400",
    height: "600",
  },
  {
    name: "Топ дарители",
    path: "/widgets/top-donors",
    description: "Список лучших дарителей по потраченным монетам",
    width: "400",
    height: "600",
  },
  {
    name: "Топ подарок",
    path: "/widgets/top-gift",
    description: "Изображение подарка с аватаркой и никнеймом дарителя",
    width: "350",
    height: "320",
  },
]

export function WidgetLinks() {
  const { username, isConnected } = useTikTok()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const getFullUrl = (path: string) => {
    const url = `${origin}${path}`
    if (username) {
      return `${url}?username=${encodeURIComponent(username)}`
    }
    return url
  }

  const copyToClipboard = async (path: string, index: number) => {
    const url = getFullUrl(path)
    await navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Виджеты для OBS</CardTitle>
        <p className="text-sm text-muted-foreground">Скопируйте ссылку и добавьте как Browser Source в OBS</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isConnected && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Подключитесь к стриму, чтобы получить рабочие ссылки для виджетов</span>
          </div>
        )}

        {widgets.map((widget, index) => (
          <div key={widget.path} className="space-y-2 p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{widget.name}</h4>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
              </div>
              <a
                href={getFullUrl(widget.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input value={getFullUrl(widget.path)} readOnly className="bg-background/50 text-xs font-mono" />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(widget.path, index)}
                className="shrink-0"
              >
                {copiedIndex === index ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Размер: {widget.width}x{widget.height}px
            </p>
          </div>
        ))}

        <div className="pt-2 border-t border-border/50">
          <h4 className="text-sm font-medium mb-2">Настройки OBS Browser Source:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>1. Добавьте Browser Source в OBS</li>
            <li>2. Вставьте скопированную ссылку</li>
            <li>3. Установите размеры согласно рекомендациям</li>
            <li>4. Включите Custom CSS для прозрачного фона:</li>
          </ul>
          <pre className="mt-2 p-2 bg-secondary/50 rounded text-xs font-mono text-primary overflow-x-auto">
            {"body { background: transparent !important; }"}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
