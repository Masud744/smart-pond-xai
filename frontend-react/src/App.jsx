import { Routes, Route } from 'react-router-dom';
import Layout          from './components/Layout';
import Dashboard       from './pages/Dashboard';
import Analytics       from './pages/Analytics';
import XAIPredictions  from './pages/XAIPredictions';
import FishFeeding     from './pages/FishFeeding';
import AlertsLogs      from './pages/AlertsLogs';
import DatabaseExplorer from './pages/DatabaseExplorer';
import Settings        from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                      element={<Dashboard />}        />
        <Route path="/analytics"             element={<Analytics />}         />
        <Route path="/xai-predictions"       element={<XAIPredictions />}    />
        <Route path="/fish-feeding"          element={<FishFeeding />}       />
        <Route path="/alerts"                element={<AlertsLogs />}        />
        <Route path="/database"              element={<DatabaseExplorer />}  />
        <Route path="/settings"              element={<Settings />}          />
      </Routes>
    </Layout>
  );
}
