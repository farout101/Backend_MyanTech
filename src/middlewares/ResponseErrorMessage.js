const { validationResult } = require('express-validator')

const ErrorMessageHandler = (req,res,next) => {
    const result = validationResult(req) 
    if(!result.isEmpty()) {
        return res.status(400).json({ errors : result.mapped() })
    } else {
        next()
    }
}

module.exports = ErrorMessageHandler