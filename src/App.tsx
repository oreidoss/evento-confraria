import { Routes, Route } from 'react-router-dom'
import EventHistory from './pages/EventHistory'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<EventHistory />} />
      <Route path="/event-details/:id" element={<EventDetails />} />
      <Route path="/criar-evento" element={<CreateEvent />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
