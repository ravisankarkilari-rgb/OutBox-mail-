import React from 'react';

export const Table = ({ headers = [], children, emptyMessage = 'No records found' }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 tracking-wider border-y border-slate-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-6 py-3.5 ${h.className || ''}`}>
                {h.label || h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
};
