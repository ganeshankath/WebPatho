import React, { useState, useRef } from "react";
import { userMenu, adminMenu } from "../Data/data.";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import CreateAppointments from "../components/MenuCompo/CreateAppointments";
import ShowAppointments from "../components/MenuCompo/ShowAppointments";
import { 
  Activity, Calendar, Users, CheckCircle, LogOut, 
  Menu, X, Heart, ShieldCheck, Clock, ArrowRight, 
  Phone, Mail, MapPin, Award, Check, Info
} from "lucide-react";

const Layout = () => {
  const user = useParams(); 
  const navigate = useNavigate();
  const [compo, setcompo] = useState(""); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const Aboutref = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    message.success("Logged out successfully");
    navigate("/login");
  };

  const SidebarMenu =
    user?.user === "user" ? userMenu : user?.user === "admin" ? adminMenu : null;

  const scrollToAbout = () => {
    Aboutref.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const ScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Safe navigation handler
  const handleNavClick = (menuName) => {
    setcompo(menuName);
    setMobileMenuOpen(false);
    if (menuName === "About Us") {
      // Delay slightly to allow state to settle if returning from a form
      setTimeout(scrollToAbout, 100);
    } else if (menuName === "Home") {
      ScrollToTop();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleNavClick("Home")}>
              <div className="p-2 bg-brand-500 rounded-xl text-white shadow-md shadow-brand-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">
                Web<span className="text-brand-600">Patho</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {SidebarMenu?.map((menu) => (
                <button
                  key={menu.name}
                  onClick={() => handleNavClick(menu.name)}
                  className={`text-sm font-semibold tracking-wide transition-all py-1.5 nav-link-underline ${
                    compo === menu.name || (menu.name === "Home" && compo === "")
                      ? "text-brand-600 font-bold"
                      : "text-slate-600 hover:text-brand-600"
                  }`}
                >
                  {menu.name}
                </button>
              ))}

              {/* User Avatar Badge & Logout */}
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200/50">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user?.user?.[0] || 'U'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 capitalize">
                    {user?.user === "admin" ? "Doctor Admin" : user?.user}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-4 space-y-2 shadow-inner">
            {SidebarMenu?.map((menu) => (
              <button
                key={menu.name}
                onClick={() => handleNavClick(menu.name)}
                className={`block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  compo === menu.name || (menu.name === "Home" && compo === "")
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {menu.name}
              </button>
            ))}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-slate-500 capitalize">Logged as: {user?.user}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-bold text-red-600 py-1 px-3 rounded-lg hover:bg-red-50 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {compo === "Book Appointment" && user?.user === "user" ? (
          <CreateAppointments />
        ) : compo === "Users" && user?.user === "admin" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Patients & Accounts</h1>
                <p className="text-sm text-slate-500 mt-1">Manage and view diagnostic records for all patient accounts</p>
              </div>
            </div>
            <ShowAppointments />
          </div>
        ) : compo === "Appointments" && user?.user === "admin" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Active Bookings</h1>
                <p className="text-sm text-slate-500 mt-1">Review, confirm, or remove pathology appointment requests</p>
              </div>
            </div>
            <ShowAppointments role={"userType"} />
          </div>
        ) : user?.user === "admin" ? (
          /* Doctor/Admin Dashboard */
          <div className="space-y-8">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
              <div className="relative z-10 max-w-2xl">
                <span className="bg-white/20 text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-white/20">
                  Doctor Panel
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold mt-4 tracking-tight leading-tight">
                  Welcome Back, Doctor!
                </h1>
                <p className="text-brand-100 mt-4 text-base md:text-lg font-medium">
                  Review today's diagnostic requests, manage patient appointments, and optimize laboratory slots.
                </p>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 - Appointments */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover-glow">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Appointments</span>
                    <h2 className="text-3xl font-extrabold text-slate-800">Active</h2>
                  </div>
                  <div className="p-3 bg-brand-50 rounded-xl text-brand-600 border border-brand-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-4">Check new slots requested by patients for lab tests.</p>
                <button
                  onClick={() => setcompo("Appointments")}
                  className="mt-6 w-full py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  Check Bookings
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2 - Users */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover-glow">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Patients</span>
                    <h2 className="text-3xl font-extrabold text-slate-800">Registered</h2>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-4">View register history, email lists, and active patients.</p>
                <button
                  onClick={() => setcompo("Users")}
                  className="mt-6 w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  Manage Patients
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3 - Stats */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover-glow">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Reports</span>
                    <h2 className="text-3xl font-extrabold text-slate-800">100% Online</h2>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-4">Lab results are compiled instantly and available online.</p>
                <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-500">
                  <Clock className="w-4 h-4 text-emerald-500 mr-1.5" />
                  System online and operational
                </div>
              </div>

            </div>
          </div>
        ) : user?.user === "user" ? (
          /* Patient/User Dashboard */
          <div className="space-y-16">
            
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-[80px]"></div>
              
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full border border-brand-100">
                  <Heart className="w-3.5 h-3.5 fill-brand-500 text-brand-500" />
                  Your Care is Our Priority
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-[1.1]">
                  Your <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Health Care</span> is Our Ambition
                </h1>
                <p className="text-slate-500 text-lg max-w-lg font-medium">
                  We work continuously to take care of your body. Book pathology diagnostic checkups at home and get accurate digital lab results instantly.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => setcompo("Book Appointment")}
                    className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-brand-500/10 hover-glow flex items-center gap-2 text-sm"
                  >
                    Schedule Lab Test
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollToAbout}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 px-8 rounded-xl transition-all border border-slate-200/80 text-sm"
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Decorative Report UI Mock */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold tracking-wider">LAB REPORT</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      APPROVED
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Patient</span>
                        <span>Date</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="capitalize">{user?.user}</span>
                        <span>Today</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand-400" /> Complete Blood Count</span>
                        <span className="font-semibold text-brand-400">Normal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand-400" /> Liver Function Test</span>
                        <span className="font-semibold text-brand-400">Optimal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand-400" /> Thyroid Profile</span>
                        <span className="font-semibold text-brand-400">Normal</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Back decorative panels */}
                <div className="absolute w-[90%] h-[90%] bg-slate-200/50 -rotate-3 rounded-2xl -bottom-3 z-0 border border-slate-300/40"></div>
                <div className="absolute w-[80%] h-[80%] bg-slate-100/60 -rotate-6 rounded-2xl -bottom-6 z-0 border border-slate-300/30"></div>
              </div>
            </div>

            {/* Quick Actions / Diagnostic Booking banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-500/10 rounded-full blur-[80px]"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-8 space-y-4">
                  <span className="text-brand-400 text-xs font-bold uppercase tracking-widest">Diagnostic Panel</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Schedule Your Pathology Tests Online
                  </h2>
                  <p className="text-slate-400 max-w-lg text-sm">
                    No need to visit labs in person. Select your specific diagnostic test, choose a time slot, and our professionals will arrange the process smoothly.
                  </p>
                </div>
                <div className="md:col-span-4 flex md:justify-end">
                  <button
                    onClick={() => setcompo("Book Appointment")}
                    className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 hover-glow"
                  >
                    Book Appointment Now
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* About Us section */}
            <section ref={Aboutref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1 text-brand-600 text-xs font-bold uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  About Our Center
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                  We Take Care of Your Healthy Life
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  WebPatho is a next-generation online doctor consultation and pathology booking portal. We enable patients to book slots anytime, anywhere, with maximum flexibility and reliability.
                </p>
                
                {/* Custom list of highlights */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Accredited Laboratories</h4>
                      <p className="text-slate-500 text-xs mt-0.5">All tests are processed in certified premium diagnostics labs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Rapid Turnaround Time</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Reports are compiled and visible on your profile within 24 hours.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Secure and Confidential</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Patient reports are encrypted and strictly confidential.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aesthetic Mock Graphic */}
              <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200/50 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="text-center space-y-4 max-w-xs relative z-10">
                  <div className="w-16 h-16 bg-white text-brand-600 rounded-2xl flex items-center justify-center shadow-md mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">WebPatho Diagnostics</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Integrated diagnostic network offering more than 50 pathology test panels with free home collection options.
                  </p>
                </div>
              </div>
            </section>

          </div>
        ) : null}
      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-900 text-slate-400 mt-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-850">
            
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-brand-500 rounded-lg text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  WebPatho
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Streamlining pathology test bookings and doctor checkup schedules. Our goal is providing high quality, accurate medical details at your fingertips.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest">Navigation</h3>
              <ul className="space-y-2.5 text-xs font-semibold">
                {SidebarMenu?.map((menu) => (
                  <li key={menu.name}>
                    <button
                      onClick={() => handleNavClick(menu.name)}
                      className="hover:text-white transition-colors"
                    >
                      {menu.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest">Contact Support</h3>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-400" />
                  <span>support@webpatho.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span>+1 (234) 567-8900</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>100 Health Science Parkway, Suite A</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} WebPatho. All rights reserved.</p>
            <div className="flex gap-4">
              <button type="button" className="hover:text-white transition-colors">Privacy Policy</button>
              <button type="button" className="hover:text-white transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
