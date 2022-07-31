const express = require('express')
const app = express()
const port = 3000

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Jzero:qwer1234!@cluster0.vzr4q0c.mongodb.net/?retryWrites=true&w=majority', {})
.then(() => console.log('MongoDB Connected...')).catch(err => console.log(err))

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { User } = require('./models/User');

//middleware
const { auth } = require('./middleware/auth');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello Node World ~!')
})

app.post('/api/users/register', (req, res) => {

    const user = new User(req.body);
    user.save((err, userInfo) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({success: true})
    }); // mongoDB 메소드
});

app.post('/api/users/login', (req, res) => {

    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({email: req.body.email}, (err, user) => {
        if (!user) {
            return res.json({loginSuccess: false, message: "해당 이메일이 없습니다."})
        }
        //요청된 이메일이 데이터 베이스에 있다면, 비밀번호가 맞는지 확인
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch)
                return res.json({loginSuccess: false, message: "비밀번호가 틀렸습니다."})
            
            // 토큰 생성하기
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err)
                // 토큰을 저장한다. 장소: 쿠키, 세션, 로컬스토리지 (쿠키)
                    res.cookie("x_auth", user.token)
                    .status(200)
                    .json({loginSuccess: true, userId:user._id})
            })
        })
    });
});

app.get('/api/users/auth', auth, (req, res) => {
    //auth 미들웨어 추가
    res.status(200).json({
        _id: req.user._id,
        // 0 일반 유저, 그외 관리자
        isAdmin: req.user.role === 0 ? false : true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image,
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id},
        {token: ""},
        (err, user) => {
            if (err) return res.json({ success: false, err});
            return res.status(200).send({success: true})
        })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})