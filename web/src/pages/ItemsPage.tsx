import { useParams } from "react-router";

export function ItemsPage() {
  const { collectionId } = useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Items in Collection {collectionId}
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Items management for collection {collectionId} will be implemented
          here.
        </p>
      </div>
    </div>
  );
}
