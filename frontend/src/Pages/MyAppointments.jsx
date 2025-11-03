import React, { useEffect, useState } from "react";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("appointments")) || [];
    setAppointments(saved);
  }, []);

  const cancelAppointment = (id) => {
    const filtered = appointments.filter((appt) => appt.id !== id);
    setAppointments(filtered);
    localStorage.setItem("appointments", JSON.stringify(filtered));
    setConfirmId(null);
  };

  if (appointments.length === 0) {
    return <p className="p-6 text-center">You have no appointments booked.</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">My Appointments</h2>

      {appointments.map((appt) => (
        <div
          key={appt._id}
          className="border rounded p-4 mb-4 shadow flex flex-col sm:flex-row justify-between items-start sm:items-center"
        >
          <div className="flex items-start gap-4">
            <img
              src={appt.image}   // <-- Use doctorImage for doctor picture
              alt={appt.name}    // <-- Use doctorName for alt
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="font-bold">{appt.name}</p>
              <p className="text-sm text-gray-600">{appt.doctorSpecialty}</p>
              <p className="text-gray-800">Fee: ₹{appt.fees}</p>
              <p className="mt-2 font-semibold">Patient: {appt.patientName}</p>
              <p>Age: {appt.age}</p>
              <p>Medical Issue: {appt.medicalIssue}</p>
              {appt.suggestions && (
                <p>Suggestions: {appt.suggestions}</p>
              )}
              <p className="mt-2">
                {appt.date} | {appt.time}
              </p>
            </div>
          </div>

          {/* Cancel Button */}
          {confirmId === appt.id ? (
            <div className="flex flex-col items-center space-y-2 mt-4 sm:mt-0">
              <p className="font-bold text-red-600 text-sm">
                Are you sure you want to cancel?
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => cancelAppointment(appt.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(appt.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-4 sm:mt-0"
            >
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyAppointments;
