import api from "./api";

// Decode a JWT payload without verifying signature (browser-safe)
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export const login = async (email, password) => {
  // Backend expects application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append("username", email); // FastAPI OAuth2 uses "username"
  formData.append("password", password);

  const response = await api.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token } = response.data;
  const payload = decodeJwt(access_token);

  if (!payload) throw new Error("Invalid token received from server.");

  // Normalize role to lowercase for frontend routing
  const user = {
    token: access_token,
    role: payload.role.toLowerCase(), // "STUDENT" → "student"
    roleRaw: payload.role, // Keep original for API calls if needed
    id: parseInt(payload.sub, 10),
    college_id: payload.college_id,
  };

  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};
