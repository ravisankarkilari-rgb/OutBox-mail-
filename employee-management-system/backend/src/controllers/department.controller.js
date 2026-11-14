const departmentService = require('../services/department.service');
const { sendSuccess } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const departments = await departmentService.getAll();
    return sendSuccess(res, departments, 'Departments fetched');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const dept = await departmentService.getById(req.params.id);
    return sendSuccess(res, dept, 'Department fetched');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const dept = await departmentService.create(req.body);
    return sendSuccess(res, dept, 'Department created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const dept = await departmentService.update(req.params.id, req.body);
    return sendSuccess(res, dept, 'Department updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await departmentService.delete(req.params.id);
    return sendSuccess(res, result, 'Department deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };

