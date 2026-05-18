import {React, lazy, Suspense} from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'


// Lazy load the component
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Home = lazy(() => import('./pages/Home'))


const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="min-h-screen font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
