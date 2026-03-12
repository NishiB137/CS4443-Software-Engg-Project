import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage }        from './modules/eventDiscovery/pages/LandingPage';
import { EventPage }          from './modules/eventDiscovery/pages/EventPage';
import { CreateEventPage }    from './modules/eventCreation/pages/CreateEventPage';
import { TemplateListPage }   from './modules/templateManagement/pages/TemplateListPage';
import { TemplateCreatePage } from './modules/templateManagement/pages/TemplateCreatePage';
import { TemplateEditPage }   from './modules/templateManagement/pages/TemplateEditPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<LandingPage />} />
        <Route path="/event"              element={<EventPage />} />
        <Route path="/create-event"       element={<CreateEventPage />} />
        {/* ── Template management ── */}
        <Route path="/templates"          element={<TemplateListPage />} />
        <Route path="/templates/new"      element={<TemplateCreatePage />} />
        <Route path="/templates/:id/edit" element={<TemplateEditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;