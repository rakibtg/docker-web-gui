export const API_BASE_URL = "http://localhost:3230/api";

export const endpoints = {
  containers: {
    fetch: "/container/fetch",
    fetchById: "/container/fetchById",
    command: "/container/command",
    logs: "/container/logs",
    stats: "/container/stats",
  },
  images: {
    fetch: "/image/fetch",
    command: "/image/command",
  },
  groups: {
    create: "/groups",
    fetch: "/groups",
    delete: "/groups",
  },
  generic: "/generic",
  cleanup: "/cleanup/command",
};
