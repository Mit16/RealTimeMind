import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Login from "../src/screens/login";
import Register from "../src/screens/Register";
import Home from "../src/screens/Home";
import Project from "../src/screens/Project";
import UserAuth from "../src/auth/UserAuth";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <UserAuth>
              <Home />
            </UserAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/project"
          element={
            <UserAuth>
              <Project />
            </UserAuth>
          }
        />
        <Route path="*" element={<h1>404 : Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
