import useSWR from 'swr'
const logo = new URL('./assets/logo-banner.webp', import.meta.url)

import getBannersFromCMS from './getBannersFromCMS'

import { useState, useEffect } from 'react'

const Banner = () => {
  const { data } = useSWR('banners', getBannersFromCMS, {
    fallbackData: [''],
  })
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [updateImage, setUpdateImage] = useState(true)

  const changeBackgroundImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % data.length)
  }

  useEffect(() => {
    if (updateImage) {
      setUpdateImage(false)
      setTimeout(() => {
        setUpdateImage(true)
      }, 5000)
      changeBackgroundImage()
    }
  }, [updateImage])

  const backgroundImageStyle = {
    background: 'black',
    backgroundImage: `url(${data[currentImageIndex]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  return (
    <div className="banner-img" style={backgroundImageStyle}>
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="nav-spacer">
          <span style={{ marginRight: 'auto' }}></span>
        </div>
        <a
          href="./#/"
          style={{
            // display: 'inline-block',
            paddingTop: '20px',
            paddingBottom: '20px',
            width: '200px',
          }}
        >
          <img src={logo} alt="Stage Logo" />
        </a>
        <div className="nav-menu">
          <span style={{ marginRight: 'auto' }}>
            <a href="./#/">Home</a>
            <a href="./#/events">Events</a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Banner
