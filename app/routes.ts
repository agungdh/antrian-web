import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("display", "routes/display.tsx"),
  route("kios", "routes/kios.tsx"),
  route("admin", "routes/admin.tsx"),
  route("arsip", "routes/arsip.tsx"),
] satisfies RouteConfig;
