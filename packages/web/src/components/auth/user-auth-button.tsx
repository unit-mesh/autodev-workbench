"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, User, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function UserAuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Button
        variant="outline"
        onClick={() => signIn("github")}
        className="flex items-center"
      >
        <Github className="h-4 w-4 mr-2" />
        登录
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "用户头像"}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {session?.user?.name || "用户账户"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link href="/profile">个人资料</Link>*/}
        {/*</DropdownMenuItem>*/}
        {/*<DropdownMenuItem asChild>*/}
        {/*  <Link href="/settings">设置</Link>*/}
        {/*</DropdownMenuItem>*/}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
