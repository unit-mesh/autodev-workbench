"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">登录到 AutoDev</h1>
          <p className="mt-2 text-gray-600">
            使用以下方式登录以获取完整访问权限
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full py-6 flex items-center justify-center"
            variant="outline"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            <Github className="mr-2 h-5 w-5" />
            使用 GitHub 登录
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/")}
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
