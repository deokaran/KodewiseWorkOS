import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StageProgress({ workItem }: { workItem: any }) {
  const totalStages = workItem.stages.length;
  const completedStages = workItem.stages.filter((s: any) => s.status === 'COMPLETED' || s.status === 'SKIPPED').length;
  const percent = totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100);
  const remaining = totalStages - completedStages;
  
  const estimatedRemaining = workItem.stages
    .filter((s: any) => s.status !== 'COMPLETED' && s.status !== 'SKIPPED' && s.status !== 'CANCELLED')
    .reduce((acc: number, s: any) => acc + (s.stageTemplate.estimatedDurationMins || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-900">{percent}% Complete</span>
            <span className="text-gray-500">{completedStages} of {totalStages} stages</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <h4 className="text-xs text-gray-500 mb-1">Remaining Stages</h4>
            <p className="text-lg font-semibold text-gray-900">{remaining}</p>
          </div>
          <div>
            <h4 className="text-xs text-gray-500 mb-1">Est. Time Remaining</h4>
            <p className="text-lg font-semibold text-gray-900">{estimatedRemaining} mins</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
