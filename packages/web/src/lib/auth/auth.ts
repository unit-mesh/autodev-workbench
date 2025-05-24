import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "../prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.SECRET,
  callbacks: {
    async signIn() {
      // User will be automatically created by the Prisma adapter
      // We can add additional logic here if needed
      return true;
    },
    async session({ session, user }) {
      // Add user ID to the session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser(message) {
      // This event is triggered when a user is created
      // You can perform additional operations here
      const { user } = message;
      console.log(`New user created: ${user.email}`);

      // Create a default project for the new user if needed
      try {
        await prisma.project.create({
          data: {
            name: "Default Project",
            description: "Your first project",
            gitUrl: "",
            isDefault: true,
            userId: user.id,
          }
        });
      } catch (error) {
        console.error("Error creating default project:", error);
      }
    }
  }
};
