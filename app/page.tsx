import { TikTokProvider } from "@/components/tiktok-provider"
import { ConnectionPanel } from "@/components/connection-panel"
import { WidgetLinks } from "@/components/widget-links"
import { PreviewWidgets } from "@/components/preview-widgets"

export default function HomePage() {
  return (
    <TikTokProvider>
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="text-center space-y-2 py-4">
            <h1 className="text-3xl md:text-4xl font-bold text-balance">
              <span className="text-primary">TikTok Live</span> Виджеты для OBS
            </h1>
            <p className="text-muted-foreground">Отслеживайте эфир и создавайте красивые оверлеи для стрима</p>
          </header>

          <div className="grid lg:grid-cols-2 gap-6">
            <ConnectionPanel />
            <WidgetLinks />
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Предпросмотр виджетов</h2>
            <PreviewWidgets />
          </section>
        </div>
      </main>
    </TikTokProvider>
  )
}
