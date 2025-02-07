
import { Card, CardContent } from "@/components/ui/card";
import { GoalForm } from "./GoalForm";
import { GoalProgress } from "./goal/GoalProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalHeader } from "./goal/GoalHeader";
import { EmptyGoalState } from "./goal/EmptyGoalState";
import { useGoalCard } from "./goal/useGoalCard";

export const GoalCard = ({ isAdmin }: { isAdmin: boolean }) => {
  const {
    goal,
    currentValue,
    isLoading,
    queryError,
    isEditing,
    isCreating,
    setIsEditing,
    setIsCreating,
    updateGoal,
    createGoal,
  } = useGoalCard(isAdmin);

  const handleSave = (formData: any) => {
    if (isCreating) {
      createGoal.mutate(formData);
    } else {
      updateGoal.mutate(formData);
    }
  };

  if (queryError) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            Erro ao carregar o desafio. Por favor, tente novamente mais tarde.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <GoalHeader
        goal={goal}
        isAdmin={isAdmin}
        isEditing={isEditing}
        isCreating={isCreating}
        onEditClick={() => setIsEditing(true)}
      />
      
      <CardContent className="p-4">
        {isEditing || isCreating ? (
          <GoalForm
            initialData={goal}
            onSubmit={handleSave}
            onCancel={() => {
              setIsEditing(false);
              setIsCreating(false);
            }}
            isSubmitting={updateGoal.isPending || createGoal.isPending}
          />
        ) : goal ? (
          <GoalProgress goal={goal} currentValue={currentValue || 0} />
        ) : (
          <EmptyGoalState 
            isAdmin={isAdmin}
            onCreateClick={() => setIsCreating(true)}
          />
        )}
      </CardContent>
    </Card>
  );
};
