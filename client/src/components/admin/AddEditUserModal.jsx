import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FormInput } from '../common/FormInput';
import { SelectInput } from '../common/SelectInput';
import { useApp } from '../../context/AppContext';

export const AddEditUserModal = ({
  isOpen,
  onClose,
  user = null,
  onSave
}) => {
  const { departments } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Nurse',
    departmentId: '',
    status: 'Active'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'Nurse',
        departmentId: user.departmentId || departments[0]?.id || '',
        status: user.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Nurse',
        departmentId: departments[0]?.id || '',
        status: 'Active'
      });
    }
  }, [user, departments, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const matchedDept = departments.find(d => d.id === formData.departmentId);
    onSave({
      ...formData,
      departmentName: matchedDept?.name || 'General'
    });
    onClose();
  };

  const departmentOptions = departments.map(d => ({
    value: d.id,
    label: `${d.name} (${d.code})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? `Edit Staff Member: ${user.name}` : 'Add New Hospital Staff'}
      subtitle="Provision access credentials, clinical roles, and primary department assignments."
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="px-4 py-1.5 rounded-lg bg-clinical-600 text-white text-xs font-bold hover:bg-clinical-700 transition-colors shadow-xs cursor-pointer"
          >
            {user ? 'Save Changes' : 'Provision User'}
          </button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Full Name & Title"
          id="user-name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Dr. Kelechi Amadi or Nurse Folake Ade"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            label="Hospital Email"
            id="user-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="staff@hospital.ng"
          />

          <FormInput
            label="Phone Contact"
            id="user-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+234 800 000 0000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectInput
            label="Role"
            id="user-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'Nurse', label: 'Nurse (Triage)' },
              { value: 'Doctor', label: 'Doctor (Physician)' },
              { value: 'Admin', label: 'System Admin' }
            ]}
          />

          <div className="sm:col-span-2">
            <SelectInput
              label="Assigned Department"
              id="user-dept"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={departmentOptions}
            />
          </div>
        </div>

        <SelectInput
          label="Account Status"
          id="user-status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'Active', label: 'Active (Permitted login)' },
            { value: 'Inactive', label: 'Inactive (Access suspended)' }
          ]}
        />
      </form>
    </Modal>
  );
};
