import { useState } from "react";
import { RequirementCard, EditableRequirementCardField } from "../types/requirement.types";

interface UseRequirementCardActionsProps {
  requirementCard: RequirementCard | null;
  setRequirementCard: (card: RequirementCard | null) => void;
  resetConversation: () => void;
}

export function useRequirementCardActions({
  requirementCard,
  setRequirementCard,
  resetConversation,
}: UseRequirementCardActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editField, setEditField] = useState<EditableRequirementCardField | null>(null);
  const [currentEditValue, setCurrentEditValue] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  const handleEditRequirement = (field: EditableRequirementCardField) => {
    if (!requirementCard) return;
    let initialValue = "";
    switch (field) {
      case "name":
        initialValue = requirementCard.name;
        break;
      case "module":
        initialValue = requirementCard.module;
        break;
      case "description":
        initialValue = requirementCard.description;
        break;
      case "assignee":
        initialValue = requirementCard.assignee;
        break;
      case "deadline":
        initialValue = requirementCard.deadline;
        break;
    }

    setEditField(field);
    setCurrentEditValue(initialValue);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (newValue: string) => {
    if (!editField || !requirementCard) return;

    const updatedCard = { ...requirementCard };
    // The type assertion here is safe because editField is now EditableRequirementCardField,
    // all of which are keys of RequirementCard that hold string values.
    (updatedCard[editField] as string) = newValue;
    setRequirementCard(updatedCard);

    setEditDialogOpen(false);
    setEditField(null);
    setCurrentEditValue("");
  };

  const handleSaveAsDraft = () => {
    if (requirementCard) {
      setHasDraft(true);
      // Potentially save to local storage or backend here
    }
  };

  const handleGenerateTask = () => {
    // Handle task generation
    // This might involve API calls in a real scenario
    setTimeout(() => {
      resetConversation();
      setHasDraft(false); // Reset draft status after generating task
    }, 2000);
  };

  return {
    editDialogOpen,
    setEditDialogOpen,
    editField,
    currentEditValue,
    hasDraft,
    handleEditRequirement,
    handleSaveEdit,
    handleSaveAsDraft,
    handleGenerateTask,
  };
}
