import React, { useRef, useState } from 'react'
import axios from 'axios'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

const ContactForm = ({ contactFormText }) => {
  const [contactFormState, setContactFormState] = useState('')
  const emailRef = useRef(null)
  const messageRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const email = emailRef.current.value
    const message = messageRef.current.value

    try {
      await axios({
        url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfUzGCTB30YAsQ0_w__WTjZqwNIUVDfVghA7W1cLu1OExAWww/formResponse',
        method: 'post',
        headers: {
          Accept: 'application/x-www-form-urlencoded',
          'Content-Type': 'application/x-www-form-urlencoded',
          //   Origin: 'https://docs.google.com',
        },
        data:
          `entry.723671154=${encodeURIComponent(email)}` +
          `&entry.838743048=${encodeURIComponent(message)}`,
      })
    } catch (error) {
      console.log(error)
    } finally {
      setContactFormState('success')
    }
  }

  return (
    <section className="contain contact-section">
      <article className="contact-card">
        <h3>Contact</h3>
        {documentToReactComponents(contactFormText)}
        {contactFormState === 'success' ? (
          <div className="contact-success" role="status">
            <p>
              Thank you, we will be in touch.
            </p>
            <button
              type="button"
              onClick={() => {
                setContactFormState('')
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <label htmlFor="contact-email">
              Your email
              <input
                id="contact-email"
                type="email"
                name="email"
                ref={emailRef}
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
                ref={messageRef}
                rows="6"
                placeholder="How can we help?"
                required
              />
            </label>
            <button type="submit" className="contact-submit">
              Send message
            </button>
          </form>
        )}
      </article>
    </section>
  )
}

export default ContactForm
