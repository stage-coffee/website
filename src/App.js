import { Switch, Route } from 'react-router-dom'
import Home from './Home'
import Events from './Events'

const App = () => {
  return (
    <main>
      <Switch>
        <Route exact path="/" component={Home}></Route>
        <Route exact path="/events" component={Events}></Route>
      </Switch>
    </main>
  )
}

export default App
