import { Navigate, Route, Routes } from 'react-router';
import { App } from './App';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/tickets" element={<App />} />
      <Route path="/account" element={<App />} />
      <Route path="/verify" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
