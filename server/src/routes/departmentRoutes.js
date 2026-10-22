const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Base path: /api/departments
router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
