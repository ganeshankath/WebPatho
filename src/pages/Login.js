import React, { useState } from "react";
import { message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, User, UserCheck, Activity, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [data, setdata] = useState({
    email: "",
    password: "",
    Role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlelogin = async () => {
    if (!data.email || !data.password || !data.Role) {
      message.warning("Please fill in all details and select your role");
      return;
    }
    
    setLoading(true);
    try {
      console.log(data);
      const user = await axios.post("http://localhost:9000/login", {
        email: data.email,
        password: data.password,
        Role: data.Role,
      });
      if (user.status) {
        message.success("Logged in successfully!");
        localStorage.setItem("token", user.data);
      }
      console.log(user.status);
      navigate(`${data.Role === "User" ? "/user" : "/admin"}`);
    } catch (error) {
      console.log(error);
      message.error("Invalid Details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 p-6 overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl mb-4 border border-brand-500/20">
            <Activity className="w-8 h-8 text-brand-400 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">WebPatho</h1>
          <p className="text-slate-500 mt-2">Sign in to your diagnostic panel</p>
        </div>

        {/* Role Selector Card */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setdata({ ...data, Role: "User" })}
              className={`flex flex-col items-center gap-2 py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                data.Role === "User"
                  ? "border-brand-500 bg-brand-50/80 text-brand-700 shadow-md scale-[1.02]"
                  : "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <User className={`w-5 h-5 ${data.Role === "User" ? "text-brand-500" : "text-slate-400"}`} />
              Patient Portal
            </button>
            
            <button
              type="button"
              onClick={() => setdata({ ...data, Role: "Doctor" })}
              className={`flex flex-col items-center gap-2 py-3.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                data.Role === "Doctor"
                  ? "border-brand-500 bg-brand-50/80 text-brand-700 shadow-md scale-[1.02]"
                  : "border-slate-200 bg-white/50 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <UserCheck className={`w-5 h-5 ${data.Role === "Doctor" ? "text-brand-500" : "text-slate-400"}`} />
              Doctor Admin
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                placeholder="name@example.com"
                type="email"
                required
                value={data.email}
                onChange={(e) => {
                  setdata({ ...data, email: e.target.value });
                }}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-slate-800 placeholder-slate-400 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                required
                value={data.password}
                onChange={(e) => {
                  setdata({ ...data, password: e.target.value });
                }}
                className="w-full pl-10 pr-10 py-3 bg-white/80 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-slate-800 placeholder-slate-400 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handlelogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 hover-glow py-3.5 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-sm">
            Not registered yet?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
