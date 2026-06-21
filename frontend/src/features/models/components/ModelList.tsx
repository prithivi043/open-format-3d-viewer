import { useModels } from "../hooks/useModels";

type Props = {
  projectId: string;
};

export default function ModelList({ projectId }: Props) {
  const { data: models = [], isLoading } = useModels(projectId);

  if (isLoading) return <div>Loading models...</div>;

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <div
          key={model.id}
          className="rounded-lg border p-4 flex justify-between"
        >
          <div>
            <p className="font-medium">{model.name}</p>
            <p className="text-sm text-gray-500">{model.format}</p>
          </div>

          <div className="text-sm">{model.status}</div>
        </div>
      ))}
    </div>
  );
}
