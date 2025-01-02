import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css"; // Choose a style you like

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // New state for messages
  const { user } = useContext(UserContext);
  const messageBox = useRef();
  const [fileTree, setFileTree] = useState({});
  const [currentOpenFile, setCurrentOpenFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  useEffect(() => {
    initializeSocket(project._id);
    console.log("Room ID frontend:", project._id);
    receiveMessage("project-message", (data) => {
      console.log("received ", data);
      try {
        let parsedMessage;

        if (typeof data.message === "string") {
          // Check if the string is valid JSON
          try {
            parsedMessage = JSON.parse(data.message);
          } catch (jsonError) {
            // If parsing fails, treat it as a plain string
            // console.log("JSON Error :", jsonError);
            parsedMessage = data.message;
          }
        } else {
          parsedMessage = data.message;
        }

        if (parsedMessage.fileTree) {
          setFileTree(parsedMessage.fileTree);
        }

        // Avoid appending if the sender is the current user
        if (data.sender._id !== user._id) {
          appendIncomingMessage({ ...data, message: parsedMessage });
        }
      } catch (error) {
        console.error("Error parsing message:", { rawMessage: data, error });
      }
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

  useEffect(() => {
    if (currentOpenFile && fileTree[currentOpenFile]) {
      const codeElement = document.querySelector(".hljs");
      if (codeElement) {
        hljs.highlightElement(codeElement);
      }
    }
  }, [currentOpenFile, fileTree]);

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

  const writeAiMessage = (message) => {
    try {
      // Parse the message if it's a string
      const messageObject =
        typeof message === "string" ? JSON.parse(message) : message;
      console.log(messageObject);
      // Safely access properties and render Markdown
      return (
        <div className="overflow-auto bg-[#282c34] text-white rounded-lg p-2">
          <Markdown>
            {messageObject.text ||
              messageObject.message ||
              messageObject.response ||
              "Invalid message format"}
          </Markdown>
        </div>
      );
    } catch (error) {
      console.error("Error processing AI message:", message, error);
      return (
        <div className="overflow-auto bg-red-500 text-white rounded-sm p-2">
          <p>Error: Unable to process the message</p>
        </div>
      );
    }
  };

  const sendMessagefromUser = () => {
    console.log("user :", user);
    const outgoingMessage = { message, sender: user };
    console.log("Sending message:", outgoingMessage);
    sendMessage("project-message", outgoingMessage); // Sends message
    appendOutGoingMessage(outgoingMessage); // Updates UI
    setMessage(""); // Clears input
  };

  const scrollToBottom = () => {
    const messageBoxx = messageBox.current;
    if (messageBoxx) {
      messageBoxx.scrollTop = messageBoxx.scrollHeight;
    }
  };

  const appendIncomingMessage = (messageObject) => {
    setMessages((prev) => [...prev, messageObject]);
    scrollToBottom();
  };

  const appendOutGoingMessage = (messageObject) => {
    setMessages((prev) => [...prev, messageObject]);
    scrollToBottom();
  };

  return (
    <main className="flex h-screen w-screen bg-gray-100">
      <section className="w-1/4 bg-slate-300 flex flex-col h-full relative">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-500 absolute top-0 z-10 shadow-md ">
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

        <div className="conversation-area flex-grow overflow-hidden flex flex-col">
          <div
            ref={messageBox}
            className="message-box flex-grow overflow-y-auto p-4 pt-16 space-y-3 scrollbar-thin scrollbar-thumb-blue-300"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message  flex flex-col p-2 w-fit rounded-lg ${
                  msg.sender._id === user._id
                    ? "ml-auto bg-slate-200"
                    : "bg-slate-100"
                } ${msg.sender._id === "ai" ? "max-w-[90%]" : "max-w-[75%]"}`}
              >
                <small className="opacity-65 text-xs">{msg.sender.email}</small>
                <p className="text-sm">
                  {msg.sender._id === "ai"
                    ? writeAiMessage(msg.message)
                    : msg.message}
                </p>
              </div>
            ))}
          </div>

          <div className="inputField flex items-center p-4">
            <input
              className="flex-grow p-2 rounded-l-lg focus:outline-none"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              name="messageBox"
              id="messageBox"
              placeholder="Enter message"
            />
            <button
              onClick={sendMessagefromUser}
              className="p-3 text-white rounded-r-lg bg-slate-600 hover:bg-slate-400"
            >
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

      <section className="right bg-slate-400 flex-grow h-full flex">
        <div className="explorer h-full max-w-xs min-w-44 bg-gray-500 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold pb-4 ">File Explorer</h2>
          <div className="file-tree w-full space-y-2">
            {Object.keys(fileTree).map((file, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentOpenFile(file);
                  setOpenFiles((prev) => [...new Set([...prev, file])]);
                }}
                className="tree-element p-2 flex justify-between items-center w-full bg-gray-400 hover:bg-gray-300 text-left rounded-md"
              >
                <p className="cursor-pointer font-semibold text-lg w-full truncate">
                  {file}
                </p>
              </button>
            ))}
          </div>
        </div>
        {currentOpenFile && (
          <div className="code-edit flex flex-col h-full w-full ">
            <div className="top flex space-x-2">
              {openFiles.map((file, index) => (
                <div
                  key={index}
                  className={`code-editor-header cursor-pointer flex justify-between items-center px-4 py-2 ${
                    file === currentOpenFile ? "bg-gray-300" : "bg-gray-200"
                  } text-gray-800 rounded-lg shadow-sm`}
                  onClick={() => setCurrentOpenFile(file)} // Update the current open file
                >
                  <h1 className="font-semibold text-lg truncate">{file}</h1>
                  <button
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent div's click event
                      setOpenFiles((prev) =>
                        prev.filter((openFile) => openFile !== file)
                      );
                      if (currentOpenFile === file) {
                        setCurrentOpenFile(null);
                      }
                    }}
                  >
                    <i className="ri-close-fill text-xl"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
              {currentOpenFile && fileTree[currentOpenFile] && (
                <div className="code-editor-area flex-grow relative bg-[#282c34]">
                  <div
                    // className="overflow-auto h-full"
                    style={{
                      whiteSpace: "pre-wrap",
                      counterSet: "line-numbering",
                    }}
                  >
                    <pre
                      className="hljs h-full outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedContent = e.target.innerText; // Extract text content
                        setFileTree((prevTree) => ({
                          ...prevTree,
                          [currentOpenFile]: updatedContent,
                        }));
                      }}
                      dangerouslySetInnerHTML={{
                        __html: hljs.highlight(
                          fileTree[currentOpenFile] || "",
                          { language: "javascript" } // Specify the language for highlighting
                        ).value,
                      }}
                    ></pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
