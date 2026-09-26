import { useContacts } from '../hooks/useContacts'

const MESSAGE = "Hi, I need some help right now. Please check in on me."

interface Props {
  onEditContacts: () => void
}

export default function Home({ onEditContacts }: Props) {
  const { contacts } = useContacts()
  const hasContacts = contacts.length > 0

  function sendAlert() {
    if (!hasContacts) return
    const numbers = contacts.map(c => c.phone).join(',')
    const body = encodeURIComponent(MESSAGE)
    window.location.href = `sms:${numbers}?body=${body}`
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
    </div>
  )
}
