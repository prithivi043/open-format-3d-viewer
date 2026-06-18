import { useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Project Detail</h1>
      <p>Project ID: {id}</p>
    </div>
  );
}