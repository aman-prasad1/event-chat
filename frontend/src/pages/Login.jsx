import React, { useState } from "react";
import { Link, useNavigate} from "react-router-dom";
import { RiEyeCloseLine, RiEyeLine } from "react-icons/ri";
import { useAuth } from "../hooks/useAuth";
import { userStore } from "../store/userStore";
import { ToastContainer, toast } from 'react-toastify';


const Login = () => {

  const [isPasswordHidden, setisPasswordHidden] = useState(true);

  const navigate = useNavigate();
  const { user } = userStore();
  const { login } = useAuth();

  const handleIsPasswordHidden = () => {
    setisPasswordHidden(!isPasswordHidden);
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const credentials = {
      username: e.target.username.value,
      password: e.target.password.value,
    };

    try {
      const res = await toast.promise(login.mutateAsync(credentials), {
        pending: 'Logging in...',
      });
      
      if(res) {
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-sans)' }}>
      <ToastContainer />
      <main className="w-full max-w-md rounded-2xl shadow-xl p-8" style={{ backgroundColor: 'var(--color-primary)', borderWidth: '1px', borderColor: 'var(--color-border)' }}>
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sign in to your account
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome back! Please enter your details.
          </p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              placeholder="janedoe"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                '--tw-ring-color': 'var(--color-accent-primary-light)'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={isPasswordHidden ? "password" : "text"}
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  '--tw-ring-color': 'var(--color-accent-primary-light)'
                }}
              />
              <button
                type="button"
                onClick={handleIsPasswordHidden}
                className="absolute right-3 focus:outline-none transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                {isPasswordHidden ? <RiEyeCloseLine size={20} /> : <RiEyeLine size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              '--tw-ring-color': 'var(--color-accent-primary-lighter)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-accent-primary-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-accent-primary)'}
          >
            Login
          </button>

          <p className="text-center text-sm mt-3" style={{ color: 'var(--color-text-secondary)' }}>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium hover:underline transition-colors"
              style={{ color: 'var(--color-accent-primary)' }}
            >
              Sign up
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
