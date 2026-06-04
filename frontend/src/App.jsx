import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { themeStore } from './store/themeStore'
import { useAuth } from './hooks/useAuth'
import { socket } from './socketIo'
import { chatStore } from './store/chatStore'

// Lazy load the component
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Home = lazy(() => import('./pages/Home'))


// Route guard: verifies session via API before rendering children
const ProtectedRoute = ({ children }) => {
  const { getUser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // If user already in store, still verify with backend
    const verifyAuth = async () => {
      try {
        await getUser();
        setIsAuthed(true);
      } catch {
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, []);

  if (isChecking) {
    return <div className="auth-loading">Verifying session...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { initTheme } = themeStore();
  const { addMessage, selectedConversation, setLatestMessage, incrementUnreadCount } = chatStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);


  // Socket.IO connection handling
  useEffect(() => {
    socket.on('message_received', (data) => {
      socket.emit('message_delivered', { messageId: data.message?.id });

      // add message to store if belongs to the currently selected conversation
      if(selectedConversation && data.message.conversationId === selectedConversation.conversationId) {
        addMessage(data.message);
        socket.emit('message_seen', { messageId: data.message.id });
      }
      else {
        incrementUnreadCount(data.message.conversationId, data.message.id);
      }
      setLatestMessage(data.message.conversationId, data.message);
    });

    return () => {
        socket.off('message_received');
    };
  }, [selectedConversation]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="min-h-screen font-sans">
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
