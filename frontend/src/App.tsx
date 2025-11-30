import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ModulePage } from './pages/ModulePage';
import { GlobalModulePage } from './pages/GlobalModulePage';
import { StaffPoolPage } from './pages/StaffPoolPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ProductionPage } from './pages/ProductionPage';
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
          <Route path="/events/:eventId/production" element={<ProductionPage />} />
          <Route path="/events/:eventId/:moduleType" element={<ModulePage />} />
          <Route path="/events/:eventId/finance" element={<FinanceBoardPage />} />
          <Route path="/finance" element={<FinanceBoardPage />} />
          <Route path="/vendors-suppliers" element={<GlobalModulePage />} />
          <Route path="/materials-stock" element={<GlobalModulePage />} />
          <Route path="/staff-pool" element={<StaffPoolPage />} />
          <Route path="/manage-metadata" element={<ManageMetadataPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

