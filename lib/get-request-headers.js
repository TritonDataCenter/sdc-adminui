module.exports = function(req) {
    return { 'x-request-id': req.id() };
};
