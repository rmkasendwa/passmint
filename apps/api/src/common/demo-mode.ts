import { UserRole } from "../users/user-role.enum";

export const DEMO_ORGANIZER = {
  id: "usr_demo_organizer",
  name: "Passmint Demo Organizer",
  email: "demo.organizer@example.test",
  passwordHash: "demo-password-disabled",
  role: UserRole.User,
};

export function demoOrganizerUpsert() {
  return {
    where: { email: DEMO_ORGANIZER.email },
    update: {
      name: DEMO_ORGANIZER.name,
      passwordHash: DEMO_ORGANIZER.passwordHash,
      role: DEMO_ORGANIZER.role,
    },
    create: DEMO_ORGANIZER,
  };
}
