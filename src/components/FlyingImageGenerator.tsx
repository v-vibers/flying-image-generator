import { useState, useRef } from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'

type ErrorType = {
  type: 'insufficient_credits' | 'rate_limit_exceeded' | 'network' | 'invalid_image' | 'unknown'
  message: string
  retryAfter?: number
}

type GenerationHistory = {
  originalImage: string
  generatedImage: string
  timestamp: number
}

export default function FlyingImageGenerator() {
  const { client, usage, subscriptionStatus, subscribe, signOut, user, useStorage } = useSubscribeDev()

  const [history, setHistory, syncStatus] = useStorage!<GenerationHistory[]>('generation-history', [])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError({
        type: 'invalid_image',
        message: 'Please select a valid image file (JPG, PNG, etc.)'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError({
        type: 'invalid_image',
        message: 'Image size must be less than 10MB'
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setGeneratedImage(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const generateFlyingImage = async () => {
    if (!client || !selectedImage) return

    setLoading(true)
    setError(null)

    try {
      const { output } = await client.run('black-forest-labs/flux-kontext-max', {
        input: {
          prompt: 'a person flying through the air with arms outstretched, soaring like a superhero, dynamic pose, motion blur background, dramatic lighting, professional photography',
          input_image: selectedImage,
          width: 1024,
          height: 1024
        }
      })

      const resultUrl = output[0] as string
      setGeneratedImage(resultUrl)

      // Save to history
      const newHistoryItem: GenerationHistory = {
        originalImage: selectedImage,
        generatedImage: resultUrl,
        timestamp: Date.now()
      }
      setHistory([newHistoryItem, ...history.slice(0, 9)]) // Keep last 10 items

    } catch (err: any) {
      console.error('Generation failed:', err)

      if (err.type === 'insufficient_credits') {
        setError({
          type: 'insufficient_credits',
          message: 'You don\'t have enough credits. Please upgrade your plan to continue.'
        })
      } else if (err.type === 'rate_limit_exceeded') {
        const retrySeconds = Math.ceil((err.retryAfter || 60000) / 1000)
        setError({
          type: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Please try again in ${retrySeconds} seconds.`,
          retryAfter: err.retryAfter
        })
      } else {
        setError({
          type: 'unknown',
          message: err.message || 'Failed to generate image. Please try again.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `flying-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetImage = () => {
    setSelectedImage(null)
    setGeneratedImage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="app-container">
      {/* Header with User Info */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">✈️ Flying Image Generator</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            {user?.email && (
              <span className="user-email">{user.email}</span>
            )}
            <button onClick={signOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Usage and Subscription Status */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Credits:</span>
          <span className="status-value credits">
            {usage?.remainingCredits ?? 0} remaining
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Plan:</span>
          <span className="status-value plan">
            {subscriptionStatus?.plan?.name ?? 'Free'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Storage:</span>
          <span className={`status-value sync-${syncStatus}`}>
            {syncStatus === 'syncing' ? '⟳' : syncStatus === 'synced' ? '✓' : syncStatus === 'error' ? '✗' : '○'} {syncStatus}
          </span>
        </div>
        <button onClick={subscribe!} className="upgrade-button">
          Manage Subscription
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-label">
              {selectedImage ? (
                <div className="image-preview-container">
                  <img src={selectedImage} alt="Selected" className="image-preview" />
                  <div className="image-overlay">
                    <p>Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📁</span>
                  <p className="upload-text">Click to upload an image</p>
                  <p className="upload-hint">JPG, PNG (max 10MB)</p>
                </div>
              )}
            </label>
          </div>

          {selectedImage && (
            <div className="action-buttons">
              <button
                onClick={generateFlyingImage}
                disabled={loading || !selectedImage}
                className="generate-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    🚀 Make It Fly!
                  </>
                )}
              </button>
              <button
                onClick={resetImage}
                disabled={loading}
                className="reset-button"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={`error-message error-${error.type}`}>
            <span className="error-icon">⚠️</span>
            <div className="error-content">
              <p className="error-text">{error.message}</p>
              {error.type === 'insufficient_credits' && (
                <button onClick={subscribe!} className="error-action-button">
                  Upgrade Now
                </button>
              )}
              {error.type !== 'insufficient_credits' && (
                <button onClick={() => setError(null)} className="error-action-button">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result Section */}
        {generatedImage && (
          <div className="result-section">
            <h2 className="result-title">Your Flying Image</h2>
            <div className="result-container">
              <img src={generatedImage} alt="Flying person" className="result-image" />
              <button
                onClick={() => downloadImage(generatedImage)}
                className="download-button"
              >
                ⬇️ Download Image
              </button>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="history-section">
            <h2 className="history-title">Recent Generations</h2>
            <div className="history-grid">
              {history.map((item, index) => (
                <div key={index} className="history-item" onClick={() => {
                  setSelectedImage(item.originalImage)
                  setGeneratedImage(item.generatedImage)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}>
                  <img src={item.generatedImage} alt={`Generated ${index}`} className="history-thumbnail" />
                  <div className="history-date">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}