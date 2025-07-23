import { HiViewList, HiPhotograph, HiTrash } from "react-icons/hi";
import { DockerInfo } from "./DockerInfo";

const page: string = "containers";

export function Header() {
  return (
    <header className="mb-4">
      <div className="flex items-center">
        <div className="flex-1 flex justify-start">
          <div className="flex bg-gray-800 rounded-lg border border-gray-600 p-1">
            <button
              // onClick={() => onViewModeChange("table")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "containers"
                  ? "bg-blue-900 text-blue-300"
                  : "text-gray-400 hover:text-gray-100"
              }`}
            >
              <HiViewList className="h-4 w-4 mr-2" />
              Containers
            </button>
            <button
              // onClick={() => onViewModeChange("grid")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "images"
                  ? "bg-blue-900 text-blue-300"
                  : "text-gray-400 hover:text-gray-100"
              }`}
            >
              <HiPhotograph className="h-4 w-4 mr-2" />
              Images
            </button>
            <button
              // onClick={() => onViewModeChange("cleanup")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "cleanup"
                  ? "bg-blue-900 text-blue-300"
                  : "text-gray-400 hover:text-gray-100"
              }`}
            >
              <HiTrash className="h-4 w-4 mr-2" />
              Clean-up
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center ">
          <h1 className="text-xl p-2 px-6 font-bold rounded-lg border border-gray-600 text-gray-100 transition-colors">
            Docker Web GUI
          </h1>
        </div>

        <div className="flex-1 flex gap-3 justify-end items-center">
          <div>
            <DockerInfo dockerAvailable={true} isConnected={true} />
          </div>
        </div>
      </div>
    </header>
  );
}
