import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import useData from './hooks/useData';
import Today from './pages/Today';
import Overview from './pages/Overview';
import Fitness from './pages/Fitness';
import Vault from './pages/Vault';
import Spotify from './pages/Spotify';
import Memory from './pages/Memory';
import Agents from './pages/Agents';
import Intel from './pages/Intel';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import Repo from './pages/Repo';

export default function App() {
  const { data, loading } = useData();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="mono" style={{ fontSize: 11, color: 'var(--mut)', letterSpacing: '1.4px', textTransform: 'uppercase' }}>
          loading karma-os
        </div>
      </div>
    );
  }

  return (
    <Layout data={data}>
      <Routes>
        <Route path="/" element={<Today data={data} />} />
        <Route path="/overview" element={<Overview data={data} />} />
        <Route path="/fitness" element={<Fitness data={data} />} />
        <Route path="/vault" element={<Vault data={data} />} />
        <Route path="/spotify" element={<Spotify data={data} />} />
        <Route path="/memory" element={<Memory data={data} />} />
        <Route path="/agents" element={<Agents data={data} />} />
        <Route path="/intel" element={<Intel data={data} />} />
        <Route path="/tasks" element={<Tasks data={data} />} />
        <Route path="/analytics" element={<Analytics data={data} />} />
        <Route path="/repo" element={<Repo data={data} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
