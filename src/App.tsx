import { createBrowserRouter, RouterProvider } from "react-router-dom";
import mainRouter from "./routes/MainRouter";

const router = createBrowserRouter(mainRouter);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
