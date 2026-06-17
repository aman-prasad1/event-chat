import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { themeStore } from './store/themeStore'
import { useAuth } from './hooks/useAuth'
import { socket } from './lib/socket'
import { chatStore } from './store/chatStore'
import TopLoader from './components/common/TopLoader'

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
    return <TopLoader />;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { initTheme } = themeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);


  // Socket.IO connection handling — subscribe once, read fresh state each time
  useEffect(() => {
    socket.on('message_received', (data) => {
      const { selectedConversation, addMessage, setLatestMessage, incrementUnreadCount } = chatStore.getState();

      // If the conversation is already open, emit seen directly (skip delivered)
      if (selectedConversation && data.message.conversationId === selectedConversation.conversationId) {
        addMessage(data.message);
        socket.emit('message_seen', { messageId: data.message.id });
      } else {
        // Only emit delivered when the conversation is not currently open
        socket.emit('message_delivered', { messageId: data.message?.id });
        incrementUnreadCount(data.message.conversationId, data.message.id);
      }
      setLatestMessage(data.message.conversationId, data.message);
    });

    socket.on('message_sent', (data) => {
      const { handleMessageSent } = chatStore.getState();
      handleMessageSent(data.message);
    });

    socket.on('message_delivered_update', (data) => {
      const { updateMessageStatus } = chatStore.getState();
      console.log(data);
      updateMessageStatus(data.messageId, 'delivered', data.userId);
    });

    socket.on('message_seen_update', (data) => {
      const { updateMessageStatus } = chatStore.getState();
      updateMessageStatus(data.messageId, 'seen', data.userId);
    });

    return () => {
      socket.off('message_received');
      socket.off('message_sent');
      socket.off('message_delivered_update');
      socket.off('message_seen_update');
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<TopLoader />}>
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
