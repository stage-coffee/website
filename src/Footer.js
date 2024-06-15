import ContactForm from './ContactForm'

const Footer = ({ contactFormText }) => (
  <footer
    style={{
      backgroundColor: 'rgb(255, 207, 98)',
      paddingTop: '1rem',
      marginTop: '1rem',
    }}
  >
    <section className="river center-vert">
      <iframe
        title="stagecoffeeleeds Instagram"
        className="instagram-media instagram-media-rendered"
        id="instagram-embed-1"
        src="https://www.instagram.com/stagecoffeeleeds/embed"
        allowtransparency="true"
        width="530"
        height="560"
        frameborder="0"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '530px',
          maxHeight: '560px',
          border: '0',
        }}
      ></iframe>
      <iframe
        title="Stage Google Maps"
        className="google-maps"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2356.3609374552366!2d-1.5534804865731675!3d53.80086087230954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48795c1d7a9eaaab%3A0xcb6995a363333532!2sStage%20Espresso%20%26%20Brewbar!5e0!3m2!1sen!2suk!4v1713285436412!5m2!1sen!2suk"
        height="560"
        width="540"
        style={{ border: 0, maxWidth: '100%' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
    <ContactForm contactFormText={contactFormText} />
    <div style={{ width: '100%', backgroundColor: '#3e7692' }}>
      <div
        style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '1280px',
          padding: '0 1rem',
        }}
      >
        <p
          style={{
            display: 'inline-block',
            color: '#fdfdfd',
          }}
        >
          © 2024, Stage Espresso and Brewbar | 41 Great George St, Leeds,
          Yorkshire, LS1 3BB
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
