import { Camera, Upload, Zap, Lightbulb, X, Check, AlertTriangle } from 'lucide-react'

interface PhotoStepProps {
  imageBase64?: string | null
  photoQualityScore?: number | null
  onUploadPhoto?: (file: File) => void
  onGoToStep?: (step: number) => void
  creditsRemaining?: number
}

export default function PhotoStep({
  imageBase64 = null,
  photoQualityScore = null,
  onUploadPhoto,
  onGoToStep,
  creditsRemaining = 15,
}: PhotoStepProps) {
  const qualityStatus =
    photoQualityScore === null
      ? 'pending'
      : photoQualityScore >= 70
        ? 'good'
        : photoQualityScore >= 50
          ? 'warning'
          : 'low'

  const handleUploadClick = () => {
    // In a real app this would open a file picker
    const fakeFile = new File([], 'photo.jpg', { type: 'image/jpeg' })
    onUploadPhoto?.(fakeFile)
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 glow-icon">
          <Camera className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-heading neon-text">
          Foto do Sorriso
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tire ou envie uma foto intraoral do paciente para a analise por IA
        </p>
      </div>

      {/* Upload area or preview */}
      {!imageBase64 ? (
        <div
          className="relative border-2 border-dashed border-border rounded-xl p-8 text-center
                     hover:border-primary/40 transition-colors cursor-pointer group ai-grid-pattern"
          onClick={handleUploadClick}
          role="button"
          tabIndex={0}
          aria-label="Enviar foto dental"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleUploadClick()
            }
          }}
        >
          <div className="space-y-4">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5
                        group-hover:bg-primary/10 transition-colors"
            >
              <Camera className="w-8 h-8 text-primary/60 animate-[float_3s_ease-in-out_infinite]" />
            </div>
            <div>
              <p className="font-medium text-foreground">Arraste a foto aqui</p>
              <p className="text-sm text-muted-foreground mt-1">
                ou clique para selecionar
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground
                       text-sm font-medium btn-glow btn-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={(e) => {
                e.stopPropagation()
                handleUploadClick()
              }}
            >
              <Upload className="w-4 h-4" />
              Enviar Foto
            </button>

            {/* Mobile camera button */}
            <div className="sm:hidden">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border
                         text-sm font-medium text-foreground hover:bg-muted transition-colors btn-press
                         focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUploadClick()
                }}
              >
                <Camera className="w-4 h-4" />
                Usar Camera
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {['JPG', 'PNG', 'HEIC'].map((fmt) => (
                <span
                  key={fmt}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground glow-badge"
                >
                  {fmt}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">ate 10MB</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-elevated rounded-xl overflow-hidden border border-border">
          <div className="relative aspect-[4/3] bg-muted">
            <img
              src={imageBase64}
              alt="Foto dental enviada"
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleUploadClick}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm
                       text-muted-foreground hover:text-foreground transition-colors
                       focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Remover foto"
            >
              <X className="w-4 h-4" />
            </button>
            <span
              className="absolute bottom-3 left-3 text-xs px-2 py-1 rounded-full
                       bg-background/80 backdrop-blur-sm text-foreground font-medium"
            >
              Intraoral
            </span>
          </div>

          {/* Quality indicator */}
          {photoQualityScore !== null && (
            <div className="p-3 border-t border-border">
              {qualityStatus === 'good' && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    Qualidade boa ({photoQualityScore}/100)
                  </span>
                </div>
              )}
              {qualityStatus === 'warning' && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning font-medium">
                    Qualidade aceitavel ({photoQualityScore}/100)
                  </span>
                </div>
              )}
              {qualityStatus === 'low' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      Qualidade baixa ({photoQualityScore}/100)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Tente com mais iluminacao e dentes visiveis
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Additional photos grid */}
      {imageBase64 && (
        <div className="grid grid-cols-2 gap-3">
          {['Sorriso 45\u00B0', 'Face frontal'].map((label) => (
            <button
              key={label}
              className="border-2 border-dashed border-border rounded-xl p-4 text-center
                       hover:border-primary/40 transition-colors group
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={handleUploadClick}
            >
              <Camera className="w-5 h-5 text-muted-foreground mx-auto mb-1 group-hover:text-primary/60 transition-colors" />
              <span className="text-xs text-muted-foreground block">{label}</span>
              <span className="block text-xs text-muted-foreground/60 mt-0.5">
                Opcional
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {imageBase64 && (
        <div className="space-y-3">
          <button
            onClick={() => onGoToStep?.(2)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-primary text-primary-foreground font-medium btn-glow btn-press
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Analise Completa — 2 creditos
          </button>

          <button
            onClick={() => onGoToStep?.(3)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     border border-border text-foreground font-medium hover:bg-muted transition-colors btn-press
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Zap className="w-4 h-4" />
            Caso Rapido — 1 credito
          </button>
          <p className="text-center text-xs text-muted-foreground">
            {creditsRemaining} creditos restantes — Caso Rapido nao inclui DSD e
            preferencias
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Para melhores resultados, use uma foto com boa iluminacao, dentes
          superiores visiveis, e labios afastados naturalmente.
        </p>
      </div>
    </div>
  )
}
