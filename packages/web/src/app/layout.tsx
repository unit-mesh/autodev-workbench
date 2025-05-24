import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { TopNavigation } from "@/layout/navigation/top-navigation";
import { SideNavigation } from "@/layout/navigation/side-navigation";
import { AiAssistantWrapper } from "@/layout/assistant/ai-assistant-wrapper";
import { AIAssistantProvider } from "@/layout/assistant/ai-assistant-context";
import { AuthProvider } from "@/layout/auth-provider";

const inter = {
	className: 'font-sans',
};

export const metadata: Metadata = {
	title: "AutoDev Workbench",
	description: "AI-Powered AutoDevelopment Platform",
};

export default function RootLayout({ children, }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
		<body className={inter.className}>
		<AuthProvider>
			<AIAssistantProvider>
				<div className="min-h-screen bg-white flex flex-col">
					<TopNavigation/>
					<div className="flex flex-1">
						<SideNavigation/>
						<main className="flex-1 overflow-auto">
							{children}
						</main>
					</div>
					<AiAssistantWrapper/>
				</div>
				<Toaster position="top-right"/>
			</AIAssistantProvider>
		</AuthProvider>
		</body>
		</html>
	);
}
