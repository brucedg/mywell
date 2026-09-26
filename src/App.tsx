import { useState } from 'react'
import Home from './screens/Home'
import Contacts from './screens/Contacts'

type Screen = 'home' | 'contacts'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  return screen === 'home'
    ? <Home onEditContacts={() => setScreen('contacts')} />
    : <Contacts onBack={() => setScreen('home')} />
}
