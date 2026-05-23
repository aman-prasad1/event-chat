import { React, lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import { themeStore } from './store/themeStore'
import { userStore } from './store/userStore'


// Lazy load the component
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Home = lazy(() => import('./pages/Home'))


// Route guard: redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user } = userStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const { initTheme } = themeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="min-h-screen font-sans">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          </Routes>
        </div>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
