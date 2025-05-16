import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth 会自动使用 /api/auth/callback/github 作为回调路径
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
