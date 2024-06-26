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
    <section className="contain" style={{ paddingBottom: '3rem' }}>
      <article>
        <h3>Contact</h3>
        {documentToReactComponents(contactFormText)}
        {contactFormState === 'success' ? (
          <>
            <p style={{ fontWeight: 'bold' }}>
              Thank you, we will be in touch.
            </p>
            <button
              type="submit"
              onClick={() => {
                setContactFormState('')
              }}
            >
              Send another message
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <label>
              Your email:
              <input
                type="email"
                name="email"
                ref={emailRef}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              Your message:
              <textarea
                name="message"
                ref={messageRef}
                style={{ width: '100%' }}
              />
            </label>
            <button type="submit">Send</button>
          </form>
        )}
      </article>
    </section>
  )
}

export default ContactForm
