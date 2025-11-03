import React, { useState, useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { isAuthenticated, setIsAuthenticated } = useContext(AppContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')} className='w-46 cursor-pointer' src={assets.logo} alt="" />
      
      <ul className='hidden md:flex items-start gap-4 font-mono'>
        <NavLink to='/'>HOME</NavLink>
        <NavLink to='/doctors'>ALL DOCTORS</NavLink>
        <NavLink to='/about'>ABOUT</NavLink>
        <NavLink to='/contact'>CONTACT</NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {isAuthenticated ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-10 rounded-full' src={assets.profile_pic} alt="" />
            <img className='w-3' src={assets.dropdown_icon} alt="" />

            <div className='absolute top-0 right-0 pt-20 text-base font-medium text-gray-600 z-50 hidden group-hover:block'>
              <div className='min-w-48 bg-stone-100 rounded flex-col gap-4 p-4'>
                <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Logout</p>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')} 
            className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>
            Create account
          </button>
        )}

        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />
      </div>
    </div>
  );
};

export default Navbar;