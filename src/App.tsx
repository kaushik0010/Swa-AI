import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import CreatePage from "./pages/CreatePage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "./components/ui/sonner";

function App() {

  const router = createBrowserRouter([
    {
    path: "/",
    element: <HomePage />, // <-- '/' is now the new home page
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/create",
    element: <CreatePage />,
  },
  {
    // We will pass the persona's ID in the URL
    path: "/chat/:personaId",
    element: <ChatPage />,
  },
]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <RouterProvider router={router} />
      <Toaster richColors theme="dark" />
    </div>
  )
}

export default App
