import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuestionEntry from './pages/QuestionEntry';
import QuestionBank from './pages/QuestionBank';
import QuestionDetail from './pages/QuestionDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/entry" element={<QuestionEntry />} />
        <Route path="/bank" element={<QuestionBank />} />
        <Route path="/question/:id" element={<QuestionDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
