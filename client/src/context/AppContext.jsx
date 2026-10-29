import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { queueService, normalizeQueueEntry } from '../services/queueService';
import { triageService } from '../services/triageService';
import { patientService } from '../services/patientService';
import { departmentService, DEFAULT_DEPARTMENTS } from '../services/departmentService';
import { userService } from '../services/userService';
import { apiClient, getToken } from '../services/apiClient';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const DEFAULT_TRIAGE_MODEL_STATS = {
  status: 'Active',
  modelVersion: 'v2.5.0-clinical-rf-esi5',
  lastRetrained: '2026-10-01',
  accuracy: 94.2,
  totalPredictions: 1482,
  redPredictions: 284,
  amberPredictions: 596,
  greenPredictions: 602,
  totalOverrides: 78,
  overrideRate: '5.2%',
  overrideBreakdown: [
    { from: 'GREEN', to: 'AMBER', count: 38, commonReason: 'Atypical symptoms / clinician maternal & pediatric instincts' },
    { from: 'AMBER', to: 'RED', count: 26, commonReason: 'Borderline hemodynamics or severe underlying comorbidity' },
    { from: 'RED', to: 'AMBER', count: 11, commonReason: 'Isolated acute pain without hemodynamic compromise' },
    { from: 'AMBER', to: 'GREEN', count: 3, commonReason: 'Patient symptom resolution during observational triage' }
  ]
};

export const AppProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  // State initialization with localStorage caching for offline resilience
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('hospital_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('hospital_departments');
    return saved ? JSON.parse(saved) : DEFAULT_DEPARTMENTS;
  });

  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('hospital_queue');
    return saved ? queueService.sortQueue(JSON.parse(saved)) : [];
  });

  const [assessments, setAssessments] = useState(() => {
    const saved = localStorage.getItem('hospital_assessments');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('hospital_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('hospital_activities');
    return saved ? JSON.parse(saved) : [
      { id: 'act-init', timestamp: 'Just now', message: 'Hospital clinical triage terminal operational', type: 'SYSTEM', badge: 'System' }
    ];
  });

  const [activeDoctorsCount, setActiveDoctorsCount] = useState(() => {
    const savedUsers = localStorage.getItem('hospital_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        return parsed.filter(u => (u.role === 'Doctor' || u.role === 'DOCTOR') && (u.isOnDuty || u.is_on_duty)).length;
      } catch (e) {}
    }
    return 0;
  });

  const [toasts, setToasts] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Network connectivity status and server health heartbeat
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [networkStatus, setNetworkStatus] = useState('checking');
  const prevOnlineRef = useRef(null);

  const checkServerConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setNetworkStatus('offline');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const healthy = res.ok;
      setIsOnline(healthy);
      setNetworkStatus(healthy ? 'online' : 'offline');
      return healthy;
    } catch {
      setIsOnline(false);
      setNetworkStatus('offline');
      return false;
    }
  }, []);

  // Fetch live hospital data from Express API
  const refreshAllData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const user = currentUser || JSON.parse(localStorage.getItem('hospital_current_user') || 'null');
    const roleUpper = String(user?.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN';

    try {
      const promises = [
        departmentService.getDepartments(),
        patientService.getPatients(),
        queueService.getQueue()
      ];

      // If authenticated, fetch live active doctors count from public endpoint /api/doctor/active
      if (token) {
        promises.push(apiClient.get('/doctor/active'));
      }

      // Only Admin has clearance for /api/users and /api/admin/assessments (avoids 403 Forbidden)
      if (isAdmin) {
        promises.push(userService.getUsers());
        promises.push(triageService.getAssessments());
      }

      const results = await Promise.allSettled(promises);
      const deptRes = results[0];
      const patRes = results[1];
      const queueRes = results[2];

      if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value) && deptRes.value.length > 0) {
        setDepartments(deptRes.value);
      }
      if (patRes.status === 'fulfilled' && Array.isArray(patRes.value) && patRes.value.length > 0) {
        setPatients(patRes.value);
      }
      if (queueRes.status === 'fulfilled' && Array.isArray(queueRes.value)) {
        setQueue(queueService.sortQueue(queueRes.value));
      }

      let nextIndex = 3;
      if (token) {
        const docActiveRes = results[nextIndex++];
        if (docActiveRes?.status === 'fulfilled' && docActiveRes.value?.data) {
          const count = docActiveRes.value.data.data?.activeCount ?? docActiveRes.value.data.activeCount;
          if (typeof count === 'number') {
            setActiveDoctorsCount(count);
          }
        }
      }

      if (isAdmin) {
        const userRes = results[nextIndex++];
        const assessRes = results[nextIndex++];
        if (userRes?.status === 'fulfilled' && Array.isArray(userRes.value) && userRes.value.length > 0) {
          setUsers(userRes.value);
          const activeDocs = userRes.value.filter(u => (u.role === 'Doctor' || u.role === 'DOCTOR') && (u.isOnDuty || u.is_on_duty)).length;
          setActiveDoctorsCount(prev => prev > 0 ? prev : activeDocs);
        }
        if (assessRes?.status === 'fulfilled' && Array.isArray(assessRes.value)) {
          setAssessments(assessRes.value);
        }
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Initial data synchronization warning:', err.message);
    }
  }, [currentUser]);

  // Synchronize data immediately when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  useEffect(() => {
    const handleOnline = () => {
      checkServerConnection();
      refreshAllData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & data load
    checkServerConnection();
    refreshAllData();

    // Heartbeat check every 25 seconds
    const heartbeat = setInterval(checkServerConnection, 25000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeat);
    };
  }, [checkServerConnection, refreshAllData]);

  // Persist state to localStorage for offline cache continuity
  useEffect(() => {
    localStorage.setItem('hospital_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('hospital_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('hospital_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('hospital_assessments', JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem('hospital_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hospital_activities', JSON.stringify(activities));
  }, [activities]);

  // Toast dispatch
  const showToast = useCallback((title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // System activity logging helper
  const logActivity = useCallback((message, type, badge) => {
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      message,
      type,
      badge
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 24)]);
  }, []);

  // Alert on network state transition
  useEffect(() => {
    if (prevOnlineRef.current !== null && prevOnlineRef.current !== isOnline) {
      if (isOnline) {
        showToast('System Online', 'Connected to hospital services. Local cache is synced.', 'success');
        logActivity('System reconnected to hospital network', 'SYSTEM', 'System');
      } else {
        showToast('Offline Mode Active', 'Operating with local offline cache. Changes will persist.', 'warning');
        logActivity('System operating in offline mode with cached storage', 'SYSTEM', 'System');
      }
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, showToast, logActivity]);

  // Periodic simulation: updates waiting minutes slightly every 45s
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prevQueue => {
        const updated = prevQueue.map(item => {
          if (item.status === 'Waiting' || item.status === 'Called') {
            return { ...item, waitingMinutes: (item.waitingMinutes || 0) + 1 };
          }
          return item;
        });
        return queueService.sortQueue(updated);
      });
      setLastSyncTime(new Date());
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // 1. Patient Registration
  const registerPatient = async (patientData) => {
    const newPatient = await patientService.registerPatient(patientData);
    setPatients(prev => [newPatient, ...prev.filter(p => p.id !== newPatient.id)]);
    logActivity(`New patient intake registered: ${newPatient.name}`, 'INTAKE', 'Intake');
    showToast('Patient Registered', `${newPatient.name} has been registered successfully.`, 'success');
    return newPatient;
  };

  // 2. Perform Triage Assessment & Dispatch to Priority Queue
  const completeTriageAssessment = async (assessmentData) => {
    const result = await triageService.createAssessment(assessmentData);
    const newAssessment = result.assessment || result;
    setAssessments(prev => [newAssessment, ...prev.filter(a => a.id !== newAssessment.id)]);

    const dept = departments.find(d => d.id === assessmentData.departmentId) || departments[0];

    // Priority queue entry from backend database or normalized local object
    let newQueueEntry;
    if (result.queueEntry) {
      const fullEntry = {
        ...result.queueEntry,
        patient: result.patient || {
          patient_id: assessmentData.patient_id || assessmentData.patientId,
          full_name: assessmentData.patientName,
          first_name: assessmentData.patientName,
          gender: assessmentData.patientGender
        },
        patientName: assessmentData.patientName || `${result.patient?.first_name || ''} ${result.patient?.last_name || ''}`.trim(),
        patientAge: assessmentData.patientAge || result.patient?.age,
        patientGender: assessmentData.patientGender || result.patient?.gender,
        chiefComplaint: assessmentData.chiefComplaint || 'Triage Intake',
        department: result.queueEntry.department || dept?.name,
        departmentName: result.queueEntry.department || dept?.name
      };
      newQueueEntry = normalizeQueueEntry(fullEntry);
    } else {
      const queueNum = queueService.generateQueueNumber(dept?.code || 'GEN', queue);
      newQueueEntry = {
        id: `q-${Date.now()}`,
        queue_id: `q-${Date.now()}`,
        queueNumber: queueNum,
        patientId: assessmentData.patient_id || assessmentData.patientId,
        patient_id: assessmentData.patient_id || assessmentData.patientId,
        patientName: assessmentData.patientName,
        patientAge: assessmentData.patientAge,
        patientGender: assessmentData.patientGender,
        departmentId: dept.id,
        departmentName: dept.name,
        triageLevel: assessmentData.finalTriageLevel,
        chiefComplaint: assessmentData.chiefComplaint,
        status: 'Waiting',
        checkInTime: new Date().toISOString(),
        queued_at: new Date().toISOString(),
        waitingMinutes: 0,
        assignedDoctor: 'Unassigned',
        assessmentId: newAssessment.id
      };
    }

    setQueue(prev => queueService.sortQueue([newQueueEntry, ...prev.filter(q => q.id !== newQueueEntry.id)]));

    // Increment department queue count
    setDepartments(prev => prev.map(d => 
      d.id === dept.id ? { ...d, currentQueueLength: (d.currentQueueLength || 0) + 1 } : d
    ));

    const isRed = String(assessmentData.finalTriageLevel).toUpperCase().includes('1') || 
                  String(assessmentData.finalTriageLevel).toUpperCase().includes('RED') || 
                  String(assessmentData.finalTriageLevel).toUpperCase().includes('IMMEDIATE');
    const queueNum = newQueueEntry.queueNumber || 'Q-NEW';

    logActivity(
      `Nurse ${assessmentData.nurseName} completed triage for ${assessmentData.patientName} (${assessmentData.finalTriageLevel} · ${dept.name}, #${queueNum})${assessmentData.override ? ' [AI Overridden]' : ''}`,
      assessmentData.override ? 'OVERRIDE' : 'TRIAGE',
      'Nurse'
    );

    showToast(
      isRed ? 'CRITICAL PATIENT QUEUED' : 'Triage Completed',
      `${assessmentData.patientName} added to ${dept.name} queue with #${queueNum} (${assessmentData.finalTriageLevel}).`,
      isRed ? 'error' : 'success'
    );

    return { assessment: newAssessment, queueEntry: newQueueEntry };
  };

  // 3. Queue Lifecycle Actions
  const updateQueueStatus = async (queueId, newStatus, doctorName = null) => {
    let updatedPatientName = '';
    let updatedDeptId = '';
    let oldStatus = '';

    setQueue(prev => {
      const updated = prev.map(item => {
        if (item.id === queueId || item.queue_id === queueId) {
          updatedPatientName = item.patientName;
          updatedDeptId = item.departmentId;
          oldStatus = item.status;
          return {
            ...item,
            status: newStatus,
            assignedDoctor: doctorName || item.assignedDoctor
          };
        }
        return item;
      });
      return queueService.sortQueue(updated);
    });

    // Send status update to Express API
    try {
      if (newStatus === 'Called') {
        await queueService.attendPatient(queueId);
      } else if (newStatus === 'Cancelled') {
        await queueService.cancelPatient(queueId);
      } else {
        await queueService.updateStatus(queueId, newStatus);
      }
    } catch (err) {
      console.warn(`API updateQueueStatus(${queueId}, ${newStatus}) warning:`, err.message);
    }

    // If completed or cancelled, adjust department queue length
    if ((newStatus === 'Completed' || newStatus === 'Cancelled') && oldStatus !== 'Completed') {
      setDepartments(prev => prev.map(d => 
        d.id === updatedDeptId ? { ...d, currentQueueLength: Math.max(0, d.currentQueueLength - 1) } : d
      ));
    }

    logActivity(
      `Queue status for ${updatedPatientName} updated to "${newStatus}"${doctorName ? ` by ${doctorName}` : ''}`,
      newStatus === 'Completed' ? 'COMPLETE' : 'STATUS',
      'Doctor'
    );

    showToast('Queue Updated', `${updatedPatientName} is now marked as "${newStatus}".`, 'info');
  };

  const callPatient = (queueId, doctorName = 'Attending Physician') => {
    updateQueueStatus(queueId, 'Called', doctorName);
  };

  const markPatientSeen = (queueId, doctorName = 'Attending Physician') => {
    updateQueueStatus(queueId, 'Completed', doctorName);
  };

  // 4. Department Management (CRUD)
  const addDepartment = async (deptData) => {
    const newDept = await departmentService.addDepartment(deptData);
    setDepartments(prev => [...prev, newDept]);
    logActivity(`Department created: ${newDept.name} (${newDept.code})`, 'ADMIN', 'Admin');
    showToast('Department Added', `${newDept.name} has been configured.`, 'success');
  };

  const updateDepartment = async (id, fields) => {
    await departmentService.updateDepartment(id, fields);
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...fields } : d));
    logActivity(`Department ${id} configuration updated`, 'ADMIN', 'Admin');
    showToast('Department Updated', 'Department settings updated successfully.', 'success');
  };

  const deleteDepartment = async (id) => {
    const target = departments.find(d => d.id === id);
    await departmentService.deleteDepartment(id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    logActivity(`Department removed: ${target?.name || id}`, 'ADMIN', 'Admin');
    showToast('Department Removed', `${target?.name || 'Department'} has been removed.`, 'info');
  };

  // 5. User Management (CRUD)
  const addUser = async (userData) => {
    const newUser = await userService.addUser(userData);
    setUsers(prev => [...prev, newUser]);
    logActivity(`Staff account registered: ${newUser.name} (${newUser.role})`, 'ADMIN', 'Admin');
    showToast('Staff Member Added', `Account created for ${newUser.name}.`, 'success');
  };

  const updateUser = async (id, fields) => {
    await userService.updateUser(id, fields);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...fields } : u));
    logActivity(`Staff account updated: ${id}`, 'ADMIN', 'Admin');
    showToast('User Updated', 'User profile details updated.', 'success');
  };

  const toggleUserStatus = (id) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        logActivity(`Staff member ${u.name} status set to ${nextStatus}`, 'ADMIN', 'Admin');
        showToast('Status Toggled', `${u.name} is now ${nextStatus}.`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const toggleDoctorDutyStatus = async (id) => {
    const isCurrentlyOnDuty = currentUser?.isOnDuty !== false;
    const optimisticNextDuty = !isCurrentlyOnDuty;
    let nextDuty = optimisticNextDuty;

    // Optimistically update activeDoctorsCount immediately for instant UI responsiveness
    setActiveDoctorsCount(prev => Math.max(0, prev + (isCurrentlyOnDuty ? -1 : 1)));

    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, isOnDuty: nextDuty, is_on_duty: nextDuty, status: nextDuty ? 'Active' : 'Off Duty' };
      }
      return u;
    }));

    try {
      const res = await apiClient.patch('/doctor/duty-status');
      const count = res?.data?.activeDoctorsCount ?? res?.data?.data?.activeDoctorsCount;
      if (typeof count === 'number') {
        setActiveDoctorsCount(count);
      } else {
        const activeRes = await apiClient.get('/doctor/active');
        const activeCount = activeRes?.data?.activeCount ?? activeRes?.data?.data?.activeCount;
        if (typeof activeCount === 'number') {
          setActiveDoctorsCount(activeCount);
        }
      }
      if (res?.data?.doctor?.is_on_duty !== undefined) {
        nextDuty = res.data.doctor.is_on_duty;
      }
    } catch (err) {
      console.warn('API doctor duty-status toggle warning:', err.message);
    }

    logActivity(`Doctor shift status updated: ${nextDuty ? 'On Duty' : 'Off Duty'}`, 'DOCTOR', 'Doctor');
    showToast('Shift Status Updated', `Shift status changed to ${nextDuty ? 'ON DUTY' : 'OFF DUTY'}.`, nextDuty ? 'success' : 'info');
    return nextDuty;
  };

  // Reset local offline cache and re-synchronize with live database
  const resetDemoData = async () => {
    localStorage.removeItem('hospital_patients');
    localStorage.removeItem('hospital_departments');
    localStorage.removeItem('hospital_queue');
    localStorage.removeItem('hospital_assessments');
    localStorage.removeItem('hospital_users');
    localStorage.removeItem('hospital_activities');
    await refreshAllData();
    showToast('Cache Refreshed', 'Hospital terminal re-synchronized with server database.', 'success');
  };

  // Stats computation
  const stats = queueService.calculateStats(queue);

  return (
    <AppContext.Provider value={{
      patients,
      departments,
      queue,
      assessments,
      users,
      activities,
      stats,
      activeDoctorsCount,
      isOnline,
      networkStatus,
      checkServerConnection,
      toasts,
      lastSyncTime,
      triageModelStats: DEFAULT_TRIAGE_MODEL_STATS,
      registerPatient,
      completeTriageAssessment,
      updateQueueStatus,
      callPatient,
      markPatientSeen,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addUser,
      updateUser,
      toggleUserStatus,
      toggleDoctorDutyStatus,
      showToast,
      removeToast,
      resetDemoData,
      refreshAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
