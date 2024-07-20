import useSWR from 'swr'
const logo = new URL('../assets/logo-banner.webp', import.meta.url)

import getBannersFromCMS from '../utils/getBannersFromCMS'

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
    display: 'flex',
    flexDirection: 'column',
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
      </div>
      <a
        href="./#/jobs"
        style={{
          backgroundColor: 'rgb(255, 207, 98)',
          display: 'block',
          marginTop: 'auto',
        }}
      >
        <h4
          style={{
            fontWeight: 800,
            paddingTop: '20px',
            paddingBottom: '20px',
            display: 'block',
            margin: 0,
          }}
        >
          Join Our Team!
        </h4>
      </a>
    </div>
  )
}

export default Banner
