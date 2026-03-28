import { Show } from "@clerk/react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <>
      <header>
        <Show when="signed-in">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<Navigate to={"/"} replace />} />
          </Routes>
        </Show>
        <Show when="signed-out">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to={"/auth"} replace />} />
          </Routes>
          {/* <SignInButton mode="modal" />
          <SignUpButton /> */}
        </Show>
      </header>
    </>
  );
}

export default App;
