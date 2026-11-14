const evaluationService = require('../services/evaluation.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { evaluations, pagination } = await evaluationService.getAll(req.query);
    return sendPaginated(res, evaluations, pagination, 'Evaluations fetched');
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const eval_ = await evaluationService.getById(req.params.id);
    return sendSuccess(res, eval_, 'Evaluation fetched');
  } catch (err) { next(err); }
};

const getByEmployee = async (req, res, next) => {
  try {
    const evals = await evaluationService.getByEmployeeId(req.params.employeeId);
    return sendSuccess(res, evals, 'Evaluations fetched');
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await evaluationService.getStats(req.params.employeeId);
    return sendSuccess(res, stats, 'Evaluation stats fetched');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const eval_ = await evaluationService.create(req.body);
    return sendSuccess(res, eval_, 'Evaluation created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const eval_ = await evaluationService.update(req.params.id, req.body);
    return sendSuccess(res, eval_, 'Evaluation updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await evaluationService.delete(req.params.id);
    return sendSuccess(res, result, 'Evaluation deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, getByEmployee, getStats, create, update, remove };

