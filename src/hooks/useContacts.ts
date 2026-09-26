import { useState, useEffect } from 'react'
import type { Contact } from '../types'

const KEY = 'mywell.contacts'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(contacts))
  }, [contacts])

  function add(contact: Omit<Contact, 'id'>) {
    if (contacts.length >= 5) return
    setContacts(prev => [...prev, { ...contact, id: crypto.randomUUID() }])
  }

  function remove(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return { contacts, add, remove }
}
