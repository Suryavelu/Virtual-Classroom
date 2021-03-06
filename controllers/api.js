const db = require("../modals/schema")
//const session = require('express-session');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('../client_secret.json');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
var sess;


const login = (req, res) => {
    sess = req.session;
    console.log(req.body)
    const user = db.User;
    user.find({ email: req.body.username, password: req.body.password }, function (err, docs) {
        if (err) throw err
        console.log(docs)
        if (docs.length === 0) {
            return res.json({ success: false })
        }
        else {
            sess.email = docs[0]["email"]
            //console.log(typeof(docs[0]["id"]))
            //sess.uniqueid=docs[0]["id"]
            sess.username = docs[0]["username"]
            //console.log(sess)
            if (docs[0]["teacher"]) {
                return res.json({ success: true, teacher: true, student: false })
            }
            else if (docs[0]["student"]) {
                return res.json({ success: true, student: true, teacher: false })
            }
            else {
                return res.json({ success: false, student: false, teacher: false })
            }

        }
    });
}
const signup = (req, res) => {
    const user = db.User;
    sess = req.session;
    user.find({ email: req.body.email }, function (err, docs) {
        if (err) throw err
        //console.log(docs)
        if (docs.length === 0) {
            sess.email = req.body.email
            sess.username = req.body.username
            const fg = new user({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                student: req.body.student,
                teacher: req.body.teacher
            })
            fg.save()
                .then(res => {
                    //console.log(res)

                    //console.log(sess)
                })
                .catch(err => {
                    console.log(err)
                    sess.destroy()
                })
            //console.log(sess);
            return res.json({ success: true, teacher: req.body.teacher, student: req.body.student })
        }
        else {
            return res.json({ success: false })
        }
    });



}
const teacherdashboard = (req, res) => {
    sess = req.session;
    const classroom = db.Classroom;
    classroom.find({ classowner_email: sess.email }, (err, docs) => {
        if (err) throw err
        if (docs) {
            return res.json({ class: docs })
        }
    });
}
const createclassroom = (req, res) => {
    sess = req.session;
    const classroom = db.Classroom;
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    console.log(sess);
    const cls = new classroom({
        classcode: result,
        classowner_email: sess.email,
        classname: req.body.classname,
        classowner_name: sess.username,
        meetlink: "Not available",
        test:{'addd':0}
    })
    cls.save()
        .then(doc => {
            console.log(doc)
            return res.json({ success: true, classcode: doc.classcode })
        })
        .catch(err => {
            console.log(err)
        })


}
const classData = (req, res) => {
    const classroom = db.Classroom
    classroom.findOne({ 'classcode': req.body.classCode }, function (err, result) {
        if (err) {
            console.log(err)
        }
        else {
            return res.json({ 'data': result })
        }

    })



}


const joinclass = (req, res) => {
    const classroom = db.Classroom;
    sess = req.session;
    console.log(sess)
    console.log(req.body)
    classroom.findOne({ 'classcode': req.body.classCode }, function (err, result) {
        if (err) {
            console.log(err)

        }
        else {

            if (result) {
                classroom.findOneAndUpdate({ 'classcode': req.body.classCode }, { '$push': { 'students': sess.email } },
                    function (err, raw) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            const test = raw["test"]
                            if(test){
                                var keys = Object.keys(test)
                                
                                const index = keys.indexOf('addd');
                                if (index > -1) {
                                    keys.splice(index, 1);
                                }
                                
                                for (let i = 0; i < keys.length; i++) {
                                    
                                    // var marks_keys = Object.keys(test[keys[i]]["completed"])
                                    // console.log('marks_keys',marks_keys)
                                    // const total_mark = marks_keys[0]["marks"]
                                    // console.log('total_marks',total_mark)
                                    test[keys[i]]["completed"][`${sess.email}`] = { "submissiondate": null, "marks": test[keys[i]]['totalmarks']}
                                }
                                

                            }
                            
                            classroom.findOneAndUpdate({ "classcode": req.body.classCode }, { "test": test }, (err, re) => {
                                if (err) throw err
                                const userClasses = db.userClass
                                userClasses.findOne({ 'email': sess.email }, function (err, resp) {
                                    if (err) {
                                        console.log(err)
                                    }
                                    else {
                                        console.log(resp)
                                        if (resp === null) {
                                            const newUserClass = new userClasses({
                                                'email': sess.email,
                                                'classes': [req.body.classCode]
                                            })
                                            newUserClass.save()
                                        }
                                        else {
                                            userClasses.findOneAndUpdate({ 'email': sess.email }, { '$push': { 'classes': req.body.classCode } }, function (err, result) {
                                                if (err) {
                                                    console.log(err)
                                                }
                                                else {
                                                    console.log(raw)
                                                }
                                            })

                                        }

                                    }

                                })


                                return res.json({ success: true })

                            })

                        }
                    })


            }
            else {

                return res.json({ success: false })
            }
        }
    })



}
const studentdashboard = (req, res) => {
    sess = req.session;
    const userClasses = db.userClass
    const classroom = db.Classroom;
    var classes = []
    console.log('Stu dash',sess)

    // console.log(sess.email)
    userClasses.findOne({ 'email': sess.email }, function (err, result) {
        if (err) {
            console.log(err)
        }
        else {


            if (result) {



                classroom.find({
                    'classcode': {
                        $in:
                            result['classes']
                    }
                }, function (err, docs) {
                    console.log(docs)
                    return res.json({ 'classes': docs })

                });

            }
            else{
                const ab = new userClasses({
                    'email':sess.email,
                    'classes':[]

                })
                ab.save()
                return res.json({ 'classes': [] })
            }
        }
    })

}

const testform = (req, res) => {
    const classroom = db.Classroom;
    classroom.find({ classcode: req.body.classcode }, (err, docs) => {
        if (err) throw err
        let a = {}
        console.log(docs)
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        a['testname'] = req.body.testname;
        a["testlink"] = req.body.testlink;
        a['totalmarks'] = "0/"+req.body.totalmarks
        a["duedate"] = new Date(req.body.duedate + " " + req.body.duetime)
        a["postdate"] = new Date();
        //console.log("aaaa=-",a)
        a["completed"] = {}
        for (let i = 0; i < docs[0]["students"].length; i++) {
            a["completed"][docs[0]["students"][i]] = { "submissiondate": null, "marks": `0/${req.body.totalmarks}` }
        }
        var dic = docs[0]["test"]
        dic[`${result}`] = a
        classroom.findOneAndUpdate({ "classcode": req.body.classcode }, { "test": dic }, (err, d) => {
            if (err) throw err
            return res.json({ success: true })
        });
    })
}

const send_cls_details = (req, res) => {
    const classroom = db.Classroom;
    classroom.find({ classcode: req.body.classcode }, (err, doc) => {
        if (err) throw err;
        return res.json({ docs: doc[0] })
    })
}

const meet = (req, res) => {
    const classroom = db.Classroom
    classroom.findOneAndUpdate({ 'classcode': req.body.classcode }, { "meetlink": req.body.meetlink }, { new: true }, (err, docs) => {
        if (err) throw err
        //console.log(docs)
        return res.json({ success: docs })
    })
}

const handin = (req, res) => {
    sess = req.session;
    const classroom = db.Classroom
    classroom.find({ 'classcode': req.body.classcode }, (err, docs) => {
        if (err) throw err
        const all_test = docs[0]["test"]
        console.log("before", all_test[`${req.body.testcode}`]["completed"][`${sess.email}`]["submissiondate"])
        all_test[`${req.body.testcode}`]["completed"][`${sess.email}`]["submissiondate"] = new Date();
        console.log("after", all_test[`${req.body.testcode}`]["completed"][`${sess.email}`]["submissiondate"])
        classroom.findOneAndUpdate({ "classcode": req.body.classcode }, { "test": all_test }, { new: true }, (err, d) => {
            if (err) throw err
            return res.json({ success: true })
        })

    })


}
const spreadsheet = async (req, res) => {
    const classroom = db.Classroom


    const doc = new GoogleSpreadsheet(req.body.id)
    await doc.useServiceAccountAuth({
        client_email: creds.client_email,
        private_key: creds.private_key,
    });

    await doc.loadInfo();
    //console.log(doc.title);
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    classroom.find({ "classcode": req.body.classcode }, (err, docs) => {
        if (err) throw err
        const test = docs[0]["test"]
        for (let i = 0; i < rows.length; i++) {
            if (rows[i]["email"] in test[`${req.body.testcode}`]["completed"]) {
                test[`${req.body.testcode}`]["completed"][rows[i]["email"]]["marks"] = rows[i]["Score"]
            }
            //console.log(rows[i]["Timestamp"], rows[i]["Score"], rows[i]["who is the cat lover"])
        }
        classroom.findOneAndUpdate({ "classcode": req.body.classcode }, { "test": test }, { new: true }, (err, docs) => {
            if (err) {
                return res.json({ success: false })
            }
            return res.json({ success: true })

        })



    })

}

//https://docs.google.com/spreadsheets/d/1E30ChZri8WhHDCuNQtOpg14BCnhif6NdcMUoENeonV0/edit?resourcekey#gid=1801588618
module.exports = {
    login,
    signup,
    teacherdashboard,
    createclassroom,
    studentdashboard,
    joinclass,
    testform,
    send_cls_details,
    classData,
    handin,
    meet,
    spreadsheet
}
