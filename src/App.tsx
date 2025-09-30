import { useSubscribeDev } from '@subscribe.dev/react'
import './App.css'
import FlyingImageGenerator from './components/FlyingImageGenerator'
import SignInScreen from './components/SignInScreen'

function App() {
  const { isSignedIn } = useSubscribeDev()

  return isSignedIn ? <FlyingImageGenerator /> : <SignInScreen />
}

export default App
