const logo = new URL('./assets/logo-banner.webp', import.meta.url)
const room = new URL('./assets/stageupstairs.jpg', import.meta.url)

const backgroundImageStyle = {
  backgroundImage: `url('${room}')`,
}

const Banner = () => (
  <div className="banner-img" style={{ ...backgroundImageStyle }}>
    <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', width: '100%' }}>
      <img
        src={logo}
        alt="Stage Logo"
        style={{
          display: 'inline-block',
          paddingTop: '20px',
          paddingBottom: '20px',
          width: '200px',
        }}
      />
    </div>
  </div>
)

export default Banner
