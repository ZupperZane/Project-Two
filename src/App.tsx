import { createBrowserRouter, RouterProvider } from "react-router-dom";
import mainRouter from "./routes/MainRouter";
import AuthProvider from "./contexts/AuthProvider";
import ThemeProvider from "./contexts/ThemeProvider";

const router = createBrowserRouter(mainRouter);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App;
