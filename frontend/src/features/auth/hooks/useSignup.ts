import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/authApi";

export const useSignup = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,

    onSuccess: () => {
      navigate("/login?registered=success", { replace: true });
    },

    onError: (error: Error) => {
      console.error("Sign up error:", error.message);
    },
  });
};
