import React from "react";
import { userStore } from "../store/userStore";
import { chatStore } from "../store/chatStore";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";

const Home = () => {
  const { user } = userStore();
  const { selectedConversation } = chatStore();

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden">
      <Sidebar />
      {selectedConversation ? (
        <ChatBox />
      ) : (
        <main
          className="flex-1 flex items-center justify-center max-md:hidden transition-colors duration-300"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <div className="text-center p-8">
            <span className="text-6xl block mb-4 opacity-40">💬</span>
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
