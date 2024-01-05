const isLogin = async (req, res, next) => {

    try {
        if (req.session.userData) {
            next();
        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.userData) {
            res.redirect('/loginHome');
            return;
        }
        next();
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}