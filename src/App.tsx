import { createBrowserRouter, RouterProvider } from "react-router-dom";
import mainRouter from "./routes/MainRouter";
import AuthProvider from "./contexts/AuthProvider";

const router = createBrowserRouter(mainRouter);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App;
