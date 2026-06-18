import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export const useSignin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("LOGIN SUCCESS", data);
      setAuth(data);
      console.log("AFTER SETAUTH");
      navigate("/dashboard");
      console.log("AFTER NAVIGATE");
    },
  });
};
