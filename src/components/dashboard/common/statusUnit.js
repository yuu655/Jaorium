export default function StatusUnit({ name, icon, length, unit }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{name}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold">{length}</p>
      <p className="text-sm text-gray-500 mt-1">{unit}</p>
    </div>
  );
}
