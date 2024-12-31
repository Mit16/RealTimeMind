import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";

const UserAuth = ({ children }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) {
      setLoading(false);
    }

    if (!token) {
      navigate("/login");
    }

    if (!user) {
      navigate("/login");
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  return <>{children}</>;
};

export default UserAuth;
