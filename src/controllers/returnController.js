const pool = require("../../config/db");

const getAllReturns = (req,res) => {
    return res.json({message : "From return route"})
}

module.exports = {
    getAllReturns
  };
  