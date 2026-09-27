import React, { useState } from "react";
import axios from "axios";
import { DatePicker, TimePicker, message } from "antd";
import { User, Phone, Calendar, Clock, ClipboardList, ShieldAlert, Check } from "lucide-react";

const testOptions = [
  { id: "Blood Test", name: "Blood Test Profile", desc: "Biochemistry, lipid profile, and sugar checkups.", duration: "10 min", price: "$29" },
  { id: "Urine Test", name: "Urinalysis", desc: "Chemical and microscopic analysis of urine markers.", duration: "10 min", price: "$19" },
  { id: "Liver Function Test", name: "Liver Panel", desc: "Checks enzymes, bilirubin, and protein levels.", duration: "15 min", price: "$39" },
  { id: "Thyroid Function Test", name: "Thyroid T3/T4/TSH", desc: "Checks thyroid gland hormonal activities.", duration: "15 min", price: "$49" },
  { id: "Complete Blood Count", name: "CBC Profile", desc: "Measures red/white cells and platelet count.", duration: "10 min", price: "$25" },
  { id: "covid 19", name: "COVID-19 RT-PCR", desc: "Rapid diagnostics swab test for COVID-19.", duration: "5 min", price: "$59" },
  { id: "AntiBody", name: "Antibody Test", desc: "Checks for past vaccine or viral immune response.", duration: "10 min", price: "$35" }
];

export default function CreateAppointments() {
  const [appointmentDate, setAppointmentDate] = useState({
    Name: "",
    Phone: "",
    time: null,
    date: null,
    test: "Blood Test", // Default select
  });

  const userToken = localStorage.getItem("token");

  if (!userToken) {
    message.error("User not authenticated");
    return null;
  }

  const url = `http://localhost:9000/book/${userToken}`;

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleSaveAppointments = async () => {
    const { Name, Phone, time, date, test } = appointmentDate;
    if (!Name || !Phone || !time || !date || !test) {
      message.error("All fields are required");
      return;
    }

    if (!validatePhone(Phone)) {
      message.error("Please enter a valid 10-digit phone number.");
      return;
    }

    if (date && isPastDate(date.toDate())) {
      message.error("You cannot book an appointment for a past date.");
      return;
    }

    try {
      await axios.post(url, {
        Name,
        Phone,
        time: time.format("HH:mm"),
        date: date.format("YYYY-MM-DD"),
        test, 
      });
      message.success("Appointment booked successfully!");
      setAppointmentDate({
        Name: "",
        Phone: "",
        time: null,
        date: null,
        test: "Blood Test",
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        message.error("Time slot not available");
      } else {
        message.error("Error saving appointment");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
              <ClipboardList className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Book a Diagnostic Appointment</h2>
              <p className="text-xs text-slate-400 mt-1">Select your diagnostic panel and confirm your preferred lab slot.</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Patient Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-brand-500 rounded-full"></span>
              1. Patient Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Patient Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium text-slate-800"
                    value={appointmentDate.Name}
                    onChange={(e) =>
                      setAppointmentDate({ ...appointmentDate, Name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number (10 digits)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="Enter 10-digit mobile"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium text-slate-800"
                    value={appointmentDate.Phone}
                    onChange={(e) =>
                      setAppointmentDate({
                        ...appointmentDate,
                        Phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Test Option Cards Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-brand-500 rounded-full"></span>
              2. Select Diagnostic Test Panel
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testOptions.map((opt) => {
                const isSelected = appointmentDate.test === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAppointmentDate({ ...appointmentDate, test: opt.id })}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between h-36 ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight pr-6">{opt.name}</h4>
                        {isSelected && (
                          <span className="absolute top-4 right-4 p-1 bg-brand-500 text-white rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{opt.desc}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100/60 w-full text-xs font-semibold">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {opt.duration}
                      </span>
                      <span className="text-brand-600 font-bold">{opt.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Date and Time Selector */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-brand-500 rounded-full"></span>
              3. Date and Time Slot
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" /> Choose Date
                </label>
                <DatePicker
                  className="w-full py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl border border-slate-200"
                  format="DD-MM-YYYY"
                  placeholder="Select Preferred Date"
                  value={appointmentDate.date}
                  onChange={(date) =>
                    setAppointmentDate({ ...appointmentDate, date })
                  }
                  disabledDate={(current) =>
                    current && current < new Date().setHours(0, 0, 0, 0)
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-500" /> Choose Time
                </label>
                <TimePicker
                  className="w-full py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white rounded-xl border border-slate-200"
                  format="HH:mm"
                  placeholder="Select Preferred Time"
                  value={appointmentDate.time}
                  onChange={(time) =>
                    setAppointmentDate({ ...appointmentDate, time })
                  }
                />
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <button
              className="w-full md:max-w-md bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-brand-500/10 hover-glow transition-all flex items-center justify-center gap-2 text-sm"
              onClick={handleSaveAppointments}
            >
              Confirm Appointment
              <Check className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
              You can cancel or reschedule up to 2 hours before the appointment.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
