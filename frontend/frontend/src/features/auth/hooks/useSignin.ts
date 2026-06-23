import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login, getCurrentUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export const useSignin = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: login,

    onSuccess: async () => {
      const user = await getCurrentUser();
      setUser(user);
      navigate("/dashboard");
    },
  });
};
