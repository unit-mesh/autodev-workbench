import { useState } from "react";
import { RequirementCard, EditableRequirementCardField } from "../../../types/requirement.types";

interface UseRequirementCardActionsProps {
  requirementCard: RequirementCard | null;
  setRequirementCard: (card: RequirementCard | null) => void;
  resetConversation: () => void;
}

export function useRequirementCard({
  requirementCard,
  setRequirementCard,
  resetConversation,
}: UseRequirementCardActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editField, setEditField] = useState<EditableRequirementCardField>("name");
  const [currentEditValue, setCurrentEditValue] = useState("");

  const handleEditRequirement = (field: EditableRequirementCardField) => {
    if (!requirementCard) return;

    setEditField(field);
    setCurrentEditValue(requirementCard[field] as string);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (value: string) => {
    if (!requirementCard) return;

    const updatedCard = {
      ...requirementCard,
      [editField]: value,
    };

    setRequirementCard(updatedCard);
    setEditDialogOpen(false);
  };

  const handleSaveAsDraft = () => {
    if (!requirementCard) return;

    const draftCard = {
      ...requirementCard,
      status: "draft" as const,
    };

    setRequirementCard(draftCard);
  };

  const handleGenerateTask = () => {
    if (!requirementCard) return;
    const approvedCard = {
      ...requirementCard,
      status: "approved" as const,
    };

    setRequirementCard(approvedCard);
    setTimeout(() => {
      resetConversation();
    }, 2000);
  };

  return {
    editDialogOpen,
    setEditDialogOpen,
    editField,
    currentEditValue,
    handleEditRequirement,
    handleSaveEdit,
    handleSaveAsDraft,
    handleGenerateTask,
  };
}
