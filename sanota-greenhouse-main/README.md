# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google OAuth Setup

This app now supports Google sign-in through Supabase OAuth, which avoids relying on email verification for every new account.

1. In Supabase, enable the Google provider under Authentication.
2. In Google Cloud Console, create OAuth 2.0 credentials for a Web application.
3. Add your Supabase callback URL in Google Cloud Console:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. In Supabase Authentication settings, add your app URL to Site URL and Redirect URLs.
5. Make sure the app is served from the same origin that you register in Supabase, because the client redirects back to the current page after Google login.
6. This app now uses the browser's current origin for OAuth redirects, so your hosted domain must be added to Supabase Redirect URLs exactly as-is.

After that, users can click `Continue with Google` on the login screen.

## Multi-User Device Database

For the greenhouse device-register flow, use [mac_only_device_registration_schema.sql](./mac_only_device_registration_schema.sql).

It adds:

- `zones` and `nodes` tied to the logged-in user
- `nodes.id` uses the normalized MAC address so the ESP and web app share the same id
- automatic sensor and actuator creation when a device row is created
- row-level security so each user only sees their own data
- RPC functions for MAC-based registration, device claim, actuator fetch, and sensor ingestion

Important:

- MAC address alone is treated as the device identifier in this simplified flow.
- The ESP should use the RPC functions instead of trying to write tables directly.
