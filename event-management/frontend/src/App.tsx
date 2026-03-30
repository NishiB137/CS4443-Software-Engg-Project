import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage }        from './modules/eventDiscovery/pages/LandingPage';
import { EventPage }          from './modules/eventDiscovery/pages/EventPage';
import { CreateEventPage }    from './modules/eventCreation/pages/CreateEventPage';
import { TemplateListPage }   from './modules/templateManagement/pages/TemplateListPage';
import { TemplateCreatePage } from './modules/templateManagement/pages/TemplateCreatePage';
import { TemplateEditPage }   from './modules/templateManagement/pages/TemplateEditPage';
import { TemplateViewPage }   from './modules/templateManagement/pages/TemplateViewPage';
import { OrganizerLayout }    from './shared/components/OrganizerLayout';
import { OrganizerEventsPage } from './modules/eventManagement/pages/OrganizerEventsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<LandingPage />} />
        <Route path="/event"              element={<EventPage />} />
        <Route path="/create-event"       element={<CreateEventPage />} />
        
        {/* ── Organizer Layout ── */}
        <Route path="/organizer" element={<OrganizerLayout />}>
          <Route index element={<Navigate to="events" replace />} />
          <Route path="events" element={<OrganizerEventsPage />} />
          <Route path="templates" element={<TemplateListPage />} />
        </Route>

        {/* ── Template Details (outside sidebar layout context) ── */}
        <Route path="/templates/new"      element={<TemplateCreatePage />} />
        <Route path="/templates/:id/edit" element={<TemplateEditPage />} />
        <Route path="/templates/:id"      element={<TemplateViewPage />} />
        
        {/* Handle legacy /templates route */}
        <Route path="/templates" element={<Navigate to="/organizer/templates" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;