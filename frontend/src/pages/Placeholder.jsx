import React from 'react';
import { Activity } from 'lucide-react';

const Placeholder = ({ title, description }) => (
  <div className="animate-in fade-in duration-500 w-full h-[60vh] flex flex-col items-center justify-center text-center">
    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl mb-6 flex items-center justify-center border border-red-100 shadow-sm">
       <Activity size={36} />
    </div>
    <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500 max-w-md">{description}</p>
    <div className="mt-8 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 font-mono text-sm rounded-lg">
      Status: Dynamically wired. Pending DB population.
    </div>
  </div>
);

export default Placeholder;
