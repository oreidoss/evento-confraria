import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import SelectParticipants from "./pages/SelectParticipants";
import EventHistory from "./pages/EventHistory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/criar-evento" element={<CreateEvent />} />
      <Route path="/evento/:id" element={<EventDetails />} />
      <Route
        path="/selecionar-participantes/:id"
        element={<SelectParticipants />}
      />
      <Route path="/historico" element={<EventHistory />} />
      <Route path="*" element={<Index />} /> {/* Rota padrão para 404 */}
    </Routes>
  );
}

export default App;
