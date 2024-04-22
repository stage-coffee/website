import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './Home.js'
import Events from './Events.js'

const App = () => {
  return (
    <main>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<Home />}></Route>
          <Route exact path="/events" element={<Events />}></Route>
        </Routes>
      </BrowserRouter>
    </main>
  )
}

export default App
