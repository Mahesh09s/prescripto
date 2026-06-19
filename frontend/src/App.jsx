import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './Pages/Home';
import Login from './Pages/Login';
import About from './Pages/About';
import Contact from './Pages/Contact';
import MyProfile from './Pages/MyProfile';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import Appointment from './Pages/Appointment';
import Doctors from './Pages/Doctors';
import MyAppointments from './Pages/MyAppointments';
import RegisterDoctor from './Pages/RegisterDoctor';
import PaymentPage from './Pages/PaymentPage';
import ChatBot from './Components/ChatBot';
import { AppContext } from './Context/AppContext';

/* ── Route guard: redirect to /login if not authenticated ───────────────── */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AppContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/* ── Redirect already-logged-in users away from login/register ──────────── */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AppContext);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

/* ── App ─────────────────────────────────────────────────────────────────── */
const App = () => {
  return (
    <div className="mx-4 sm:mx-[10%]">
      <Navbar />

      <Routes>
        {/* ── Public routes (accessible without login) ──────────────── */}
        <Route path="/"         element={<Home />} />
        <Route path="/about"    element={<About />} />
        <Route path="/contact"  element={<Contact />} />
        <Route path="/doctors"  element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />

        {/* Appointment page: public view, but booking requires auth */}
        <Route path="/appointment/:docId" element={<Appointment />} />

        {/* ── Auth routes (redirect to / if already logged in) ──────── */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register-doctor"
          element={
            <PublicOnlyRoute>
              <RegisterDoctor />
            </PublicOnlyRoute>
          }
        />

        {/* ── Protected routes (require login) ─────────────────────── */}
        <Route
          path="/my-profile"
          element={
            <PrivateRoute>
              <MyProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-appointments"
          element={
            <PrivateRoute>
              <MyAppointments />
            </PrivateRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <PrivateRoute>
              <PaymentPage />
            </PrivateRoute>
          }
        />

        {/* ── Fallback ─────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />

      {/* ── AI Chatbot — rendered outside Routes so it persists across navigation ── */}
      <ChatBot />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
};

export default App;
