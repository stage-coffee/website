import { useRef, useState, type SyntheticEvent } from 'react'
import type { Document } from '@contentful/rich-text-types'
import RichText from './RichText'

type Props = { introduction: Document | null }

const MINIMUM_COMPLETION_TIME = 1500
const FORM_TARGET = 'contact-submission'
const FORM_ACTION = [
  'https://docs.google.com/forms/u/0/d/e/',
  '1FAIpQLSfUzGCTB30YAsQ0_w__WTjZqwNIUVDfVghA7W1cLu1OExAWww',
  '/formResponse',
].join('')

const submitToGoogle = (email: string, message: string) => {
  const submission = document.createElement('form')
  submission.action = FORM_ACTION
  submission.method = 'post'
  submission.target = FORM_TARGET
  submission.hidden = true

  const fields = [
    ['entry.723671154', email],
    ['entry.838743048', message],
  ]
  fields.forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    submission.append(input)
  })

  document.body.append(submission)
  submission.submit()
  window.setTimeout(() => submission.remove(), 1000)
}

export default function ContactForm({ introduction }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const startedAt = useRef(Date.now())

  const handleSubmit = (
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>
  ) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    if (String(data.get('companyWebsite') || '').trim()) {
      setSubmitted(true)
      return
    }

    if (Date.now() - startedAt.current < MINIMUM_COMPLETION_TIME) {
      setError('Please wait a moment, then try sending your message again.')
      return
    }

    setError('')
    submitToGoogle(
      String(data.get('email') || ''),
      String(data.get('message') || '')
    )
    setSubmitted(true)
  }

  const resetForm = () => {
    startedAt.current = Date.now()
    setError('')
    setSubmitted(false)
  }

  return (
    <section className="contact-section" id="contact">
      <div className="contact-card section-shell">
        <div className="contact-copy">
          <h2>Get in touch</h2>
          <RichText document={introduction} />
        </div>

        {submitted ? (
          <div className="contact-success" role="status">
            <h3>Thanks for getting in touch.</h3>
            <p>We’ll get back to you as soon as we can.</p>
            <button className="button button-secondary" onClick={resetForm}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-extra-field" aria-hidden="true">
              <label htmlFor="contact-company-website">Company website</label>
              <input
                id="contact-company-website"
                type="text"
                name="companyWebsite"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <label htmlFor="contact-email">
              Your email
              <input
                id="contact-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label htmlFor="contact-message">
              Your message
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                placeholder="How can we help?"
                required
              />
            </label>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="button">
              Send
            </button>
          </form>
        )}
        <iframe name={FORM_TARGET} title="Contact form submission" hidden />
      </div>
    </section>
  )
}
