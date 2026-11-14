const employeeService = require('../services/employee.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { employees, pagination } = await employeeService.getAll(req.query);
    return sendPaginated(res, employees, pagination, 'Employees fetched');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    return sendSuccess(res, employee, 'Employee fetched');
  } catch (err) { next(err); }
};

const getMyProfile = async (req, res, next) => {
  try {
    const employee = await employeeService.getByUserId(req.user.id);
    return sendSuccess(res, employee, 'Profile fetched');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const employee = await employeeService.create(req.body);
    return sendSuccess(res, employee, 'Employee created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body);
    return sendSuccess(res, employee, 'Employee updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await employeeService.delete(req.params.id);
    return sendSuccess(res, result, 'Employee deleted');
  } catch (err) { next(err); }
};

const selfUpdate = async (req, res, next) => {
  try {
    const employee = await employeeService.selfUpdate(req.user.id, req.body);
    return sendSuccess(res, employee, 'Profile updated');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getMyProfile, create, update, remove, selfUpdate };

