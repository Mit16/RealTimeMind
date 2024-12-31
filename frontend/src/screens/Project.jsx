import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = React.createRef();

  useEffect(() => {
    initializeSocket(project._id);

    receiveMessage("project-message", (data) => {
      console.log(data);
      appendIncomingMessage(data);
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        console.log("project specific data:", res.data.project);
      })
      .catch((err) => {
        console.log(err);
        console.log(err.data);
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleUserClick = (userId) => {
    setSelectedUserId(
      (prev) =>
        prev.includes(userId)
          ? prev.filter((_id) => _id !== userId) // Deselect if already selected
          : [...prev, userId] // Add to selected if not already selected
    );
  };

  const addCollaborators = () => {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: selectedUserId,
      })
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
        setSelectedUserId([]);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const sendMessagefromUser = () => {
    sendMessage("project-message", {
      message,
      sender: user,
    });
    appendOutGoingMessage(message);
    setMessage("");
  };

  const appendIncomingMessage = (messageObject) => {
    const messageBox = document.querySelector(".message-box");
    const message = document.createElement("div");
    message.classList.add(
      "message",
      "max-w-56",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate",
      "bg-slate-400",
      "w-fit",
      "rounded-lg"
    );
    message.innerHTML = `<small className='opacity-65 text-xs'>${messageObject.sender.email}</small>
    <p className="text-sm">${messageObject.message}</p>
    `;
    messageBox.appendChild(message);
  };

  const appendOutGoingMessage = (message) => {
    const messageBox = document.querySelector(".message-box");
    const newMessage = document.createElement("div");
    newMessage.classList.add(
      "message",
      "ml-auto",
      "max-w-56",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate",
      "bg-slate-400",
      "w-fit",
      "rounded-lg"
    );
    newMessage.innerHTML = `<small className='opacity-65 text-xs'>${user.email}</small>
    <p className="text-sm">${message}</p>
    `;
    messageBox.appendChild(newMessage);
  };

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full min-w-[25%] bg-slate-300">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-500">
          <button className="flex gap-2" onClick={() => setIsModalOpen(true)}>
            <i className="ri-user-add-fill mr-1"></i>
            <p>Add collaborators</p>
          </button>

          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area flex-grow flex flex-col">
          <div
            ref={messageBox}
            className="message-box flex-grow flex flex-col gap-1.5 p-1 overflow-auto max-h-full"
          >

          </div>
          <div className="inputField flex w-full ">
            <input
              className="p-2 px-4 border-none outline-none w-full rounded-md"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              name="messageBox"
              id="messageBox"
              placeholder="Enter message"
            />
            <button onClick={sendMessagefromUser} className="px-4 bg-slate-600">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        <div
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-300 absolute transition-all  ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          } top-0`}
        >
          <header className="flex justify-between items-center px-3 bg-slate-400 ">
            <h1 className="font-semibold text-lg">Collaborators</h1>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-2"
            >
              <i className="ri-close-line"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2">
            {project.users &&
              project.users.map((user) => {
                return (
                  <div
                    key={user._id}
                    className="user cursor-pointer flex gap-2 py-2 items-center hover:bg-slate-200"
                  >
                    <div className="aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-400">
                      <i className="ri-user-fill absolute"></i>
                    </div>
                    <h1 className=" font-semibold text-lg">{user.email}</h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-slate-700 text-white w-96 rounded-lg p-6 shadow-lg">
            <header className="flex justify-between items-center pb-4 border-b border-gray-500">
              <h2 className="text-lg font-semibold">Select Users</h2>
              <button className="text-lg" onClick={() => setIsModalOpen(false)}>
                <i className="ri-close-line"></i>
              </button>
            </header>

            {/* User List with Scroll */}
            <div className="flex flex-col gap-4 mt-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-600">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className={`flex items-center gap-4 p-3 rounded-md transition ${
                    selectedUserId.includes(user._id)
                      ? "bg-green-500 text-white" // Highlight selected users
                      : "bg-slate-600 hover:bg-slate-500"
                  }`}
                >
                  <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center bg-slate-400 text-black">
                    <i className="ri-user-fill"></i>
                  </div>
                  <p className="font-medium">{user.email}</p>
                </button>
              ))}
            </div>

            {/* Footer with Add Collaborators Button */}
            <footer className="flex justify-center mt-6">
              <button
                onClick={addCollaborators}
                className="px-4 py-2 bg-slate-500 hover:bg-slate-400 text-white rounded-md font-semibold"
              >
                Add Collaborators
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
