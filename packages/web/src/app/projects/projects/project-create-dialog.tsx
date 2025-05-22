"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast";

const projectFormSchema = z.object({
  name: z.string().min(2, "项目名称至少需要2个字符"),
  description: z.string().optional(),
  gitUrl: z.string().url("请输入有效的Git URL").or(z.literal("")),
  liveUrl: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  jiraUrl: z.string().url("请输入有效的Jira URL").optional().or(z.literal("")),
  jenkinsUrl: z.string().url("请输入有效的Jenkins URL").optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (project: any) => void
}

export function ProjectCreateDialog({ open, onOpenChange, onSuccess }: ProjectCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      gitUrl: "",
      liveUrl: "",
      jiraUrl: "",
      jenkinsUrl: "",
      isDefault: false,
    },
  })

  async function onSubmit(values: ProjectFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "项目创建成功",
          description: `项目 "${values.name}" 已成功创建`,
        })
        form.reset()
        onSuccess(data.project)
      } else {
        toast({
          title: "项目创建失败",
          description: data.error || "创建项目时出现问题",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "创建失败",
        description: "创建项目时发生错误",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            填写以下信息创建一个新项目。您可以稍后编辑这些信息。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目名称*</FormLabel>
                  <FormControl>
                    <Input placeholder="输入项目名称" {...field} />
                  </FormControl>
                  <FormDescription>
                    给您的项目取一个能够清晰描述其目的的名称
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述您的项目是做什么的..."
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gitUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Git 仓库地址</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/username/repo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="liveUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>线上地址</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourproject.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jiraUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira 地址</FormLabel>
                    <FormControl>
                      <Input placeholder="https://jira.company.com/browse/PROJ" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jenkinsUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenkins 地址</FormLabel>
                  <FormControl>
                    <Input placeholder="https://jenkins.company.com/job/project" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>设为默认项目</FormLabel>
                    <FormDescription>
                      将此项目设为您的默认项目，在进入系统时自动选择此项目
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "创建中..." : "创建项目"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
