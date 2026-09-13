import { useState } from 'react'
import type { Document } from '@contentful/rich-text-types'
import RichText from './RichText'

type Props = { introduction: Document | null }

export default function ContactForm({ introduction }: Props) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="contact-section section-shell" id="contact">
      <div className="contact-card">
        <div className="contact-copy">
          <h2>Get in touch</h2>
          <RichText document={introduction} />
        </div>

        {submitted ? (
          <div className="contact-success" role="status">
            <h3>Thanks for getting in touch.</h3>
            <p>We’ll get back to you as soon as we can.</p>
            <button
              className="button button-secondary"
              onClick={() => setSubmitted(false)}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            className="contact-form"
            action="https://docs.google.com/forms/u/0/d/e/1FAIpQLSfUzGCTB30YAsQ0_w__WTjZqwNIUVDfVghA7W1cLu1OExAWww/formResponse"
            method="post"
            target="contact-submission"
            onSubmit={() => window.setTimeout(() => setSubmitted(true), 0)}
          >
            <label htmlFor="contact-email">
              Your email
              <input
                id="contact-email"
                type="email"
                name="entry.723671154"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label htmlFor="contact-message">
              Your message
              <textarea
                id="contact-message"
                name="entry.838743048"
                rows={6}
                placeholder="How can we help?"
                required
              />
            </label>
            <button type="submit" className="button">
              Send
            </button>
          </form>
        )}
        <iframe
          name="contact-submission"
          title="Contact form submission"
          hidden
        />
      </div>
    </section>
  )
}
