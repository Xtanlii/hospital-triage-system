import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AddEditUserModal } from '../../components/admin/AddEditUserModal';
import { SearchBar } from '../../components/common/SearchBar';
import { Users, Plus, Edit2, Shield, KeyRound, Power, Mail } from 'lucide-react';

export const UserManagementPage = () => {
  const { users, addUser, updateUser, toggleUserStatus, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(user => {
    const matchesTab = activeTab === 'ALL' || user.role.toUpperCase() === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.departmentName && user.departmentName.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsAddEditOpen(true);
  };

  const handleSave = (userData) => {
    if (selectedUser) {
      updateUser(selectedUser.id, userData);
    } else {
      addUser(userData);
    }
  };

  const handleResetPassword = (user) => {
    showToast('Password Reset Dispatched', `Temporary credentials sent to ${user.email}.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="text-clinical-600" size={20} />
            <span>Hospital Staff & User Account Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provision clinical access credentials, role-based authorizations, and department staff rosters.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clinical-600 hover:bg-clinical-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Provision Staff Member</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold w-full sm:w-auto">
          {['ALL', 'NURSE', 'DOCTOR', 'ADMIN'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all text-xs font-bold cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Personnel' : `${tab.charAt(0) + tab.slice(1).toLowerCase()}s`}
            </button>
          ))}
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search personnel by name, email, or department..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Hospital Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No staff records match the active criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Mail size={11} />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        user.role === 'Doctor' 
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                          : user.role === 'Nurse'
                            ? 'bg-clinical-50 dark:bg-clinical-950/50 text-clinical-700 dark:text-clinical-400 border-clinical-200 dark:border-clinical-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}>
                        <Shield size={10} />
                        <span>{user.role}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {user.departmentName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {user.lastActive}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Power size={10} />
                        <span>{user.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleResetPassword(user)}
                          title="Reset Password"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <KeyRound size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User Profile"
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-clinical-700 dark:hover:text-clinical-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
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
      <AddEditUserModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        user={selectedUser}
        onSave={handleSave}
      />
    </div>
  );
};
