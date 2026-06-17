import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiEyeCloseLine, RiEyeLine } from "react-icons/ri";
import { useAuth } from "../hooks/useAuth";
import { userStore } from "../store/userStore";
import { ToastContainer, toast } from "react-toastify";

const SignUp = () => {
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  const navigate = useNavigate();
  const { user } = userStore();
  const { register, login } = useAuth();

  const handleIsPasswordHidden = () => {
    setIsPasswordHidden(!isPasswordHidden);
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      username: e.target.username.value,
      password: e.target.password.value,
    };

    try {
      const res = await toast.promise(register.mutateAsync(userData), {
        pending: "Creating account...",
      });

      if (res) {
        // Auto-login with the same credentials
        await login.mutateAsync({
          username: userData.username,
          password: userData.password,
        });
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create account. Please try again.",
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        backgroundColor: "var(--color-primary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <ToastContainer />
      <main
        className="w-full max-w-md rounded-2xl shadow-xl p-8"
        style={{
          backgroundColor: "var(--color-primary)",
          borderWidth: "1px",
          borderColor: "var(--color-border)",
        }}
      >
        <header className="mb-6 text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Create your account
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Join the conversation — it only takes a minute.
          </p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              First name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              required
              placeholder="Jane"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                "--tw-ring-color": "var(--color-accent-primary-light)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Last name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              required
              placeholder="Doe"
              className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                "--tw-ring-color": "var(--color-accent-primary-light)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-primary)" }}
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
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                "--tw-ring-color": "var(--color-accent-primary-light)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-primary)" }}
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
                  backgroundColor: "var(--color-primary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  "--tw-ring-color": "var(--color-accent-primary-light)",
                }}
              />
              <button
                type="button"
                onClick={handleIsPasswordHidden}
                className="absolute right-3 focus:outline-none transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "var(--color-text-secondary)")
                }
              >
                {isPasswordHidden ? (
                  <RiEyeCloseLine size={20} />
                ) : (
                  <RiEyeLine size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg shadow-sm focus:outline-none transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-send-btn-bg)',
              color: 'var(--color-send-btn-text)',
            }}
          >
            Sign Up
          </button>

          <p
            className="text-center text-sm mt-3"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium hover:underline transition-colors"
              style={{ color: "var(--color-accent-primary)" }}
            >
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default SignUp;
