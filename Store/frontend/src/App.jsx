import React from "react";
import PrivateRoutes from "./routes/privateRoutes";
import PublicRoutes from "./routes/publicRoutes";

function App() {
  return (
    <>
      <PrivateRoutes />
      <PublicRoutes />
    </>
  );
}

export default App;
