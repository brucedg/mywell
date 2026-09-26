import { useState } from 'react'
import { useContacts } from '../hooks/useContacts'

interface Props {
  onBack: () => void
}

export default function Contacts({ onBack }: Props) {
  const { contacts, add, remove } = useContacts()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    setError('')
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required')
      return
    }
    const cleaned = phone.trim().replace(/[\s\-()]/g, '')
    if (!/^\+?[\d]{7,15}$/.test(cleaned)) {
      setError('Enter a valid phone number e.g. +64 21 123 456')
      return
    }
    const e164 = cleaned.startsWith('+') ? cleaned : `+${cleaned}`
    add({ name: name.trim(), phone: e164 })
    setName('')
    setPhone('')
  }

  return (
    <div className="screen contacts">
      <div className="contacts-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Contacts</h2>
      </div>

      <ul className="contact-list">
        {contacts.length === 0 && (
          <li className="contact-empty">No contacts yet — add up to 5 below</li>
        )}
        {contacts.map(c => (
          <li key={c.id} className="contact-row">
            <div className="contact-info">
              <span className="contact-name">{c.name}</span>
              <span className="contact-phone">{c.phone}</span>
            </div>
            <button
              className="remove-btn"
              onClick={() => remove(c.id)}
              aria-label={`Remove ${c.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {contacts.length < 5 ? (
        <div className="add-form">
          <h3>Add contact</h3>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="tel"
            placeholder="+64 21 123 456"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          {error && <p className="form-error">{error}</p>}
          <button className="add-btn" onClick={handleAdd}>Add</button>
        </div>
      ) : (
        <p className="max-notice">Maximum 5 contacts reached</p>
      )}
    </div>
  )
}
