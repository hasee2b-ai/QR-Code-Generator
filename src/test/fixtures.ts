import { ContentType, WifiConfig } from "../types";

/** Shared fixtures so tests describe intent instead of repeating literals. */

export const DEFAULT_WIFI: WifiConfig = {
  ssid: "",
  password: "",
  security: "WPA",
  hidden: false,
};

export const WIFI_PRIVATE: WifiConfig = {
  ssid: "HomeNetwork",
  password: "hunter2",
  security: "WPA",
  hidden: false,
};

export const WIFI_OPEN: WifiConfig = {
  ssid: "CafeGuest",
  password: "",
  security: "nopass",
  hidden: false,
};

export const WIFI_WITH_ESCAPES: WifiConfig = {
  ssid: "My;Net",
  password: "p:ss,word",
  security: "WPA",
  hidden: false,
};

export const URL_INPUT = {
  contentType: "url" as ContentType,
  url: "https://freesubqr.vercel.app",
  text: "",
  wifi: DEFAULT_WIFI,
};
