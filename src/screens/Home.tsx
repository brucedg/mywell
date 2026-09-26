import { useContacts } from '../hooks/useContacts'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const MESSAGE = "Hi, I need some help right now. Please check in on me."

interface Props {
  onEditContacts: () => void
}

export default function Home({ onEditContacts }: Props) {
  const { contacts } = useContacts()
  const hasContacts = contacts.length > 0
  const { canInstall, showIOSHint, alreadyInstalled, install } = useInstallPrompt()

  function sendAlert() {
    if (!hasContacts) return
    const numbers = contacts.map(c => c.phone)
    const body = encodeURIComponent(MESSAGE)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const uri = isIOS
      ? `sms:${numbers.join(',')}?body=${body}`
      : `sms:${numbers.join(';')}?body=${body}`
    window.location.href = uri
  }

  return (
    <div className="screen home">
      <h1 className="app-name">mywell</h1>

      <div className="button-wrap">
        <button
          className={`bullseye${hasContacts ? '' : ' bullseye--disabled'}`}
          onClick={sendAlert}
          disabled={!hasContacts}
          aria-label="Send help message to my contacts"
        >
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="7" fill="currentColor" />
          </svg>
        </button>

        <p className="status">
          {hasContacts
            ? `Message goes to ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`
            : 'Add contacts before sending'}
        </p>
      </div>

      <button className="contacts-link" onClick={onEditContacts}>
        {hasContacts ? `${contacts.length}/5 contacts` : 'Add contacts'} →
      </button>

      {canInstall && (
        <button className="install-btn" onClick={install}>
          Add to home screen ↓
        </button>
      )}
      {showIOSHint && (
        <p className="install-hint">Tap Share then &ldquo;Add to Home Screen&rdquo; to install</p>
      )}
    </div>
  )
}
