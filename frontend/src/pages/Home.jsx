import React from "react";
import { userStore } from "../store/userStore";

const Home = () => {
  const { user } = userStore();

  return (
    <div>
        Welcome {`${user ? user.username : "Guest"}`}
    </div>
  )
};

export default Home;
