import React, { useState } from "react";
import axios from "axios";

const RegisterDoctor = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    speciality: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["street", "city", "state", "pincode"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/doctor/register", formData);
      alert("Registered successfully!");
      console.log(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Doctor Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="border p-2 w-full" />
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border p-2 w-full" />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" className="border p-2 w-full" />
        <input name="speciality" value={formData.speciality} onChange={handleChange} placeholder="Speciality" className="border p-2 w-full" />
        
        <input name="street" value={formData.address.street} onChange={handleChange} placeholder="Street" className="border p-2 w-full" />
        <input name="city" value={formData.address.city} onChange={handleChange} placeholder="City" className="border p-2 w-full" />
        <input name="state" value={formData.address.state} onChange={handleChange} placeholder="State" className="border p-2 w-full" />
        <input name="pincode" value={formData.address.pincode} onChange={handleChange} placeholder="Pincode" className="border p-2 w-full" />
        
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Register</button>
      </form>
    </div>
  );
};

export default RegisterDoctor;
