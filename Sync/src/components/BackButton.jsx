import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 font-medium shadow ${className}`}
      title="Go Back"
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
};

export default BackButton; 