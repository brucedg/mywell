import { useState } from 'react'
import { useContacts } from '../hooks/useContacts'

const COUNTRIES = [
  { code: '+64',  label: '🇳🇿 +64'  },
  { code: '+61',  label: '🇦🇺 +61'  },
  { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+44',  label: '🇬🇧 +44'  },
  { code: '+91',  label: '🇮🇳 +91'  },
  { code: '+27',  label: '🇿🇦 +27'  },
  { code: '+63',  label: '🇵🇭 +63'  },
  { code: '+679', label: '🇫🇯 +679' },
  { code: '+685', label: '🇼🇸 +685' },
  { code: '+676', label: '🇹🇴 +676' },
]

function normalizePhone(raw: string, countryCode: string): string | null {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (hasPlus) return '+' + digits

  // Strip leading 0 (local format: 021… → 21…)
  const local = digits.startsWith('0') ? digits.slice(1) : digits

  // If user already typed the country code digits (e.g. 6421… for NZ)
  const codeDigits = countryCode.replace('+', '')
  if (local.startsWith(codeDigits) && local.length > codeDigits.length + 4) {
    return '+' + local
  }

  return countryCode + local
}

interface Props {
  onBack: () => void
}

export default function Contacts({ onBack }: Props) {
  const { contacts, add, remove } = useContacts()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('+64')
  const [error, setError] = useState('')

  function handleAdd() {
    setError('')
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number are required')
      return
    }
    const e164 = normalizePhone(phone, country)
    if (!e164 || !/^\+\d{7,15}$/.test(e164)) {
      setError('Enter a valid phone number e.g. 021 123 456')
      return
    }
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
          <div className="phone-row">
            <select
              className="country-select"
              value={country}
              onChange={e => setCountry(e.target.value)}
              aria-label="Country code"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              className="phone-input"
              type="tel"
              placeholder="021 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="add-btn" onClick={handleAdd}>Add</button>
        </div>
      ) : (
        <p className="max-notice">Maximum 5 contacts reached</p>
      )}
    </div>
  )
}
