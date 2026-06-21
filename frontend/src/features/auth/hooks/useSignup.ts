import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export const useSignup = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      console.log("SIGNUP SUCCESS", data);

      if (data.user) {
        setUser(data.user);
      }

      navigate("/login");
    },

    onError: (error: Error) => {
      console.error(error.message);
    },
  });
};
