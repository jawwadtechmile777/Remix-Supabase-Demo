import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("test", "routes/test.tsx"), route("users", "routes/users.tsx"), route("signup", "routes/signup.tsx"), route("login", "routes/login.tsx"),
] satisfies RouteConfig;
