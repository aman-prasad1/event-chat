import React from "react";
import { RiChat3Line } from "react-icons/ri";
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
