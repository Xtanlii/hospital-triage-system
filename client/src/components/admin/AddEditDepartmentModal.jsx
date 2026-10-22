import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FormInput } from '../common/FormInput';
import { SelectInput } from '../common/SelectInput';

export const AddEditDepartmentModal = ({
  isOpen,
  onClose,
  department = null,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 30,
    availableStaff: 4,
    status: 'Active',
    description: ''
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        capacity: department.capacity || 30,
        availableStaff: department.availableStaff || 4,
        status: department.status || 'Active',
        description: department.description || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        capacity: 30,
        availableStaff: 4,
        status: 'Active',
        description: ''
      });
    }
  }, [department, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={department ? `Edit Department: ${department.name}` : 'Add New Hospital Department'}
      subtitle="Configure clinical department parameters, triage queue limits, and staffing levels."
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
            form="department-form"
            className="px-4 py-1.5 rounded-lg bg-clinical-600 text-white text-xs font-bold hover:bg-clinical-700 transition-colors shadow-xs cursor-pointer"
          >
            {department ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <FormInput
              label="Department Name"
              id="dept-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ophthalmology"
            />
          </div>
          <div>
            <FormInput
              label="Queue Code"
              id="dept-code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. OPHTH"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput
            label="Bed / Queue Capacity"
            id="dept-capacity"
            type="number"
            min="1"
            max="200"
            required
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
          />

          <FormInput
            label="Assigned Staff"
            id="dept-staff"
            type="number"
            min="1"
            max="100"
            required
            value={formData.availableStaff}
            onChange={(e) => setFormData({ ...formData, availableStaff: parseInt(e.target.value) || 0 })}
          />

          <SelectInput
            label="Operational Status"
            id="dept-status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive / Maintenance' }
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Clinical Scope & Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe clinical care stream, intake criteria, or facility notes..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-clinical-500/20 focus:border-clinical-500 bg-white dark:bg-slate-800"
          />
        </div>
      </form>
    </Modal>
  );
};
