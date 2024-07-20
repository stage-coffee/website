import { HashRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home.js'
import Events from './pages/Events.js'
import Jobs from './pages/Jobs.js'

const App = () => {
  return (
    <main>
      <HashRouter>
        <Routes>
          <Route exact path="/" element={<Home />}></Route>
          <Route exact path="/events" element={<Events />}></Route>
          <Route exact path="/jobs" element={<Jobs />}></Route>
        </Routes>
      </HashRouter>
    </main>
  )
}

export default App
