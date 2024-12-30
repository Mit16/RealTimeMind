import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  console.log(location.state);
  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full min-w-80 bg-slate-300">
        <header className="flex justify-end p-2 px-4 w-full bg-slate-500">
          <button className="p-2 ">
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area flex-grow flex flex-col">
          <div className="message-box flex-grow flex flex-col gap-1.5 p-1">
            <div className="incoming-message max-w-60 flex flex-col p-2 bg-slate-400 w-fit rounded-lg">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="text-sm">
                {" "}
                Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.
              </p>
            </div>
            <div className="outgoing-message ml-auto max-w-60 flex flex-col p-2 bg-slate-400 w-fit rounded-lg">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="text-sm">
                {" "}
                Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>
          <div className="inputField flex w-full ">
            <input
              className="p-2 px-4 border-none outline-none rounded-md"
              type="text"
              name="messageBox"
              id="messageBox"
              placeholder="Enter message"
            />
            <button className="px-3">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        <div className="sidePanel w-36 h-60 bg-red-600 absolute left-[-100%] top-0"></div>
      </section>
    </main>
  );
};

export default Project;
