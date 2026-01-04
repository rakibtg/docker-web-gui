import { memo } from "react";
import type { ComponentType } from "react";

import { PageWrapper } from "../components/PageWrapper";
import {
  HiHeart,
  HiStar,
  HiExclamationCircle,
  HiCode,
  HiShare,
} from "react-icons/hi";

type SupportCardProps = {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName: string;
};

function SupportCard({
  title,
  description,
  href,
  linkLabel,
  icon: Icon,
  accentClassName,
}: SupportCardProps) {
  return (
    <div className="bg-gray-800 rounded shadow-md border border-gray-600 p-4 sm:p-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`mt-0.5 rounded-md p-1.5 sm:p-2 border border-gray-700 ${accentClassName}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-100">
            {title}
          </h3>
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
            {description}
          </p>

          {href && linkLabel ? (
            <div className="mt-3 sm:mt-4">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-gray-600 bg-gray-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-100 hover:bg-gray-600 hover:border-gray-500 transition-colors break-all"
              >
                {linkLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const Support = memo(function Support() {
  return (
    <PageWrapper>
      <div className="border-b border-gray-700 pb-4 mb-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              Support Docker Web GUI
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              A few small actions go a long way.
            </p>
          </div>
        </div>
      </div>

      {/* About Section - Full Width */}
      <section className="mb-6 sm:mb-8">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-100">
            About Docker Web GUI
          </h2>

          <div className="mt-1 text-sm sm:text-base text-gray-300 leading-relaxed">
            <p>
              Docker Web GUI is a modern web interface for managing Docker
              containers, images, networks, and volumes.
            </p>
            <p>
              This project was created by{" "}
              <a
                href="https://x.com/rakibtg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                @rakibtg
              </a>{" "}
              back in 2018. Since then, it has been maintained and improved over
              time.
            </p>
          </div>

          <div className="pt-4 sm:pt-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-200 tracking-wide">
              Key Features
            </h3>
            <ul className="mt-3 list-disc list-inside space-y-1 sm:space-y-1.5 text-sm sm:text-base text-gray-300">
              <li>Container lifecycle management</li>
              <li>Real-time container monitoring and stats</li>
              <li>Interactive terminal access</li>
              <li>Container logs viewing</li>
              <li>Image, network, and volume management</li>
              <li>Good DevEX!</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-100">
            How You Can Help
          </h2>
        </div>

        <div className="space-y-4">
          {/* First Row - 2 Cards in a single row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <SupportCard
              title="Support Financially"
              description="Support ongoing maintenance via GitHub Sponsors."
              href="https://github.com/sponsors/rakibtg"
              linkLabel="github.com/sponsors/rakibtg"
              icon={HiHeart}
              accentClassName="text-pink-200 bg-pink-500/10"
            />

            <SupportCard
              title="Star the Repository"
              description="Starring helps others discover the project."
              href="https://github.com/rakibtg/docker-web-gui"
              linkLabel="github.com/rakibtg/docker-web-gui"
              icon={HiStar}
              accentClassName="text-yellow-200 bg-yellow-500/10"
            />
          </div>

          {/* Second Row - 3 Cards in three columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <SupportCard
              title="Report Issues"
              description="Bugs, regressions, or requests — open an issue with details."
              href="https://github.com/rakibtg/docker-web-gui/issues"
              linkLabel="github.com/rakibtg/docker-web-gui/issues"
              icon={HiExclamationCircle}
              accentClassName="text-red-200 bg-red-500/10"
            />

            <SupportCard
              title="Contribute Code"
              description="Fork the repo, make a change, and send a pull request."
              icon={HiCode}
              accentClassName="text-green-200 bg-green-500/10"
            />

            <SupportCard
              title="Share the Project"
              description="Share the repository link with your team or community."
              icon={HiShare}
              accentClassName="text-blue-200 bg-blue-500/10"
            />
          </div>
        </div>
      </section>

      {/* Thank You Section - Full Width */}
      <section>
        <div className="bg-gray-800 rounded shadow-md border border-gray-600 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-100">
            Thank you
          </h3>
          <p className="mt-2 text-sm sm:text-base text-gray-300 leading-relaxed">
            Thanks for supporting Docker Web GUI; whether it's time, code,
            feedback, sponsorship, or simply sharing the project!
          </p>
        </div>
      </section>
    </PageWrapper>
  );
});

export { Support };
