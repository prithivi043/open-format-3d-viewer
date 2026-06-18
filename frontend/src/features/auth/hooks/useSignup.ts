import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export const useSignup = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      console.log("SIGNUP SUCCESS", data);
      setAuth(data);
      console.log("AFTER SETAUTH");
      navigate("/login");
      console.log("AFTER NAVIGATE");
    },
  });
};
