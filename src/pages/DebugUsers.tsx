import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const DebugUsers = () => {
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const audit = async () => {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const s: any = {};
      const u: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.statusAcesso || 'MISSING';
        s[status] = (s[status] || 0) + 1;
        u.push({ id: doc.id, email: data.email, status: data.statusAcesso });
      });
      setStats(s);
      setUsers(u);
    };
    audit();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">User Status Audit</h1>
        <pre className="bg-gray-100 p-4 rounded mb-8">{JSON.stringify(stats, null, 2)}</pre>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Email</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
};

export default DebugUsers;
