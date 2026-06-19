import React, { useState, useContext } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { isAuthenticated, logout, userProfile } = useContext(AppContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileImage = userProfile?.image && userProfile.image !== 'default.jpg'
    ? userProfile.image
    : assets.profile_pic;

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')} className='w-46 cursor-pointer' src={assets.logo} alt="Prescripto Logo" />

      <ul className='hidden md:flex items-start gap-4 font-mono'>
        <NavLink to='/'>HOME</NavLink>
        <NavLink to='/doctors'>ALL DOCTORS</NavLink>
        <NavLink to='/about'>ABOUT</NavLink>
        <NavLink to='/contact'>CONTACT</NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {isAuthenticated ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-10 rounded-full object-cover' src={profileImage} alt="Profile" />
            <img className='w-3' src={assets.dropdown_icon} alt="Dropdown" />

            <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-50 hidden group-hover:block'>
              <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 shadow-md'>
                <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Logout</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'
          >
            Create account
          </button>
        )}

        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="Menu" />
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className='fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-6 text-xl'>
          <img
            onClick={() => setShowMenu(false)}
            className='w-6 absolute top-6 right-6 cursor-pointer'
            src={assets.cross_icon}
            alt="Close"
          />
          <NavLink to='/' onClick={() => setShowMenu(false)}>HOME</NavLink>
          <NavLink to='/doctors' onClick={() => setShowMenu(false)}>ALL DOCTORS</NavLink>
          <NavLink to='/about' onClick={() => setShowMenu(false)}>ABOUT</NavLink>
          <NavLink to='/contact' onClick={() => setShowMenu(false)}>CONTACT</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to='/my-profile' onClick={() => setShowMenu(false)}>MY PROFILE</NavLink>
              <NavLink to='/my-appointments' onClick={() => setShowMenu(false)}>MY APPOINTMENTS</NavLink>
              <span onClick={() => { handleLogout(); setShowMenu(false); }} className='cursor-pointer text-red-500'>LOGOUT</span>
            </>
          ) : (
            <NavLink to='/login' onClick={() => setShowMenu(false)}>LOGIN</NavLink>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;