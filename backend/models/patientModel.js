import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email:{ type: String, required:true, unique:true },
  password:{ type:String, required:true },
  phone:{ type:String, required:true },
  gender:{ type:String, enum:["Male","Female","Other"], default:"Other" },
  dob:{ type:Date },
  createdAt:{ type:Date, default: Date.now }
});

const patientModel = mongoose.models.patient || mongoose.model("patient", patientSchema);
export default patientModel;