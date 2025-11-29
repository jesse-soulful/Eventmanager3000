import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ModulePage } from './pages/ModulePage';
import { ArtistsPage } from './pages/ArtistsPage';
import { FinanceBoardPage } from './pages/FinanceBoardPage';
import { ManageMetadataPage } from './pages/ManageMetadataPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/artists" element={<ArtistsPage />} />
        <Route path="/events/:eventId/:moduleType" element={<ModulePage />} />
        <Route path="/events/:eventId/finance" element={<FinanceBoardPage />} />
        <Route path="/events/:eventId/manage-metadata" element={<ManageMetadataPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

