import { useSubscribeDev } from '@subscribe.dev/react'

export default function SignInScreen() {
  const { signIn } = useSubscribeDev()

  return (
    <div className="sign-in-container">
      <div className="sign-in-content">
        <div className="sign-in-header">
          <h1 className="sign-in-title">✈️ Flying Image Generator</h1>
          <p className="sign-in-subtitle">
            Transform your photos and make people look like they're flying through the air!
          </p>
        </div>

        <div className="sign-in-features">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <p>AI-powered image transformation</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <p>Professional quality results</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <p>Fast processing</p>
          </div>
        </div>

        <button onClick={signIn} className="sign-in-button">
          Sign In to Get Started
        </button>

        <p className="sign-in-footer">
          Start creating amazing flying images in seconds
        </p>
      </div>
    </div>
  )
}