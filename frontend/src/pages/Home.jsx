import React, { useState } from "react";
import { RiChat3Line } from "react-icons/ri";
import { userStore } from "../store/userStore";
import { chatStore } from "../store/chatStore";
import Sidebar from "../components/Sidebar";
import RecentChatsSideBar from "../components/RecentChatsSideBar";
import UserSearchPanel from "../components/UserSearchPanel";
import ChatBox from "../components/ChatBox";

const Home = () => {
  const { user } = userStore();
  const { selectedConversation } = chatStore();
  const [showUserSearch, setShowUserSearch] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Icon sidebar - hidden on mobile/tablet */}
      <div className="max-lg:hidden h-full">
        <Sidebar
          showUserSearch={showUserSearch}
          onToggleUserSearch={() => setShowUserSearch((prev) => !prev)}
        />
      </div>

      {/* Recent chats or User search panel */}
      <div className={`max-lg:flex-1 ${selectedConversation ? "max-lg:hidden" : ""}`}>
        {showUserSearch ? (
          <UserSearchPanel onClose={() => setShowUserSearch(false)} />
        ) : (
          <RecentChatsSideBar onNewChat={() => setShowUserSearch(true)} />
        )}
      </div>

      {/* Chat area - on mobile/tablet, takes full width when conversation selected */}
      {selectedConversation ? (
        <ChatBox />
      ) : (
        <main
          className="flex-1 flex items-center justify-center max-lg:hidden transition-colors duration-300"
          style={{ backgroundColor: 'var(--color-chatbox-bg, var(--color-primary))' }}
        >
          <div className="text-center p-8">
            <RiChat3Line size={60} className="block mb-4 mx-auto opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
            <h2
              className="text-[22px] font-bold m-0 mb-2 tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome, {user?.first_name || user?.username || "Guest"}
            </h2>
            <p className="text-sm m-0" style={{ color: 'var(--color-text-secondary)' }}>
              Select a conversation to start chatting
            </p>
          </div>
        </main>
      )}
    </div>
  );
};

export default Home;
