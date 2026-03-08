import { mockUsers } from "@/lib/data/users";
import { ServiceResponse, User, UserRole } from "@/lib/types";
import { sleep } from "@/lib/services/serviceUtils";

let currentUser: User | null = mockUsers[0];

export const authService = {
  async login(email: string, password: string): Promise<ServiceResponse<User>> {
    await sleep(600);
    void password;
    const user = mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? mockUsers[0];
    currentUser = user;
    return { data: user, message: "Logged in successfully" };
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<ServiceResponse<User>> {
    await sleep(700);
    const user: User = {
      id: `u-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      verifiedOrganizer: false,
      status: "active",
      joinedAt: new Date().toISOString(),
    };
    currentUser = user;
    return { data: user, message: "Account created successfully" };
  },

  async forgotPassword(email: string): Promise<ServiceResponse<boolean>> {
    await sleep(500);
    void email;
    return { data: true, message: "Reset link sent" };
  },

  async getCurrentUser(): Promise<ServiceResponse<User | null>> {
    await sleep(200);
    return { data: currentUser };
  },

  async logout(): Promise<ServiceResponse<boolean>> {
    await sleep(200);
    currentUser = null;
    return { data: true, message: "Logged out" };
  },
};
