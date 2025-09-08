const Users = require('../../../../models/userModel/userModel')

const getAllReporter = async(req,res) =>{

    try {
    // Find users where role is 'Reporter'
    const reporters = await Users.find({ role: 'Reporter' });

    // Send the data to the frontend
    res.status(200).json({ success: true, reporters });
  } catch (error) {
    console.error('Error fetching reporters:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }

}



module.exports = getAllReporter