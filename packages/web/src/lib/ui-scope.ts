import * as React from 'react'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, } from "@/components/ui/card"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
} from "@/components/ui/carousel"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
} from "@/components/ui/command"
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuCheckboxItem,
	ContextMenuRadioItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuGroup,
	ContextMenuPortal,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuRadioGroup,
} from "@/components/ui/context-menu"
import {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogTrigger,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
} from "@/components/ui/drawer"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu"
import {
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
} from "@/components/ui/form"
import { HoverCard, HoverCardTrigger, HoverCardContent, } from "@/components/ui/hover-card"
// input.tsx
import { Input } from "@/components/ui/input"
// input-otp.tsx
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import {
	Menubar,
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarLabel,
	MenubarCheckboxItem,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarPortal,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarGroup,
	MenubarSub,
	MenubarShortcut,
} from "@/components/ui/menubar"
// navigation-menu.tsx
import {
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuContent,
	NavigationMenuTrigger,
	NavigationMenuLink,
	NavigationMenuIndicator,
	NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
// pagination.tsx
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
// popover.tsx
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover"
// progress.tsx
import { Progress } from "@/components/ui/progress"
// radio-group.tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// scroll-area.tsx
import { ScrollArea } from "@/components/ui/scroll-area"
// select.tsx
import {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
} from "@/components/ui/select"
// separator.tsx
import { Separator } from "@/components/ui/separator"
// sheet.tsx
import {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet"
// skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
// slider.tsx
import { Slider } from "@/components/ui/slider"
// switch.tsx
import { Switch } from "@/components/ui/switch"
// table.tsx
import {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
} from "@/components/ui/table"
// tabs.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
// textarea.tsx
import { Textarea } from "@/components/ui/textarea"
// toggle.tsx
import { Toggle } from "@/components/ui/toggle"
// toggle-group.tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
// tooltip.tsx
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip"

// Additional common icons and utilities
import { Send, Code, Loader2, CodeXml } from 'lucide-react'

/**
 * UI Scope for React Live Preview
 * Contains all shadcn/ui components and common utilities
 * that can be used in the live code editor
 */
export const uiScope = {
	// Layout & Navigation
	Accordion, AccordionItem, AccordionTrigger, AccordionContent,
	Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
	NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink,
	NavigationMenuIndicator, NavigationMenuViewport,
	Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarCheckboxItem,
	MenubarRadioGroup, MenubarRadioItem, MenubarPortal, MenubarSubContent, MenubarSubTrigger, MenubarGroup, MenubarSub, MenubarShortcut,

	// Content & Display
	Alert, AlertTitle, AlertDescription,
	AspectRatio,
	Avatar, AvatarImage, AvatarFallback,
	Badge,
	Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
	Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
	Collapsible, CollapsibleTrigger, CollapsibleContent,
	Progress,
	ScrollArea,
	Separator,
	Skeleton,
	Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,
	Tabs, TabsList, TabsTrigger, TabsContent,

	// Forms & Input
	Button,
	Calendar,
	Checkbox,
	Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField,
	Input,
	InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
	Label,
	RadioGroup, RadioGroupItem,
	Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator,
	SelectScrollUpButton, SelectScrollDownButton,
	Slider,
	Switch,
	Textarea,
	Toggle,
	ToggleGroup, ToggleGroupItem,

	// Overlays & Modals
	AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger,
	AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
	AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
	Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
	ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem,
	ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub,
	ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup,
	Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
	Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription,
	DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem,
	DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub,
	DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup,
	HoverCard, HoverCardTrigger, HoverCardContent,
	Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
	Popover, PopoverTrigger, PopoverContent,
	Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
	Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,

	// Icons & Utilities
	Send, Code, Loader2, CodeXml,

	// React utilities
	React,
}

export default uiScope
