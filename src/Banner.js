const logo = new URL('./assets/logo-banner.webp', import.meta.url)
const room = new URL('./assets/stageupstairs.jpg', import.meta.url)
const roomDown = new URL('./assets/stageroom.jpg', import.meta.url)

import styled, { keyframes } from 'styled-components'
import { useState, useEffect } from 'react'

const changeBg = keyframes`
  0%,100%  {
    background-image: url(${room});
    background-position: center;
  }

  24.9999% {
    background-image: url(${room});
  }

  25% {
    background-image: url(${roomDown});
    background-position: bottom right;
  }


  50% {
    background-image: url(${roomDown});
    background-position: center;
  }

  74.9999% {
    background-image: url(${roomDown});
  }
  75% {
    background-image: url(${room});
    background-position: top left;
  }
`

const BackgroundImageDiv = styled.div`
  background: black;
  background-image: url(${room});
  animation-name: ${changeBg};
  animation-duration: 40s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  background-size: cover;
`

const Banner = () => {
  const [effectState, setEffectState] = useState(false)

  useEffect(() => {
    if (!effectState) {
      setEffectState(true)
      var img = new Image()
      img.src = roomDown.href
      img.style = 'width: 1px; height: 1px;'
      img.className = 'hide'
      img.onload = function () {
        document.body.appendChild(img)

        setTimeout(() => {
          const imagesToHide = document.getElementsByClassName('hide')

          for (let item of imagesToHide) {
            item.style = 'display: none'
          }
        }, 100)
      }
    }
  }, [])

  return (
    <BackgroundImageDiv className="banner-img">
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
        <img
          src={logo}
          alt="Stage Logo"
          style={{
            // display: 'inline-block',
            paddingTop: '20px',
            paddingBottom: '20px',
            width: '200px',
          }}
        />
        <div className="nav-menu">
          <span style={{ marginRight: 'auto' }}>
            <a href="./#/">Home</a>
            <a href="./#/events">Events</a>
          </span>
        </div>
      </div>
    </BackgroundImageDiv>
  )
}

export default Banner
