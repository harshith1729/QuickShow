import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const AdminNavbar = () => {
  return (
    <div className="p-4 border-b border-gray-300/20">
      <h1>
        <Link to="/">
          <img src={assets.logo} alt="logo" className="w-36 h-auto" />
        </Link>
      </h1>
    </div>
  );
};

export default AdminNavbar;
