type Props = {
  progress: number;
};

export default function UploadProgress({ progress }: Props) {
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm">
        <span>Uploading Model</span>
        <span>{progress}%</span>
      </div>

      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className="h-3 rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
