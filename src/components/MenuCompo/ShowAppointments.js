import React, { useEffect, useState } from "react";
import axios from "axios";
import { message } from "antd";
import { Calendar, Clock, Trash2, User, Phone, ShieldAlert, Inbox, Check } from "lucide-react";

export default function ShowAppointments({ role, ui }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:9000/book/appointments"
        );
        setAppointments(response.data.appointments || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to retrieve schedules.");
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleAction = async (appointmentId, action) => {
    if (action === "Reject") {
      try {
        const url = `http://localhost:9000/book/appointments/${appointmentId}`;
        console.log(`Deleting appointment at URL: ${url}`);
        await axios.delete(url);
        setAppointments(
          appointments.filter(
            (appointment) => appointment._id !== appointmentId
          )
        );
        message.success("Appointment removed successfully");
      } catch (error) {
        console.error("Error deleting appointment:", error);
        message.error("Failed to delete appointment");
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
          <div className="h-6 w-1/4 bg-slate-200 rounded-lg"></div>
          <div className="h-6 w-1/6 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 flex justify-between items-center animate-pulse">
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>
                  <div className="h-3.5 w-24 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
              <div className="h-5 w-20 bg-slate-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-red-100 shadow-sm text-center max-w-lg mx-auto mt-8">
        <div className="p-3 bg-red-50 text-red-500 rounded-2xl mb-4">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">Failed to load appointments</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-xs">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-8">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">No appointments found</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-xs">There are no diagnostic appointments registered in the database currently.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4.5 text-center w-16">S.NO</th>
              <th className="px-6 py-4.5">Patient Details</th>
              <th className="px-6 py-4.5">Diagnostic Panel</th>
              <th className="px-6 py-4.5">Schedule Details</th>
              <th className="px-6 py-4.5">Status</th>
              {role === "userType" && <th className="px-6 py-4.5 text-right pr-8">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
            {appointments.map((appointment, index) => (
              <tr
                key={appointment._id || index}
                className="hover:bg-slate-50/50 transition-colors"
              >
                {/* Serial Number */}
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                </td>

                {/* Patient Details */}
                <td className="px-6 py-5">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-850 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {appointment.Name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {appointment.Phone}
                    </p>
                  </div>
                </td>

                {/* Pathology Test */}
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold border border-brand-100 capitalize">
                    {appointment.test || "Pathology Test"}
                  </span>
                </td>

                {/* Date & Time */}
                <td className="px-6 py-5">
                  <div className="space-y-1 text-slate-600 text-xs font-semibold">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(appointment.date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {appointment.time}
                    </p>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    Scheduled
                  </span>
                </td>

                {/* Action button */}
                {role === "userType" && (
                  <td className="px-6 py-5 text-right pr-8">
                    <button
                      onClick={() => handleAction(appointment._id, "Reject")}
                      className="inline-flex items-center gap-1 py-1.5 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-xl text-xs font-bold transition-all border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
