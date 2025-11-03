import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

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
import { AppContext } from './Context/AppContext';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AppContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { isAuthenticated } = useContext(AppContext);

  return (
    <div className="mx-4 sm:mx-[10%]">
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
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
          path="/appointment/:docId"
          element={
            <PrivateRoute>
              <Appointment />
            </PrivateRoute>
          }
        />
        <Route
          path="/register-doctor"
          element={
            <PrivateRoute>
              <RegisterDoctor />
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

        {/* Public doctors page */}
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />

        {/* Fallback route to redirect unknown URLs to home or login */}
        <Route
          path="*"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
          }
        />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
