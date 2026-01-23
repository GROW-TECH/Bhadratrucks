import { useEffect, useState } from 'react';

interface PaymentScreenshotPageProps {
  onBack: () => void;
}

const PaymentScreenshotPage: React.FC<PaymentScreenshotPageProps> = ({ onBack }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('https://projects.growtechnologies.in/bhadra/api/fetchFiles.php');
        const data = await response.json();

        // Extract just the filename from the full server path and sanitize
        const sanitizedFiles = data.files.map((file: any) => {
          const fileName = file.file_path.split('/').pop() || file.file_name; // Fallback to file_name if needed
          return {
            ...file,
            display_name: file.file_name,
            url_path: encodeURIComponent(file.file_name), // Properly encode spaces as %20
          };
        });

        setFiles(sanitizedFiles);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) return <div>Loading...</div>;

  const baseUrl = 'https://projects.growtechnologies.in/bhadra/uploads/';
const handleApprove = async (fileId: number) => {
  try {
    const res = await fetch(
      'https://projects.growtechnologies.in/bhadra/api/approveFile.php',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, approval_status: 1 } : f
        )
      );
    } else {
      alert('Approval failed');
    }
  } catch (e) {
    alert('Server error');
  }
};

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Uploaded Payment Screenshots</h2>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mb-4"
      >
        Back to Dashboard
      </button>
      {files.length === 0 ? (
        <p>No files available.</p>
      ) : (
        <div className="overflow-x-auto">
<table className="w-full border-collapse">
           <thead className="bg-slate-100">
  <tr>
    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-[35%]">
      File Name
    </th>
    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 w-[10%]">
      Size
    </th>
    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-[20%]">
      Uploaded At
    </th>
    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-[20%]">
      Uploaded By
    </th>
    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 w-[15%]">
      Action
    </th>
  </tr>
</thead>

          <tbody className="divide-y divide-slate-200">
  {files
    .filter((file) => file.membership_type === 'elite')
    .map((file) => (

    <tr key={file.id} className="hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-900 break-all">
        {file.display_name}
      </td>

      <td className="px-4 py-3 text-sm text-slate-600 text-right">
        {file.file_size} KB
      </td>

      <td className="px-4 py-3 text-sm text-slate-600">
        {new Date(file.uploaded_at).toLocaleString()}
      </td>

      <td className="px-4 py-3 text-sm text-slate-900">
        {file.user_name ?? 'Unknown'}
      </td>

     <td className="px-4 py-3 text-center space-x-3">
  <a
    href={`${baseUrl}${file.url_path}`}
    target="_blank"
    className="text-blue-600 hover:text-blue-800 font-medium"
  >
    View
  </a>

  <button
    disabled={file.approval_status === 1}
    onClick={() => handleApprove(file.id)}
    className={`px-3 py-1 text-xs font-medium rounded text-white
      ${file.approval_status === 1
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700'}
    `}
  >
    {file.approval_status === 1 ? 'Approved' : 'Approve'}
  </button>
</td>

    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentScreenshotPage;
