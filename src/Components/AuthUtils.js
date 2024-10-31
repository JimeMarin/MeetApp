import { getAuth } from "firebase/auth";

export const getCurrentUser = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    return {
      name: user.displayName,
      email: user.email
    };
  }
  return null;
};