import { HiViewList, HiPhotograph, HiTrash } from "react-icons/hi";
import { ThemeToggle } from "./ThemeToggle";
import { DockerInfo } from "./DockerInfo";

const page: any = "containers";

export function Header() {
  return (
    <header className="mb-4">
      <div className="flex items-center">
        <div className="flex-1 flex justify-start">
          <div className="flex bg-theme-card rounded-lg border-theme border p-1">
            <button
              // onClick={() => onViewModeChange("table")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "containers"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-theme-muted hover:text-theme-primary"
              }`}
            >
              <HiViewList className="h-4 w-4 mr-2" />
              Containers
            </button>
            <button
              // onClick={() => onViewModeChange("grid")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "images"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-theme-muted hover:text-theme-primary"
              }`}
            >
              <HiPhotograph className="h-4 w-4 mr-2" />
              Images
            </button>
            <button
              // onClick={() => onViewModeChange("cleanup")}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                page === "cleanup"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "text-theme-muted hover:text-theme-primary"
              }`}
            >
              <HiTrash className="h-4 w-4 mr-2" />
              Clean-up
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center ">
          <h1 className="text-xl p-2 px-6 font-bold rounded-lg border-theme border text-theme-primary transition-colors">
            Docker Web GUI
          </h1>
        </div>

        <div className="flex-1 flex gap-3 justify-end items-center">
          <div>
            <DockerInfo dockerAvailable={true} isConnected={true} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
