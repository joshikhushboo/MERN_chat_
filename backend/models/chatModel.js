const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const messageSchema = new mongoose.Schema({
    Sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
  content: {
        type: String,
        required: true,
        
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    
    timestamps: true,
});

//hash user`s password before saving to database

const Message = mongoose.model('Message', userSchema);
module.exports = Message;