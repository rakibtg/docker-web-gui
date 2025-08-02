import { memo } from "react";
import logo from '../assets/docker-web-gui-logo.png';
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";

interface IPAccessDeniedProps {
  userIP?: string;
}

export const IPAccessDenied = memo(({ userIP }: IPAccessDeniedProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
      <div className="w-auto h-26 mx-auto mb-6">
        <img src={logo} alt="Docker GUI Logo" className="w-full h-full" />

      </div>
      <h2 className="text-3xl font-bold text-gray-100 mb-6">
        Docker Web GUI
      </h2>
      <div className=" bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <FaShieldAlt className="w-16 h-16 text-red-500" />
                <FaExclamationTriangle className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Access Denied
            </h1>

            {/* Message */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your IP address is not authorized to access this Docker Web GUI application.
              Please contact your system administrator for access.
            </p>

            {/* IP Info */}
            {userIP && (
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">Your IP Address:</p>
                <p className="text-white font-mono text-lg">{userIP}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                <strong>Error Code:</strong> IP_NOT_ALLOWED
              </p>
              <p>
                This restriction is configured by your system administrator
                to ensure secure access to Docker resources.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Docker Web GUI - An open-source Docker management web application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

IPAccessDenied.displayName = "IPAccessDenied";