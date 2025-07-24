import React, { useState, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ToggleSwitch } from "./ToggleSwitch";
import { UptimeDisplay } from "./UptimeDisplay";
import type { ContainerWithStats } from "../types";
import { BsFillTerminalFill } from "react-icons/bs";
import { IoNewspaper } from "react-icons/io5";
import { IoReloadCircle } from "react-icons/io5";
import { FaCircleInfo } from "react-icons/fa6";
import { formatDockerPort } from "../helpers/readablePort";

function CardActionButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`cursor-pointer w-18 p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400
      `}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ContainerCardProps {
  container: ContainerWithStats;
  onToggle: (containerId: string, currentState: string) => void;
  onRestart?: (containerId: string) => void;
  onOpenTerminal?: (containerId: string, containerName: string) => void;
  onOpenLogs?: (containerId: string, containerName: string) => void;
  isToggling?: boolean;
}

const ContainerCard = memo(function ContainerCard({
  container,
  onToggle,
  onRestart,
  onOpenTerminal,
  onOpenLogs,
  isToggling = false,
}: ContainerCardProps) {
  const [localToggling, setLocalToggling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const isRunning = container.state === "running";

  const handleToggle = useCallback(async () => {
    setLocalToggling(true);
    try {
      await onToggle(container.id, container.state);
    } finally {
      setTimeout(() => setLocalToggling(false), 1000);
    }
  }, [onToggle, container.id, container.state]);

  const handleRestart = useCallback(async () => {
    if (!onRestart) return;

    setIsRestarting(true);
    try {
      await onRestart(container.id);
    } finally {
      setTimeout(() => setIsRestarting(false), 2000);
    }
  }, [onRestart, container.id]);

  const handleOpenTerminal = useCallback(() => {
    onOpenTerminal?.(container.id, container.name);
  }, [onOpenTerminal, container.id, container.name]);

  const handleOpenLogs = useCallback(() => {
    onOpenLogs?.(container.id, container.name);
  }, [onOpenLogs, container.id, container.name]);

  return (
    <div className="bg-gray-800 rounded shadow-md border-gray-600 border p-4 pt-2.5 hover:shadow-lg transition-all duration-200 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center border-0 border-yellow-500 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-row items-center gap-2">
              <Link
                to={`/containers/${container.id}`}
                className="text-lg font-semibold text-gray-100 hover:text-blue-400 truncate transition-colors"
              >
                {container.name}
              </Link>
              <UptimeDisplay
                status={container.status}
                className={`inline-flex text-xs px-2 py-1 rounded-full transition-colors ${
                  isRunning
                    ? "border border-green-400/30 text-green-100"
                    : "border border-red-400/50 text-red-100"
                }`}
              />
            </div>
            <p
              className="text-sm text-gray-400 font-mono transition-colors flex items-center gap-1"
              title={`ID: ${container.id.substring(0, 10)}`}
            >
              <span className="inline-block">
                {container.id.substring(0, 10)}
              </span>
              <span className="inline-block text-xs">|</span>
              <span
                className="inline-block max-w-full truncate"
                title={`Image: ${container.image}`}
              >
                {container.image}
              </span>
            </p>
          </div>
        </div>

        <div className="">
          <div className="flex items-center space-x-4 justify-around">
            <div className="flex flex-col items-center gap-1  w-18 rounded-md p-2">
              <ToggleSwitch
                isOn={isRunning}
                onToggle={handleToggle}
                loading={isToggling || localToggling}
                disabled={isToggling || localToggling}
                size="md"
              />
              <p className="text-xs text-gray-100 cursor-default">
                {isRunning ? "Stop" : "Start"}
              </p>
            </div>

            <CardActionButton
              title="Open terminal"
              aria-label="Open terminal"
              onClick={handleOpenTerminal}
              disabled={!isRunning || !onOpenTerminal}
            >
              <BsFillTerminalFill className="w-5 h-5" />
              <p className="text-xs text-gray-100 pt-1">Terminal</p>
            </CardActionButton>

            <CardActionButton
              title="Open logs"
              aria-label="Open logs"
              onClick={handleOpenLogs}
              disabled={!isRunning || !onOpenLogs}
            >
              <IoNewspaper className="w-5 h-5" />
              <p className="text-xs text-gray-100 pt-1">Logs</p>
            </CardActionButton>

            <CardActionButton
              title={
                isRestarting ? "Restarting container..." : "Reload container"
              }
              aria-label={
                isRestarting ? "Restarting container..." : "Reload container"
              }
              onClick={handleRestart}
              disabled={!isRunning || !onRestart || isRestarting}
            >
              <IoReloadCircle
                className={`w-6 h-6 transition-transform ${
                  isRestarting ? "animate-spin text-blue-500" : ""
                }`}
              />
              <p
                className={`text-xs pt-1 ${
                  isRestarting ? "text-blue-500" : "text-gray-100"
                }`}
              >
                {isRestarting ? "Restarting..." : "Restart"}
              </p>
            </CardActionButton>

            <Link
              to={`/containers/${container.id}`}
              className="cursor-pointer w-18 p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center"
              title="Container details"
              aria-label="Container details"
            >
              <FaCircleInfo className="w-5 h-5" />
              <p className="text-xs text-gray-100 pt-1">Details</p>
            </Link>
          </div>
        </div>
      </div>

      {isRunning && container.stats && (
        <div className="transition-colors">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-lg p-2 px-3 border-gray-600 border transition-colors">
              <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 transition-colors">
                CPU
              </p>
              <p className="text-sm font-mono text-gray-100 transition-colors">
                {container.stats.cpuPerc}
              </p>
            </div>
            <div className="rounded-lg p-2 px-3 border-gray-600 border transition-colors col-span-1 md:col-span-2">
              <p className="text-xs font-bold uppercase text-green-600 dark:text-green-400 transition-colors">
                Memory
              </p>
              <div className="flex flex-row gap-1">
                <p className="text-sm font-mono text-gray-100 transition-colors">
                  {container.stats.memPerc}
                </p>{" "}
                <p className="text-sm font-mono text-gray-300 transition-colors">
                  ({container.stats.memUsage})
                </p>
              </div>
            </div>
            <div className="rounded-lg p-2 px-3 border-gray-600 border transition-colors">
              <div className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 transition-colors">
                Block I/O
              </div>
              <div className="text-sm font-mono text-gray-100 transition-colors">
                {container.stats.blockIO}
              </div>
            </div>
            <div className="rounded-lg p-2 px-3 border-gray-600 border transition-colors">
              <div className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 transition-colors">
                Network I/O
              </div>
              <div className="text-sm font-mono text-gray-100 transition-colors">
                {container.stats.netIO}
              </div>
            </div>
            <div className="rounded-lg p-2 px-3 border-gray-600 border transition-colors">
              <div className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-400 transition-colors">
                Port
              </div>
              <div className="text-sm font-mono text-gray-100 transition-colors">
                {formatDockerPort(container.ports)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export { ContainerCard };
