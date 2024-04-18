import ContactForm from './ContactForm'

const Footer = ({ contactFormText }) => (
  <footer
    style={{
      backgroundColor: 'rgb(255, 207, 98)',
      paddingBottom: '3rem',
      paddingTop: '1rem',
      marginTop: '1rem',
    }}
  >
    <section className="river center-vert">
      <iframe
        title="stagecoffeeleeds Instagram"
        className="instagram-media instagram-media-rendered"
        id="instagram-embed-1"
        src="https://www.instagram.com/stagecoffeeleeds/embed/?cr=1&amp;v=14&amp;wp=540&amp;rd=https%3A%2F%2Fbehold.so&amp;rp=%2Fguides%2Fhow-to-embed-an-instagram-feed-on-your-website%2F#%7B%22ci%22%3A1%2C%22os%22%3A1123%2C%22ls%22%3A258%2C%22le%22%3A1113%7D"
        allowtransparency="true"
        height="560"
        width="540"
        // data-instgrm-payload-id="instagram-media-payload-1"
        style={{
          background: 'white',
          maxWidth: '100%',
          borderRadius: '0px',
          border: '1px solid rgb(219, 219, 219)',
          boxShadow: 'none',
          // display: block; margin: 0px 0px 12px; min-width: 326px; padding: 0px;"
        }}
      ></iframe>
      <iframe
        title="Stage Google Maps"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2356.3609374552366!2d-1.5534804865731675!3d53.80086087230954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48795c1d7a9eaaab%3A0xcb6995a363333532!2sStage%20Espresso%20%26%20Brewbar!5e0!3m2!1sen!2suk!4v1713285436412!5m2!1sen!2suk"
        height="560"
        width="540"
        style={{ border: 0, maxWidth: '100%' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
    <ContactForm contactFormText={contactFormText} />
  </footer>
)

export default Footer
