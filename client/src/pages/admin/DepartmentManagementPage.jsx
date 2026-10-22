import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AddEditDepartmentModal } from '../../components/admin/AddEditDepartmentModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SearchBar } from '../../components/common/SearchBar';
import { Building2, Plus, Edit2, Trash2, Power, Users, Clock } from 'lucide-react';

export const DepartmentManagementPage = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedDept(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setIsAddEditOpen(true);
  };

  const handleSave = (data) => {
    if (selectedDept) {
      updateDepartment(selectedDept.id, data);
    } else {
      addDepartment(data);
    }
  };

  const handleToggleStatus = (dept) => {
    const nextStatus = dept.status === 'Active' ? 'Inactive' : 'Active';
    updateDepartment(dept.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="text-clinical-600" size={20} />
            <span>Department Management & Capacity Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure hospital clinical units, bed capacities, staffing allocations, and operational statuses.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Filter departments by name or queue code..."
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Current Queue</th>
                <th className="py-3 px-4">Staff on Duty</th>
                <th className="py-3 px-4">Average Wait</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No departments found matching your query.
                  </td>
                </tr>
              ) : (
                filteredDepts.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{dept.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">{dept.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {dept.capacity} beds
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {dept.currentQueueLength} patients
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {dept.availableStaff} clinicians
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {dept.averageWaitTime} min
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(dept)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          dept.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Power size={10} />
                        <span>{dept.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-clinical-700 dark:hover:text-clinical-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(dept)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Department"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddEditDepartmentModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        department={selectedDept}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteDepartment(deleteTarget.id)}
        title="Remove Department"
        message={`Are you sure you want to remove ${deleteTarget?.name}? Active patient queues should be re-routed prior to decommission.`}
        confirmText="Remove Department"
        isDestructive={true}
      />
    </div>
  );
};