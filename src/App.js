import { HashRouter, Routes, Route } from 'react-router-dom'

import Home from './Home.js'
import Events from './Events.js'

const App = () => {
  return (
    <main>
      <HashRouter>
        <Routes>
          <Route exact path="/" element={<Home />}></Route>
          <Route exact path="/events" element={<Events />}></Route>
        </Routes>
      </HashRouter>
    </main>
  )
}

export default App
