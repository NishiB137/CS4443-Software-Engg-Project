import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LandingPage }        from './modules/eventDiscovery/pages/LandingPage';
import { EventPage }          from './modules/eventDiscovery/pages/EventPage';
import { CreateEventPage }    from './modules/eventCreation/pages/CreateEventPage';
import { TemplateListPage }   from './modules/templateManagement/pages/TemplateListPage';
import { TemplateCreatePage } from './modules/templateManagement/pages/TemplateCreatePage';
import { TemplateEditPage }   from './modules/templateManagement/pages/TemplateEditPage';
import { TemplateViewPage }   from './modules/templateManagement/pages/TemplateViewPage';
import { OrganizerLayout }    from './shared/components/OrganizerLayout';
import { OrganizerEventsPage } from './modules/eventManagement/pages/OrganizerEventsPage';
import { OrganizerEventDetailsPage } from './modules/eventManagement/pages/OrganizerEventDetailsPage';
import { AttendeeLayout } from './shared/components/AttendeeLayout';
import { AttendeeBookmarksPage } from './modules/eventDiscovery/pages/AttendeeBookmarksPage';
import { AttendeeBookingsPage } from './modules/eventDiscovery/pages/AttendeeBookingsPage';
import { AttendeeTicketsPage } from './modules/eventDiscovery/pages/AttendeeTicketsPage';
import { GlobalError } from './shared/components/GlobalError';
import { AdminReviewPage } from './modules/eventManagement/pages/AdminReviewPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const uname = localStorage.getItem('username');
  const uid = localStorage.getItem('userId');
  const isCorrupted = (!uname || uname === 'undefined' || !uid || uid === 'undefined');
  
  if (!isLoggedIn || isCorrupted) {
    if (isCorrupted) {
      ['isLoggedIn', 'userId', 'username', 'userEmail', 'userName', 'userRole'].forEach(k => localStorage.removeItem(k));
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AttendeeLayout />,
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'event', element: <EventPage /> },
      { path: 'attendee/bookmarks', element: <AttendeeBookmarksPage /> },
      { path: 'attendee/bookings', element: <AttendeeBookingsPage /> },
      { path: 'attendee/tickets', element: <AttendeeTicketsPage /> },
      { path: 'attendee', element: <Navigate to="/" replace /> }
    ]
  },
  
  { 
    path: '/create-event', 
    element: (
      <ProtectedRoute>
        <CreateEventPage />
      </ProtectedRoute>
    ),
    errorElement: <GlobalError />,
  },
  
  {
    path: '/organizer',
    element: (
      <ProtectedRoute>
        <OrganizerLayout />
      </ProtectedRoute>
    ),
    errorElement: <GlobalError />,
    children: [
      { index: true, element: <Navigate to="events" replace /> },
      { path: 'events', element: <OrganizerEventsPage /> },
      { path: 'events/:id/details', element: <OrganizerEventDetailsPage /> },
      { path: 'templates', element: <TemplateListPage /> }
    ]
  },

  { path: '/templates/new', element: <ProtectedRoute><TemplateCreatePage /></ProtectedRoute>, errorElement: <GlobalError /> },
  { path: '/templates/:id/edit', element: <ProtectedRoute><TemplateEditPage /></ProtectedRoute>, errorElement: <GlobalError /> },
  { path: '/templates/:id', element: <ProtectedRoute><TemplateViewPage /></ProtectedRoute>, errorElement: <GlobalError /> },

  { path: '/templates', element: <Navigate to="/organizer/templates" replace /> },

  { path: '/admin/review', element: <ProtectedRoute><AdminReviewPage /></ProtectedRoute>, errorElement: <GlobalError /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;