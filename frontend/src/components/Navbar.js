import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPlusCircle, FiLogOut, FiShoppingBag } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <FiShoppingBag /> CampusSwap
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/create" className="btn-create">
              <FiPlusCircle /> Sell Item
            </Link>
            <span className="user-name">Hi, {user.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="btn-logout">
              <FiLogOut /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-auth">Login</Link>
            <Link to="/register" className="btn-auth btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
