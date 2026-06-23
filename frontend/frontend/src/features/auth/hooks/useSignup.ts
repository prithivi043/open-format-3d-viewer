import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register, getCurrentUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export const useSignup = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,

    onSuccess: async () => {
      const user = await getCurrentUser();
      setUser(user);
      navigate("/dashboard");
    },
  });
};
