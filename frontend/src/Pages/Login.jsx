import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

const Login = () => {
  const [state, setState] = useState('Login'); // 'Sign Up', 'Login', 'Forgot Password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const navigate = useNavigate();
  const { setIsAuthenticated, setUserProfile } = useContext(AppContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (state === 'Forgot Password') {
      alert('Password reset successful!');
      setState('Login');
    } 
    else if (state === 'Login') {
      if (email && password) {
        // ✅ Save token to localStorage
        localStorage.setItem('token', 'yourTokenValue');
        
        // ✅ Update context so profile shows only after login
        setIsAuthenticated(true);
        setUserProfile({ name: 'John Doe', email });

        navigate('/home');
      } else {
        alert('Please enter valid credentials');
      }
    } 
    else if (state === 'Sign Up') {
      if (name && email && password) {
        alert('Account created successfully! Please log in.');
        setState('Login');
        setName('');
        setEmail('');
        setPassword('');
      } else {
        alert('Please fill all fields');
      }
    }
  };

  return (
    <form className="min-h-[80vh] flex items-center" onSubmit={onSubmitHandler}>
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">
          {state === 'Sign Up' ? 'Create Account' : state === 'Login' ? 'Login' : 'Reset Password'}
        </p>
        <p>
          {state === 'Sign Up'
            ? 'Please Sign Up to book Appointment'
            : state === 'Login'
            ? 'Please Log in to book Appointment'
            : 'Enter your email and new password to reset'}
        </p>

        {state === 'Sign Up' && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}

        <div className="w-full">
          <p>Email</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        {(state === 'Login' || state === 'Sign Up') && (
          <div className="w-full">
            <p>Password</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>
        )}

        {state === 'Forgot Password' && (
          <div className="w-full">
            <p>New Password</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="password"
              onChange={(e) => setNewPassword(e.target.value)}
              value={newPassword}
              required
            />
          </div>
        )}

        <button className="bg-primary text-white w-full py-2 rounded-md text-base">
          {state === 'Sign Up'
            ? 'Create Account'
            : state === 'Login'
            ? 'Login'
            : 'Reset Password'}
        </button>

        {state === 'Sign Up' && (
          <p>
            Already have an account?
            <span
              onClick={() => setState('Login')}
              className="text-primary underline cursor-pointer"
            >
              {' '}Login here
            </span>
          </p>
        )}

        {state === 'Login' && (
          <>
            <p>
              Create a new account?
              <span
                onClick={() => setState('Sign Up')}
                className="text-primary underline cursor-pointer"
              >
                {' '}Click here
              </span>
            </p>
            <p>
              Forgot your password?
              <span
                onClick={() => setState('Forgot Password')}
                className="text-primary underline cursor-pointer"
              >
                {' '}Reset here
              </span>
            </p>
          </>
        )}

        {state === 'Forgot Password' && (
          <p>
            Back to login?
            <span
              onClick={() => setState('Login')}
              className="text-primary underline cursor-pointer"
            >
              {' '}Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;
