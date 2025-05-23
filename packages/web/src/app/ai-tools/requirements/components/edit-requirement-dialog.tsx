import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditableRequirementCardField } from "../types/requirement.types";

interface EditRequirementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	field: EditableRequirementCardField | null;
	initialValue: string;
	onSave: (value: string) => void;
}

const EditRequirementDialog: React.FC<EditRequirementDialogProps> = ({
	open,
	onOpenChange,
	field,
	initialValue,
	onSave,
}) => {
	const [currentValue, setCurrentValue] = useState(initialValue);

	useEffect(() => {
		setCurrentValue(initialValue);
	}, [initialValue, field]);

	const handleSave = () => {
		if (field) {
			onSave(currentValue);
		}
		onOpenChange(false);
	};

	const getDialogTitle = () => {
		if (!field) return "";
		switch (field) {
			case "name":
				return "编辑功能名称";
			case "module":
				return "编辑所属模块";
			case "description":
				return "编辑功能说明";
			case "assignee":
				return "指定负责人";
			case "deadline":
				return "设置计划排期";
			default:
				return "编辑";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{getDialogTitle()}</DialogTitle>
				</DialogHeader>

				{field === "description" ? (
					<Textarea
						value={currentValue}
						onChange={(e) => setCurrentValue(e.target.value)}
						rows={5}
						className="resize-none"
					/>
				) : (
					<Input
						type={field === "deadline" ? "date" : "text"}
						value={currentValue}
						onChange={(e) => setCurrentValue(e.target.value)}
					/>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						取消
					</Button>
					<Button onClick={handleSave}>保存</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EditRequirementDialog;
