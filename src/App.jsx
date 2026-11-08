import { Routes, Route, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import AppShell from './components/AppShell';
import Toaster from './components/Toaster';
import EmptyState from './components/EmptyState';
import RequireAuth from './components/RequireAuth';
import Landing from './pages/Landing';
import { Login, Signup } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Library from './pages/Library';
import Editor from './pages/Editor';
import RiskRegister from './pages/RiskRegister';
import Acknowledgements from './pages/Acknowledgements';
import Settings from './pages/Settings';

function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState icon={Compass} title="This page took a wrong turn"
        message="We couldn't find what you were looking for. Let's get you back on course."
        action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/library" element={<Library />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/risks" element={<RiskRegister />} />
          <Route path="/acknowledgements" element={<Acknowledgements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
