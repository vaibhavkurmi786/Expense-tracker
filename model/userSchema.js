const mongoose = require('mongoose')
const plm = require('passport-local-mongoose')

    const user = new mongoose.Schema({
        username:{
            type:String,
            required:[true,'Please add a username'],
            unique: true,
            trim:true,
            // minlength:[5, "username must contain atleast 5 characters"],

        },

        email:{
            type: String,
            required: [true,"please enter your email address"],
            // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "please fill valid email address"],
            unique: true
            },

        file:{
            type:String
        },
        password:{
            type:String,
        },
        token: {
            type: Number,
            default: -1,
        },
        date:Date,
        expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "expense" }],
        
    },
    { timestamps: true }
    )

    user.plugin(plm)

    module.exports = mongoose.model('user', user);