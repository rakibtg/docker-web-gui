import React from "react";
import { IoSearchSharp } from "react-icons/io5";

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
}) => (
  <div className="relative">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex items-center bg-gray-800 rounded-lg border border-gray-600 px-2 py-1.5 text-sm w-3xs pl-6 focus:outline-none focus:ring-2 focus:ring-blue-800"
    />
    <IoSearchSharp className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
  </div>
);

export default SearchInput;
